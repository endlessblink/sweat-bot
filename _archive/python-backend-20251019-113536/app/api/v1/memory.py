"""
Memory API Endpoints for SweatBot
Handles conversation storage and retrieval from MongoDB
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging

from app.models.models import User
from app.api.v1.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB connection
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://sweatbot:secure_password@localhost:8002/")
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "sweatbot_conversations")

# Initialize MongoDB client
mongo_client = AsyncIOMotorClient(MONGODB_URL)
mongo_db = mongo_client[MONGODB_DATABASE]
conversations_collection = mongo_db["conversations"]

# Pydantic models
class Message(BaseModel):
    role: str = Field(..., description="Message role: user, assistant, system")
    content: str = Field(..., description="Message content")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Optional[Dict[str, Any]] = Field(None)

class StoreMessageRequest(BaseModel):
    userId: str
    message: Message
    sessionId: Optional[str] = None  # Optional session ID from frontend

class ConversationSession(BaseModel):
    session_id: str
    user_id: str
    messages: List[Message]
    created_at: datetime
    updated_at: datetime
    metadata: Optional[Dict[str, Any]] = None

@router.get("/context/{user_id}")
async def get_user_context(
    user_id: str,
    limit: int = 20,
    current_user: User = Depends(get_current_user)
):
    """Get recent conversation context for a user"""
    try:
        # Find most recent conversation for user
        cursor = conversations_collection.find(
            {"user_id": user_id}
        ).sort("updated_at", -1).limit(1)

        conversations = await cursor.to_list(length=1)

        if not conversations:
            return {"messages": []}

        conversation = conversations[0]
        messages = conversation.get("messages", [])[-limit:]

        return {
            "messages": messages,
            "session_id": conversation.get("session_id"),
            "total_messages": len(conversation.get("messages", []))
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load context: {str(e)}"
        )

@router.post("/message")
async def store_message(
    request: StoreMessageRequest,
    current_user: User = Depends(get_current_user)
):
    """Store a single message in MongoDB"""
    try:
        # Log authentication success
        print(f"========= [MEMORY] Auth successful - user: {current_user.username} (id: {current_user.id}) =========")
        logger.info(f"[MEMORY] Auth successful - user: {current_user.username} (id: {current_user.id})")

        user_id = request.userId
        message = request.message.dict()
        frontend_session_id = request.sessionId

        print(f"========= [MEMORY] Storing message for user_id: {user_id}, session_id: {frontend_session_id} =========")
        print(f"========= [MEMORY] Message content: role={message.get('role')}, content={message.get('content')[:50]} =========")
        logger.info(f"[MEMORY] Storing message for user_id: {user_id}, session_id: {frontend_session_id}")
        logger.debug(f"[MEMORY] Message content: role={message.get('role')}, content_length={len(message.get('content', ''))}")

        # If session ID provided, find that specific session
        if frontend_session_id:
            logger.debug(f"[MEMORY] Looking for existing session: {frontend_session_id}")
            existing = await conversations_collection.find_one({
                "user_id": user_id,
                "session_id": frontend_session_id
            })
        else:
            logger.debug(f"[MEMORY] No session ID provided, finding most recent session")
            existing = await conversations_collection.find_one(
                {"user_id": user_id},
                sort=[("updated_at", -1)]
            )

        if existing:
            # Append to existing session
            logger.info(f"[MEMORY] Appending to existing session: {existing.get('session_id')}")
            result = await conversations_collection.update_one(
                {"_id": existing["_id"]},
                {
                    "$push": {"messages": message},
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
            logger.debug(f"[MEMORY] Update result: matched={result.matched_count}, modified={result.modified_count}")
            session_id = existing["session_id"]
        else:
            # Create new session with provided ID or generate one
            session_id = frontend_session_id or f"session_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
            print(f"========= [MEMORY] Creating new session: {session_id} =========")
            logger.info(f"[MEMORY] Creating new session: {session_id}")

            doc_to_insert = {
                "session_id": session_id,
                "user_id": user_id,
                "messages": [message],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "metadata": {}
            }
            print(f"========= [MEMORY] About to insert document: {doc_to_insert} =========")

            insert_result = await conversations_collection.insert_one(doc_to_insert)
            print(f"========= [MEMORY] Insert result: inserted_id={insert_result.inserted_id} =========")
            logger.debug(f"[MEMORY] Insert result: inserted_id={insert_result.inserted_id}")

        print(f"========= [MEMORY] ✅ Message stored successfully in session: {session_id} =========")
        logger.info(f"[MEMORY] ✅ Message stored successfully in session: {session_id}")

        return {
            "success": True,
            "session_id": session_id,
            "message": "Message stored successfully"
        }

    except HTTPException:
        # Re-raise HTTP exceptions (like auth failures)
        logger.error(f"[MEMORY] ❌ HTTP Exception in store_message")
        raise
    except Exception as e:
        logger.error(f"[MEMORY] ❌ Failed to store message: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to store message: {str(e)}"
        )

@router.delete("/clear/{user_id}")
async def clear_user_history(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """Clear all conversation history for a user"""
    try:
        result = await conversations_collection.delete_many({"user_id": user_id})

        return {
            "success": True,
            "deleted_count": result.deleted_count,
            "message": "History cleared successfully"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear history: {str(e)}"
        )

@router.post("/search")
async def search_conversations(
    userId: str,
    query: str,
    current_user: User = Depends(get_current_user)
):
    """Search conversation history"""
    try:
        # Search messages containing query
        cursor = conversations_collection.find({
            "user_id": userId,
            "messages.content": {"$regex": query, "$options": "i"}
        }).sort("updated_at", -1).limit(10)

        conversations = await cursor.to_list(length=10)

        # Extract matching messages
        matching_messages = []
        for conv in conversations:
            for msg in conv.get("messages", []):
                if query.lower() in msg.get("content", "").lower():
                    matching_messages.append({
                        **msg,
                        "session_id": conv.get("session_id")
                    })

        return {
            "messages": matching_messages[:20],  # Limit to 20 results
            "total_found": len(matching_messages)
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Search failed: {str(e)}"
        )

@router.get("/stats/{user_id}")
async def get_conversation_stats(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get conversation statistics for a user"""
    try:
        # Count total sessions
        total_sessions = await conversations_collection.count_documents({"user_id": user_id})

        # Get total messages
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$project": {"message_count": {"$size": "$messages"}}},
            {"$group": {"_id": None, "total_messages": {"$sum": "$message_count"}}}
        ]

        result = await conversations_collection.aggregate(pipeline).to_list(length=1)
        total_messages = result[0]["total_messages"] if result else 0

        # Get first and last conversation dates
        first_conv = await conversations_collection.find_one(
            {"user_id": user_id},
            sort=[("created_at", 1)]
        )

        last_conv = await conversations_collection.find_one(
            {"user_id": user_id},
            sort=[("updated_at", -1)]
        )

        return {
            "total_sessions": total_sessions,
            "total_messages": total_messages,
            "first_conversation": first_conv.get("created_at") if first_conv else None,
            "last_conversation": last_conv.get("updated_at") if last_conv else None,
            "user_id": user_id
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get stats: {str(e)}"
        )

@router.get("/sessions")
async def list_user_sessions(
    limit: int = 20,
    current_user: User = Depends(get_current_user)
):
    """List all conversation sessions for current user"""
    try:
        user_id = str(current_user.id)
        logger.info(f"[MEMORY] Listing sessions for user: {current_user.username} (id: {user_id})")

        # Use aggregation pipeline to deduplicate by session_id (keep latest)
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$sort": {"updated_at": -1}},
            {"$group": {
                "_id": "$session_id",  # Group by session_id to deduplicate
                "session_id": {"$first": "$session_id"},
                "created_at": {"$first": "$created_at"},
                "updated_at": {"$first": "$updated_at"},
                "messages": {"$first": "$messages"},
                "metadata": {"$first": "$metadata"}
            }},
            {"$sort": {"updated_at": -1}},
            {"$limit": limit}
        ]

        sessions = await conversations_collection.aggregate(pipeline).to_list(length=limit)
        logger.debug(f"[MEMORY] Found {len(sessions)} sessions (after deduplication)")

        # Format sessions for frontend
        formatted_sessions = []
        for session in sessions:
            messages = session.get("messages", [])
            first_user_msg = next((m for m in messages if m.get("role") == "user"), None)

            formatted_sessions.append({
                "session_id": session.get("session_id"),
                "created_at": session.get("created_at"),
                "updated_at": session.get("updated_at"),
                "message_count": len(messages),
                "preview": first_user_msg.get("content", "")[:100] if first_user_msg else "",
                "metadata": session.get("metadata", {})
            })

        logger.info(f"[MEMORY] ✅ Returning {len(formatted_sessions)} sessions")

        return {
            "sessions": formatted_sessions,
            "total": len(formatted_sessions)
        }

    except HTTPException:
        logger.error(f"[MEMORY] ❌ HTTP Exception in list_sessions")
        raise
    except Exception as e:
        logger.error(f"[MEMORY] ❌ Failed to list sessions: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list sessions: {str(e)}"
        )

@router.get("/session/{session_id}")
async def get_session_messages(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all messages from a specific session (aggregates duplicate documents)"""
    try:
        user_id = str(current_user.id)

        # Find ALL documents with this session_id (there might be duplicates)
        cursor = conversations_collection.find({
            "session_id": session_id,
            "user_id": user_id
        }).sort("created_at", 1)
        
        sessions = await cursor.to_list(length=100)

        if not sessions:
            raise HTTPException(
                status_code=404,
                detail="Session not found"
            )

        # Aggregate messages from all duplicate documents
        all_messages = []
        earliest_created = sessions[0].get("created_at")
        latest_updated = sessions[0].get("updated_at")
        metadata = sessions[0].get("metadata", {})
        
        for session in sessions:
            messages = session.get("messages", [])
            all_messages.extend(messages)
            
            # Track earliest created_at and latest updated_at
            created_at = session.get("created_at")
            updated_at = session.get("updated_at")
            if created_at and created_at < earliest_created:
                earliest_created = created_at
            if updated_at and updated_at > latest_updated:
                latest_updated = updated_at
        
        # Sort messages by timestamp
        all_messages.sort(key=lambda m: m.get("timestamp", datetime.min))
        
        logger.info(f"[MEMORY] Loaded session {session_id}: {len(sessions)} documents, {len(all_messages)} total messages")

        return {
            "session_id": session_id,
            "messages": all_messages,
            "created_at": earliest_created,
            "updated_at": latest_updated,
            "metadata": metadata
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get session: {str(e)}"
        )
