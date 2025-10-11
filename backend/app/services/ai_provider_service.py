"""
AI Provider Service
Abstraction layer for multiple AI providers (OpenAI, Groq, Gemini)
"""

import os
import logging
from typing import List, Dict, Any, Optional
from openai import AsyncOpenAI
from groq import AsyncGroq
import google.generativeai as genai

logger = logging.getLogger(__name__)


class AIProviderService:
    """Unified interface for multiple AI providers"""

    def __init__(self):
        # Initialize API clients with keys from environment (Doppler)
        self.openai_client = None
        self.groq_client = None
        self.gemini_model = None

        # Load OpenAI
        if os.getenv("OPENAI_API_KEY"):
            try:
                self.openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
                logger.info("✅ OpenAI provider initialized")
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI: {e}")

        # Load Groq
        if os.getenv("GROQ_API_KEY"):
            try:
                self.groq_client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))
                logger.info("✅ Groq provider initialized")
            except Exception as e:
                logger.error(f"Failed to initialize Groq: {e}")

        # Load Gemini
        if os.getenv("GEMINI_API_KEY"):
            try:
                genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
                self.gemini_model = genai.GenerativeModel('gemini-1.5-pro')
                logger.info("✅ Gemini provider initialized")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini: {e}")

    def is_provider_available(self, provider: str) -> bool:
        """Check if a provider is available"""
        if provider == "openai":
            return self.openai_client is not None
        elif provider == "groq":
            return self.groq_client is not None
        elif provider == "gemini":
            return self.gemini_model is not None
        return False

    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        tools: Optional[List[Dict[str, Any]]] = None,
        preferred_model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        stream: bool = False,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Unified chat completion with automatic fallback

        Returns:
            {
                "content": str,
                "model": str,
                "provider": str,
                "tool_calls": Optional[List],
                "usage": {"prompt_tokens": int, "completion_tokens": int, "total_tokens": int},
                "finish_reason": str,
                "cost_usd": float
            }
        """
        # Determine provider order
        providers_to_try = self._get_provider_order(preferred_model)

        last_error = None

        for provider in providers_to_try:
            try:
                if provider == "openai" and self.openai_client:
                    return await self._call_openai(messages, tools, temperature, max_tokens)
                elif provider == "groq" and self.groq_client:
                    return await self._call_groq(messages, tools, temperature, max_tokens)
                elif provider == "gemini" and self.gemini_model:
                    return await self._call_gemini(messages, temperature, max_tokens)
            except Exception as e:
                logger.warning(f"{provider} failed: {e}, trying next provider...")
                last_error = e
                continue

        # All providers failed
        raise Exception(f"All AI providers failed. Last error: {last_error}")

    def _get_provider_order(self, preferred: Optional[str]) -> List[str]:
        """Get ordered list of providers to try"""
        if preferred:
            # Try preferred first, then others
            order = [preferred]
            for p in ["openai", "groq", "gemini"]:
                if p != preferred:
                    order.append(p)
            return order

        # Default order: OpenAI (reliable) → Groq (free) → Gemini (fallback)
        return ["openai", "groq", "gemini"]

    async def _call_openai(
        self,
        messages: List[Dict[str, str]],
        tools: Optional[List[Dict[str, Any]]],
        temperature: float,
        max_tokens: Optional[int]
    ) -> Dict[str, Any]:
        """Call OpenAI API"""
        params = {
            "model": "gpt-4o-mini",
            "messages": messages,
            "temperature": temperature,
        }

        if max_tokens:
            params["max_tokens"] = max_tokens

        if tools:
            # Convert to OpenAI tool format
            params["tools"] = [
                {
                    "type": "function",
                    "function": {
                        "name": tool["name"],
                        "description": tool["description"],
                        "parameters": tool["parameters"]
                    }
                } for tool in tools
            ]

        response = await self.openai_client.chat.completions.create(**params)

        # Extract tool calls if any
        tool_calls = None
        if response.choices[0].message.tool_calls:
            tool_calls = [
                {
                    "id": tc.id,
                    "name": tc.function.name,
                    "arguments": tc.function.arguments
                } for tc in response.choices[0].message.tool_calls
            ]

        # Calculate cost (GPT-4o-mini pricing)
        prompt_tokens = response.usage.prompt_tokens
        completion_tokens = response.usage.completion_tokens
        cost_usd = (prompt_tokens * 0.150 / 1_000_000) + (completion_tokens * 0.600 / 1_000_000)

        return {
            "content": response.choices[0].message.content or "",
            "model": "gpt-4o-mini",
            "provider": "openai",
            "tool_calls": tool_calls,
            "usage": {
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": response.usage.total_tokens
            },
            "finish_reason": response.choices[0].finish_reason,
            "cost_usd": cost_usd
        }

    async def _call_groq(
        self,
        messages: List[Dict[str, str]],
        tools: Optional[List[Dict[str, Any]]],
        temperature: float,
        max_tokens: Optional[int]
    ) -> Dict[str, Any]:
        """Call Groq API"""
        params = {
            "model": "llama-3.3-70b-versatile",
            "messages": messages,
            "temperature": temperature,
        }

        if max_tokens:
            params["max_tokens"] = max_tokens

        if tools:
            params["tools"] = [
                {
                    "type": "function",
                    "function": {
                        "name": tool["name"],
                        "description": tool["description"],
                        "parameters": tool["parameters"]
                    }
                } for tool in tools
            ]

        response = await self.groq_client.chat.completions.create(**params)

        # Extract tool calls
        tool_calls = None
        if response.choices[0].message.tool_calls:
            tool_calls = [
                {
                    "id": tc.id,
                    "name": tc.function.name,
                    "arguments": tc.function.arguments
                } for tc in response.choices[0].message.tool_calls
            ]

        return {
            "content": response.choices[0].message.content or "",
            "model": "llama-3.3-70b-versatile",
            "provider": "groq",
            "tool_calls": tool_calls,
            "usage": {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens
            },
            "finish_reason": response.choices[0].finish_reason,
            "cost_usd": 0.0  # Groq is free
        }

    async def _call_gemini(
        self,
        messages: List[Dict[str, str]],
        temperature: float,
        max_tokens: Optional[int]
    ) -> Dict[str, Any]:
        """Call Gemini API"""
        # Convert messages to Gemini format
        gemini_messages = []
        for msg in messages:
            if msg["role"] == "system":
                # Gemini doesn't have system role, prepend to first user message
                continue
            gemini_messages.append({
                "role": "user" if msg["role"] == "user" else "model",
                "parts": [msg["content"]]
            })

        # Generate response
        response = await self.gemini_model.generate_content_async(
            gemini_messages,
            generation_config={
                "temperature": temperature,
                "max_output_tokens": max_tokens or 2048,
            }
        )

        # Estimate tokens (Gemini doesn't provide exact counts)
        prompt_tokens = sum(len(msg["content"].split()) for msg in messages) * 1.3
        completion_tokens = len(response.text.split()) * 1.3
        total_tokens = int(prompt_tokens + completion_tokens)

        # Calculate cost (Gemini 1.5 Pro pricing)
        cost_usd = (prompt_tokens * 1.25 / 1_000_000) + (completion_tokens * 5.0 / 1_000_000)

        return {
            "content": response.text,
            "model": "gemini-1.5-pro",
            "provider": "gemini",
            "tool_calls": None,  # Gemini tool calling not implemented yet
            "usage": {
                "prompt_tokens": int(prompt_tokens),
                "completion_tokens": int(completion_tokens),
                "total_tokens": total_tokens
            },
            "finish_reason": "stop",
            "cost_usd": cost_usd
        }
