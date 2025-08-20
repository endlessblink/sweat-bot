"""
Enhanced WebSocket Connection Manager with User Context Persistence
Handles real-time connections for chat, voice streaming, and live updates
Provides seamless user experience with persistent context across sessions
"""

from typing import Dict, List, Set, Optional, Any
from fastapi import WebSocket, WebSocketDisconnect
import json
import asyncio
import logging
from datetime import datetime
from enum import Enum

from app.services.user_context_manager import user_context_manager

logger = logging.getLogger(__name__)

class MessageType(Enum):
    """WebSocket message types"""
    # Client -> Server
    CLIENT_SEND_MESSAGE = "client:send_message"
    CLIENT_VOICE_CHUNK = "client:voice_chunk"
    CLIENT_EXERCISE_LOG = "client:exercise_log"
    CLIENT_REQUEST_STATS = "client:request_stats"
    CLIENT_JOIN_ROOM = "client:join_room"
    CLIENT_LEAVE_ROOM = "client:leave_room"
    CLIENT_PING = "client:ping"
    CLIENT_CONTEXT_UPDATE = "client:context_update"
    
    # Server -> Client
    SERVER_MESSAGE = "server:message"
    SERVER_TRANSCRIPTION = "server:transcription"
    SERVER_UI_COMPONENT = "server:ui_component"
    SERVER_ACHIEVEMENT = "server:achievement"
    SERVER_STATS_UPDATE = "server:stats_update"
    SERVER_ERROR = "server:error"
    SERVER_PONG = "server:pong"
    SERVER_NOTIFICATION = "server:notification"
    SERVER_CONTEXT_RESTORED = "server:context_restored"
    SERVER_WELCOME = "server:welcome"

class ConnectionManager:
    """Enhanced WebSocket connection manager with persistent user context"""
    
    def __init__(self):
        # Active connections: user_id -> WebSocket
        self.active_connections: Dict[str, WebSocket] = {}
        
        # Room subscriptions: room_id -> Set[user_id]
        self.rooms: Dict[str, Set[str]] = {}
        
        # Voice stream buffers: user_id -> audio chunks
        self.voice_buffers: Dict[str, List[bytes]] = {}
        
        # Connection metadata with user context
        self.connection_metadata: Dict[str, Dict[str, Any]] = {}
        
        # Message queue for offline users
        self.offline_queue: Dict[str, List[Dict]] = {}
        
        # User context cache for active sessions
        self.context_cache: Dict[str, Dict[str, Any]] = {}
        
    async def connect(self, websocket: WebSocket, user_id: str, user=None, db_session=None, metadata: Dict[str, Any] = None):
        """Accept new WebSocket connection with context restoration"""
        await websocket.accept()
        
        # Close existing connection if any
        if user_id in self.active_connections:
            await self.disconnect(user_id)
        
        # Initialize user context manager
        await user_context_manager.initialize()
        
        # Restore or build user context
        restored_context = await user_context_manager.get_user_context(user_id)
        
        if not restored_context and user and db_session:
            # Build fresh context from database
            restored_context = await user_context_manager.build_initial_user_context(user, db_session)
            await user_context_manager.store_user_context(user_id, restored_context)
        
        # Store connection and context
        self.active_connections[user_id] = websocket
        self.connection_metadata[user_id] = metadata or {}
        self.connection_metadata[user_id]["connected_at"] = datetime.now()
        self.connection_metadata[user_id]["context_restored"] = bool(restored_context)
        
        # Cache context for quick access
        self.context_cache[user_id] = restored_context or {}
        
        # Send queued messages if any
        if user_id in self.offline_queue:
            for message in self.offline_queue[user_id]:
                await self.send_personal_message(message, user_id)
            del self.offline_queue[user_id]
        
        logger.info(f"✅ User {user_id} connected with context: {bool(restored_context)}")
        
        # Send personalized welcome message
        welcome_message = self._build_welcome_message(restored_context, user_id)
        await self.send_personal_message({
            "type": MessageType.SERVER_WELCOME.value,
            "data": {
                "message": welcome_message,
                "context_restored": bool(restored_context),
                "user_stats": self._extract_user_stats(restored_context),
                "connection_id": user_id,
                "timestamp": datetime.now().isoformat()
            }
        }, user_id)
    
    def _build_welcome_message(self, context: Dict[str, Any], user_id: str) -> str:
        """Build personalized welcome message based on user context"""
        if not context:
            return "שלום! איך אני יכול לעזור לך היום? 💪"
        
        username = context.get("username", user_id)
        total_points = context.get("total_points", 0)
        today_exercises = context.get("today_exercises", 0)
        fitness_level = context.get("fitness_profile", {}).get("fitness_level", "")
        
        # Special greeting for user Noam
        if username.lower() == "noam":
            if today_exercises > 0:
                return f"שלום נועם! כבר עשית {today_exercises} תרגילים היום - אלוף! איך הרגשת? 🔥"
            elif total_points > 0:
                return f"נועם! ברוך הבא חזרה. יש לך {total_points} נקודות. מוכן להמשיך? 💪"
            else:
                return "שלום נועם! איך אתה מרגיש היום? בוא נתחיל לעקוב אחרי האימונים שלך! 🌟"
        
        # General welcome messages
        if today_exercises > 0:
            return f"שלום {username}! כבר עשית {today_exercises} תרגילים היום - מעולה! איך המשך? 🔥"
        elif total_points > 0:
            return f"ברוך הבא {username}! יש לך {total_points} נקודות. מוכן להמשיך באימונים? 💪"
        else:
            return f"שלום {username}! איך אתה מרגיש היום? בוא נתחיל לעקוב אחרי האימונים שלך! 🌟"
    
    def _extract_user_stats(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Extract key user statistics from context"""
        if not context:
            return {}
        
        return {
            "total_points": context.get("total_points", 0),
            "today_points": context.get("today_points", 0),
            "total_exercises": context.get("total_exercises", 0),
            "today_exercises": context.get("today_exercises", 0),
            "fitness_level": context.get("fitness_profile", {}).get("fitness_level", ""),
            "recent_workouts": len(context.get("recent_workouts", [])),
            "personal_records": len(context.get("personal_records", []))
        }
    
    async def disconnect(self, user_id: str):
        """Handle WebSocket disconnection with context preservation"""
        if user_id in self.active_connections:
            # Update user context with session end
            if user_id in self.context_cache:
                session_duration = None
                if user_id in self.connection_metadata:
                    connected_at = self.connection_metadata[user_id].get("connected_at")
                    if connected_at:
                        session_duration = (datetime.now() - connected_at).total_seconds()
                
                await user_context_manager.update_user_context(user_id, {
                    "last_session_end": datetime.now().isoformat(),
                    "session_duration": session_duration
                })
            
            # Leave all rooms
            for room_id in list(self.rooms.keys()):
                if user_id in self.rooms[room_id]:
                    self.rooms[room_id].discard(user_id)
                    if not self.rooms[room_id]:
                        del self.rooms[room_id]
            
            # Clear voice buffer
            if user_id in self.voice_buffers:
                del self.voice_buffers[user_id]
            
            # Clear context cache
            if user_id in self.context_cache:
                del self.context_cache[user_id]
            
            # Remove connection
            del self.active_connections[user_id]
            
            # Update metadata
            if user_id in self.connection_metadata:
                self.connection_metadata[user_id]["disconnected_at"] = datetime.now()
            
            logger.info(f"✅ User {user_id} disconnected, context preserved")
    
    async def update_user_context(self, user_id: str, updates: Dict[str, Any]):
        """Update user context and cache"""
        try:
            # Update Redis context
            await user_context_manager.update_user_context(user_id, updates)
            
            # Update local cache
            if user_id in self.context_cache:
                self.context_cache[user_id].update(updates)
            
            logger.debug(f"📝 Updated context for user {user_id}")
            
        except Exception as e:
            logger.error(f"❌ Failed to update context for user {user_id}: {e}")
    
    async def get_user_context(self, user_id: str) -> Dict[str, Any]:
        """Get user context from cache or Redis"""
        try:
            # Try cache first
            if user_id in self.context_cache:
                return self.context_cache[user_id]
            
            # Fallback to Redis
            context = await user_context_manager.get_user_context(user_id)
            if context:
                self.context_cache[user_id] = context
            
            return context
            
        except Exception as e:
            logger.error(f"❌ Failed to get context for user {user_id}: {e}")
            return {}
    
    async def send_personal_message(self, message: Dict, user_id: str):
        """Send message to specific user"""
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(message)
            except Exception as e:
                logger.error(f"Error sending message to {user_id}: {e}")
                await self.disconnect(user_id)
        else:
            # Queue message for offline user
            if user_id not in self.offline_queue:
                self.offline_queue[user_id] = []
            self.offline_queue[user_id].append(message)
    
    async def broadcast_to_room(self, message: Dict, room_id: str, exclude_user: str = None):
        """Broadcast message to all users in a room"""
        if room_id not in self.rooms:
            return
        
        disconnected_users = []
        
        for user_id in self.rooms[room_id]:
            if user_id != exclude_user:
                if user_id in self.active_connections:
                    try:
                        await self.active_connections[user_id].send_json(message)
                    except Exception as e:
                        logger.error(f"Error broadcasting to {user_id}: {e}")
                        disconnected_users.append(user_id)
        
        # Clean up disconnected users
        for user_id in disconnected_users:
            await self.disconnect(user_id)
    
    async def broadcast_to_all(self, message: Dict):
        """Broadcast message to all connected users"""
        disconnected_users = []
        
        for user_id, connection in self.active_connections.items():
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to {user_id}: {e}")
                disconnected_users.append(user_id)
        
        # Clean up disconnected users
        for user_id in disconnected_users:
            await self.disconnect(user_id)
    
    async def join_room(self, user_id: str, room_id: str):
        """Add user to a room"""
        if room_id not in self.rooms:
            self.rooms[room_id] = set()
        
        self.rooms[room_id].add(user_id)
        
        # Notify room members
        await self.broadcast_to_room({
            "type": MessageType.SERVER_NOTIFICATION.value,
            "data": {
                "event": "user_joined",
                "user_id": user_id,
                "room_id": room_id,
                "timestamp": datetime.now().isoformat()
            }
        }, room_id, exclude_user=user_id)
        
        logger.info(f"User {user_id} joined room {room_id}")
    
    async def leave_room(self, user_id: str, room_id: str):
        """Remove user from a room"""
        if room_id in self.rooms and user_id in self.rooms[room_id]:
            self.rooms[room_id].discard(user_id)
            
            # Delete empty room
            if not self.rooms[room_id]:
                del self.rooms[room_id]
            else:
                # Notify remaining members
                await self.broadcast_to_room({
                    "type": MessageType.SERVER_NOTIFICATION.value,
                    "data": {
                        "event": "user_left",
                        "user_id": user_id,
                        "room_id": room_id,
                        "timestamp": datetime.now().isoformat()
                    }
                }, room_id)
            
            logger.info(f"User {user_id} left room {room_id}")
    
    async def handle_voice_chunk(self, user_id: str, audio_chunk: bytes):
        """Handle incoming voice audio chunk with immediate feedback"""
        if user_id not in self.voice_buffers:
            self.voice_buffers[user_id] = []
            # Send immediate recording started confirmation
            await self.send_personal_message({
                "type": MessageType.SERVER_NOTIFICATION.value,
                "data": {
                    "event": "recording_started",
                    "message": "🎤 מתחיל להקליט...",
                    "timestamp": datetime.now().isoformat()
                }
            }, user_id)
        
        self.voice_buffers[user_id].append(audio_chunk)
        
        # Send periodic feedback every few chunks
        if len(self.voice_buffers[user_id]) % 5 == 0:
            await self.send_personal_message({
                "type": MessageType.SERVER_NOTIFICATION.value,
                "data": {
                    "event": "recording_progress",
                    "message": f"🎵 הקלטה... ({len(self.voice_buffers[user_id])} חלקים)",
                    "timestamp": datetime.now().isoformat()
                }
            }, user_id)
        
        # Process when buffer reaches threshold (e.g., 1 second of audio)
        # This would typically be ~16000 bytes for 16kHz mono audio
        if sum(len(chunk) for chunk in self.voice_buffers[user_id]) >= 16000:
            audio_data = b''.join(self.voice_buffers[user_id])
            self.voice_buffers[user_id] = []
            
            # Send processing confirmation
            await self.send_personal_message({
                "type": MessageType.SERVER_NOTIFICATION.value,
                "data": {
                    "event": "processing_audio",
                    "message": "🔄 מעבד הקלטה...",
                    "timestamp": datetime.now().isoformat()
                }
            }, user_id)
            
            # Return the complete audio for processing
            return audio_data
        
        return None
    
    async def send_achievement_notification(self, user_id: str, achievement_data: Dict):
        """Send achievement notification with special formatting"""
        message = {
            "type": MessageType.SERVER_ACHIEVEMENT.value,
            "data": {
                **achievement_data,
                "timestamp": datetime.now().isoformat(),
                "celebration": True
            }
        }
        
        await self.send_personal_message(message, user_id)
        
        # Also broadcast to user's workout room if exists
        workout_room = f"workout_{user_id}"
        if workout_room in self.rooms:
            await self.broadcast_to_room(message, workout_room)
    
    async def send_ui_component(self, user_id: str, component_data: Dict):
        """Send UI component for rendering"""
        message = {
            "type": MessageType.SERVER_UI_COMPONENT.value,
            "data": {
                **component_data,
                "timestamp": datetime.now().isoformat()
            }
        }
        
        await self.send_personal_message(message, user_id)
    
    async def send_stats_update(self, user_id: str, stats: Dict):
        """Send real-time stats update"""
        message = {
            "type": MessageType.SERVER_STATS_UPDATE.value,
            "data": {
                "stats": stats,
                "timestamp": datetime.now().isoformat()
            }
        }
        
        await self.send_personal_message(message, user_id)
    
    async def handle_message(self, user_id: str, message: Dict):
        """Route incoming WebSocket message"""
        try:
            message_type = message.get("type")
            data = message.get("data", {})
            
            if message_type == MessageType.CLIENT_PING.value:
                # Respond to ping
                await self.send_personal_message({
                    "type": MessageType.SERVER_PONG.value,
                    "data": {"timestamp": datetime.now().isoformat()}
                }, user_id)
                
            elif message_type == MessageType.CLIENT_JOIN_ROOM.value:
                room_id = data.get("room_id")
                if room_id:
                    await self.join_room(user_id, room_id)
                    
            elif message_type == MessageType.CLIENT_LEAVE_ROOM.value:
                room_id = data.get("room_id")
                if room_id:
                    await self.leave_room(user_id, room_id)
                    
            elif message_type == MessageType.CLIENT_VOICE_CHUNK.value:
                # Handle voice data
                audio_chunk = data.get("audio")
                if audio_chunk:
                    # Convert from base64 if needed
                    if isinstance(audio_chunk, str):
                        import base64
                        audio_chunk = base64.b64decode(audio_chunk)
                    
                    complete_audio = await self.handle_voice_chunk(user_id, audio_chunk)
                    if complete_audio:
                        # Return for processing by voice service
                        return {
                            "type": "voice_ready",
                            "audio": complete_audio,
                            "user_id": user_id
                        }
                        
            elif message_type == MessageType.CLIENT_SEND_MESSAGE.value:
                # Handle chat message with context
                user_context = await self.get_user_context(user_id)
                return {
                    "type": "chat_message",
                    "message": data.get("message"),
                    "model": data.get("model", "gemini-1.5-flash"),
                    "user_id": user_id,
                    "user_context": user_context
                }
                
            elif message_type == MessageType.CLIENT_EXERCISE_LOG.value:
                # Handle exercise log with context
                user_context = await self.get_user_context(user_id)
                return {
                    "type": "exercise_log",
                    "exercise": data,
                    "user_id": user_id,
                    "user_context": user_context
                }
                
            elif message_type == MessageType.CLIENT_REQUEST_STATS.value:
                # Handle stats request with immediate response from context
                user_context = await self.get_user_context(user_id)
                stats = self._extract_user_stats(user_context)
                
                # Send stats immediately
                await self.send_stats_update(user_id, stats)
                
                return {
                    "type": "stats_request",
                    "user_id": user_id,
                    "user_context": user_context
                }
                
            elif message_type == MessageType.CLIENT_CONTEXT_UPDATE.value:
                # Handle context updates
                await self.update_user_context(user_id, data)
                return None
                
        except Exception as e:
            logger.error(f"Error handling message from {user_id}: {e}")
            await self.send_personal_message({
                "type": MessageType.SERVER_ERROR.value,
                "data": {
                    "error": "Failed to process message",
                    "details": str(e)
                }
            }, user_id)
        
        return None
    
    def get_connection_stats(self) -> Dict:
        """Get current connection statistics"""
        return {
            "total_connections": len(self.active_connections),
            "active_users": list(self.active_connections.keys()),
            "rooms": {
                room_id: list(users) 
                for room_id, users in self.rooms.items()
            },
            "voice_streams": list(self.voice_buffers.keys()),
            "offline_queue_size": sum(
                len(messages) for messages in self.offline_queue.values()
            )
        }
    
    async def cleanup_stale_connections(self):
        """Periodic cleanup of stale connections"""
        disconnected = []
        
        for user_id, websocket in self.active_connections.items():
            try:
                # Send ping to check connection
                await websocket.send_json({
                    "type": MessageType.SERVER_PING.value,
                    "data": {"timestamp": datetime.now().isoformat()}
                })
            except:
                disconnected.append(user_id)
        
        for user_id in disconnected:
            await self.disconnect(user_id)
        
        if disconnected:
            logger.info(f"Cleaned up {len(disconnected)} stale connections")

# Global connection manager instance
connection_manager = ConnectionManager()

# Background task for periodic cleanup
async def periodic_cleanup():
    """Run periodic cleanup every 30 seconds"""
    while True:
        await asyncio.sleep(30)
        await connection_manager.cleanup_stale_connections()