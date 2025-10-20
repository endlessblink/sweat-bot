"""
AI Chat Proxy API
Securely proxies AI requests to cloud providers with rate limiting and cost tracking
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Literal
from datetime import datetime
import logging

from app.models.models import User
from app.api.v1.auth import get_current_user
from app.services.ai_provider_service import AIProviderService
from app.services.rate_limiter import check_rate_limit, RateLimitExceeded
from app.services.cost_tracker import track_ai_usage

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize AI provider service
ai_service = AIProviderService()


# Pydantic models
class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str


class ToolDefinition(BaseModel):
    name: str
    description: str
    parameters: Dict[str, Any]


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    tools: Optional[List[ToolDefinition]] = None
    model: Optional[str] = Field(None, description="Specific model override (openai, groq, gemini)")
    temperature: Optional[float] = Field(0.7, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(None, ge=1, le=4096)
    stream: bool = False


class ChatResponse(BaseModel):
    content: str
    model: str
    provider: str
    tool_calls: Optional[List[Dict[str, Any]]] = None
    usage: Dict[str, int]  # {prompt_tokens, completion_tokens, total_tokens}
    finish_reason: str


@router.post("/chat", response_model=ChatResponse)
async def ai_chat_proxy(
    request: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Proxy AI chat requests with server-side API keys

    Benefits:
    - API keys never exposed to frontend
    - Rate limiting per user
    - Cost tracking for billing
    - Centralized error handling
    - Fallback chain across providers
    """
    try:
        # Check rate limit
        user_id = str(current_user.id)

        try:
            await check_rate_limit(
                user_id=user_id,
                is_premium=current_user.role == "premium_user"
            )
        except RateLimitExceeded as e:
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "rate_limit_exceeded",
                    "message": str(e),
                    "retry_after": e.retry_after
                }
            )

        # Convert Pydantic models to dicts
        messages = [msg.dict() for msg in request.messages]
        tools = [tool.dict() for tool in request.tools] if request.tools else None

        # Call AI provider service
        response = await ai_service.chat_completion(
            messages=messages,
            tools=tools,
            preferred_model=request.model,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            stream=request.stream,
            user_id=user_id
        )

        # Track costs for billing
        await track_ai_usage(
            user_id=user_id,
            provider=response["provider"],
            model=response["model"],
            tokens=response["usage"],
            cost_usd=response.get("cost_usd", 0.0)
        )

        # Log request for monitoring
        logger.info(
            f"AI chat proxy - user: {current_user.username}, "
            f"provider: {response['provider']}, "
            f"tokens: {response['usage']['total_tokens']}"
        )

        return ChatResponse(**response)

    except RateLimitExceeded:
        raise  # Re-raise rate limit errors
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        logger.error(f"AI chat proxy error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"AI service error: {str(e)}"
        )


@router.get("/models")
async def list_available_models(
    current_user: User = Depends(get_current_user)
):
    """List available AI models"""
    return {
        "models": [
            {
                "id": "openai",
                "name": "GPT-4o-mini",
                "provider": "OpenAI",
                "cost_per_1m_tokens": {"input": 0.15, "output": 0.60},
                "available": ai_service.is_provider_available("openai")
            },
            {
                "id": "groq",
                "name": "LLaMA 3.3 70B",
                "provider": "Groq",
                "cost_per_1m_tokens": {"input": 0.0, "output": 0.0},  # Free tier
                "available": ai_service.is_provider_available("groq")
            },
            {
                "id": "gemini",
                "name": "Gemini 1.5 Pro",
                "provider": "Google",
                "cost_per_1m_tokens": {"input": 1.25, "output": 5.0},
                "available": ai_service.is_provider_available("gemini")
            }
        ]
    }


@router.get("/usage/stats")
async def get_usage_stats(
    current_user: User = Depends(get_current_user)
):
    """Get AI usage statistics for current user"""
    from app.services.cost_tracker import get_user_usage_stats

    stats = await get_user_usage_stats(str(current_user.id))

    return {
        "user_id": str(current_user.id),
        "usage": stats,
        "rate_limit": {
            "daily_limit": 10 if current_user.role != "premium_user" else None,
            "is_premium": current_user.role == "premium_user"
        }
    }
