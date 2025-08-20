"""
MongoDB-based conversation memory for PersonalSweatBot
Provides persistent conversation storage with context retrieval and analytics
"""

import os
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from pymongo import MongoClient, DESCENDING
from phi.memory.agent import AgentMemory
from phi.model.message import Message
import logging

logger = logging.getLogger(__name__)

class MongoDBMemory(AgentMemory):
    """MongoDB-backed conversation memory with Phidata compatibility"""
    
    model_config = {"extra": "allow"}  # Allow extra fields
    
    def __init__(
        self,
        user_id: str = "personal",
        connection_string: str = "mongodb://sweatbot:secure_password@localhost:27017/",
        database_name: str = "sweatbot_conversations",
        collection_name: str = "conversations",
        max_context_messages: int = 20,
        session_timeout_hours: int = 2,
        **kwargs
    ):
        """Initialize MongoDB memory storage"""
        
        # Initialize parent AgentMemory with any additional kwargs
        super().__init__(**kwargs)
        
        # Store configuration
        self.user_id = user_id
        self.max_context_messages = max_context_messages
        self.session_timeout_hours = session_timeout_hours
        self.current_session_id = None
        
        # Connect to MongoDB
        try:
            self.client = MongoClient(connection_string, serverSelectionTimeoutMS=5000)
            # Test connection
            self.client.admin.command('ping')
            
            self.db = self.client[database_name]
            self.collection = self.db[collection_name]
            
            # Create indexes for performance
            self._create_indexes()
            
            # Initialize current session
            self._initialize_session()
            
            # Load recent conversation context
            self._load_recent_context()
            
            logger.info(f"✅ MongoDB memory initialized for user: {user_id}")
            
        except Exception as e:
            logger.error(f"❌ MongoDB connection failed: {e}")
            # Fallback to in-memory storage only
            self.client = None
            self.db = None
            self.collection = None
    
    def add_message(self, message: Message) -> None:
        """Add a message to both MongoDB and parent AgentMemory storage"""
        # Add to parent AgentMemory
        super().add_message(message)
        
        # Add to MongoDB
        self._save_message_to_mongodb(message)
    
    def _create_indexes(self):
        """Create MongoDB indexes for optimal performance"""
        if self.collection is None:
            return
            
        try:
            # Compound index for user queries
            self.collection.create_index([
                ("user_id", 1),
                ("timestamp", DESCENDING)
            ])
            
            # Session-based queries
            self.collection.create_index([
                ("user_id", 1),
                ("session_id", 1),
                ("timestamp", DESCENDING)
            ])
            
            # Text search index
            self.collection.create_index([("message", "text")])
            
            logger.info("✅ MongoDB indexes created")
            
        except Exception as e:
            logger.warning(f"Index creation failed: {e}")
    
    def _initialize_session(self):
        """Initialize or continue current session"""
        if self.collection is None:
            self.current_session_id = str(uuid.uuid4())
            return
            
        try:
            # Check if there's a recent session (within timeout)
            cutoff_time = datetime.now() - timedelta(hours=self.session_timeout_hours)
            
            recent_session = self.collection.find_one(
                {
                    "user_id": self.user_id,
                    "timestamp": {"$gte": cutoff_time}
                },
                sort=[("timestamp", DESCENDING)]
            )
            
            if recent_session:
                # Continue existing session
                self.current_session_id = recent_session["session_id"]
                logger.info(f"Continuing session: {self.current_session_id}")
            else:
                # Start new session
                self.current_session_id = str(uuid.uuid4())
                logger.info(f"Started new session: {self.current_session_id}")
                
        except Exception as e:
            logger.error(f"Session initialization failed: {e}")
            self.current_session_id = str(uuid.uuid4())
    
    def _load_recent_context(self):
        """Load recent conversations for context"""
        if self.collection is None:
            return
            
        try:
            # Get recent messages for context
            recent_messages = list(self.collection.find(
                {"user_id": self.user_id},
                sort=[("timestamp", DESCENDING)],
                limit=self.max_context_messages
            ))
            
            # Convert to Phidata Message objects and add to memory
            for doc in reversed(recent_messages):
                message = Message(
                    role=doc["role"],
                    content=doc["message"],
                    created_at=doc["timestamp"]
                )
                # Add only to parent memory, don't double-save to MongoDB
                super().add_message(message)
            
            logger.info(f"Loaded {len(recent_messages)} messages for context")
            
        except Exception as e:
            logger.error(f"Failed to load context: {e}")
    
    def _save_message_to_mongodb(self, message: Message):
        """Save message to MongoDB with metadata"""
        if self.collection is None:
            return
            
        try:
            # Extract metadata from message content
            metadata = self._extract_message_metadata(message.content, message.role)
            
            doc = {
                "user_id": self.user_id,
                "session_id": self.current_session_id,
                "timestamp": datetime.now(),
                "role": message.role,
                "message": message.content,
                "metadata": metadata,
                "created_at": datetime.now()
            }
            
            result = self.collection.insert_one(doc)
            logger.debug(f"Message saved with ID: {result.inserted_id}")
            
        except Exception as e:
            logger.error(f"Failed to save message: {e}")
    
    def _extract_message_metadata(self, content: str, role: str) -> Dict[str, Any]:
        """Extract metadata from message content"""
        metadata = {
            "language": "he" if any(char in "אבגדהוזחטיכלמנסעפצקרשת" for char in content) else "en",
            "length": len(content),
            "timestamp": datetime.now().isoformat()
        }
        
        # Detect exercise-related content
        if role == "user":
            exercise_keywords = ["שכיבות", "סקוואטים", "ריצה", "משיכות", "דחיפות", "עשיתי"]
            metadata["exercise_detected"] = any(keyword in content for keyword in exercise_keywords)
            
            # Extract numbers (potential reps/weights)
            import re
            numbers = re.findall(r'\d+', content)
            if numbers:
                metadata["numbers"] = [int(n) for n in numbers]
        
        # Detect statistics requests
        if role == "user":
            stats_keywords = ["נקודות", "סטטיסטיקה", "כמה", "סיכום", "התקדמות"]
            metadata["stats_request"] = any(keyword in content for keyword in stats_keywords)
        
        return metadata
    
    def search_conversations(
        self,
        query: str,
        limit: int = 10,
        days_back: int = 30
    ) -> List[Dict[str, Any]]:
        """Search conversations by text content"""
        if self.collection is None:
            return []
            
        try:
            cutoff_date = datetime.now() - timedelta(days=days_back)
            
            results = list(self.collection.find(
                {
                    "user_id": self.user_id,
                    "timestamp": {"$gte": cutoff_date},
                    "$text": {"$search": query}
                },
                sort=[("timestamp", DESCENDING)],
                limit=limit
            ))
            
            return results
            
        except Exception as e:
            logger.error(f"Conversation search failed: {e}")
            return []
    
    def get_conversation_history(
        self,
        days_back: int = 7,
        session_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get conversation history for a specific period or session"""
        if self.collection is None:
            return []
            
        try:
            query = {"user_id": self.user_id}
            
            if session_id:
                query["session_id"] = session_id
            else:
                cutoff_date = datetime.now() - timedelta(days=days_back)
                query["timestamp"] = {"$gte": cutoff_date}
            
            history = list(self.collection.find(
                query,
                sort=[("timestamp", DESCENDING)]
            ))
            
            return history
            
        except Exception as e:
            logger.error(f"Failed to get conversation history: {e}")
            return []
    
    def get_conversation_analytics(self) -> Dict[str, Any]:
        """Get analytics about conversation patterns"""
        if self.collection is None:
            return {"total_messages": 0, "total_sessions": 0}
            
        try:
            pipeline = [
                {"$match": {"user_id": self.user_id}},
                {
                    "$group": {
                        "_id": None,
                        "total_messages": {"$sum": 1},
                        "total_sessions": {"$addToSet": "$session_id"},
                        "exercise_mentions": {
                            "$sum": {"$cond": ["$metadata.exercise_detected", 1, 0]}
                        },
                        "stats_requests": {
                            "$sum": {"$cond": ["$metadata.stats_request", 1, 0]}
                        },
                        "avg_message_length": {"$avg": "$metadata.length"},
                        "first_message": {"$min": "$timestamp"},
                        "last_message": {"$max": "$timestamp"}
                    }
                }
            ]
            
            result = list(self.collection.aggregate(pipeline))
            
            if result:
                analytics = result[0]
                analytics["total_sessions"] = len(analytics["total_sessions"])
                return analytics
            else:
                return {"total_messages": 0, "total_sessions": 0}
                
        except Exception as e:
            logger.error(f"Analytics query failed: {e}")
            return {"error": str(e)}
    
    def get_user_preferences(self) -> Dict[str, Any]:
        """Analyze conversation patterns to infer user preferences"""
        if self.collection is None:
            return {}
            
        try:
            # Get exercise patterns
            pipeline = [
                {"$match": {"user_id": self.user_id, "metadata.exercise_detected": True}},
                {"$group": {
                    "_id": "$metadata.numbers",
                    "count": {"$sum": 1}
                }},
                {"$sort": {"count": -1}},
                {"$limit": 10}
            ]
            
            exercise_patterns = list(self.collection.aggregate(pipeline))
            
            # Get conversation times
            time_pipeline = [
                {"$match": {"user_id": self.user_id}},
                {"$group": {
                    "_id": {"$hour": "$timestamp"},
                    "count": {"$sum": 1}
                }},
                {"$sort": {"count": -1}}
            ]
            
            time_patterns = list(self.collection.aggregate(time_pipeline))
            
            return {
                "preferred_exercise_patterns": exercise_patterns[:5],
                "preferred_chat_times": time_patterns[:3],
                "total_exercise_logs": len(exercise_patterns)
            }
            
        except Exception as e:
            logger.error(f"Failed to get user preferences: {e}")
            return {}
    
    def clear_old_conversations(self, days_to_keep: int = 90):
        """Clean up old conversation data"""
        if self.collection is None:
            return
            
        try:
            cutoff_date = datetime.now() - timedelta(days=days_to_keep)
            
            result = self.collection.delete_many({
                "user_id": self.user_id,
                "timestamp": {"$lt": cutoff_date}
            })
            
            logger.info(f"Deleted {result.deleted_count} old conversations")
            
        except Exception as e:
            logger.error(f"Failed to clear old conversations: {e}")
    
    def __del__(self):
        """Clean up MongoDB connection"""
        if hasattr(self, 'client') and self.client:
            self.client.close()

# Helper function to create MongoDB memory instance
def create_mongodb_memory(user_id: str = "personal") -> MongoDBMemory:
    """Create and return a MongoDB memory instance"""
    return MongoDBMemory(user_id=user_id)