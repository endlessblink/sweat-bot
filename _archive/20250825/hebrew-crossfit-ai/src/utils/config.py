#!/usr/bin/env python3
"""
Hebrew CrossFit AI - Centralized Configuration Management
"""

import os
import json
from pathlib import Path
from typing import Dict, Any, Optional
from dataclasses import dataclass

@dataclass
class DatabaseConfig:
    """Database configuration"""
    path: str = "workout_data.db"
    backup_enabled: bool = True
    backup_interval: int = 24  # hours

@dataclass
class VoiceConfig:
    """Voice recognition and TTS configuration"""
    language: str = "he-IL"
    model: str = "whisper"
    tts_voice: str = "avri"
    recognition_timeout: int = 5
    phrase_timeout: int = 1
    
@dataclass
class UIConfig:
    """User interface configuration"""
    theme: str = "light"
    language: str = "he"
    rtl_support: bool = True
    mobile_optimized: bool = True

@dataclass
class SecurityConfig:
    """Security and privacy configuration"""
    encrypt_data: bool = True
    anonymous_analytics: bool = True
    session_timeout: int = 3600  # seconds

class Config:
    """Centralized configuration management for Hebrew CrossFit AI"""
    
    def __init__(self, config_file: Optional[str] = None):
        self.config_file = config_file or self._get_default_config_path()
        self._load_env_variables()
        self._load_config_file()
        self._validate_config()
    
    def _get_default_config_path(self) -> str:
        """Get default configuration file path"""
        return os.path.join(os.path.dirname(__file__), "..", "..", "..", "config.json")
    
    def _load_env_variables(self):
        """Load configuration from environment variables"""
        # API Keys
        self.gemini_api_key = os.getenv('GEMINI_API_KEY')
        self.groq_api_key = os.getenv('GROQ_API_KEY')
        self.openai_api_key = os.getenv('OPENAI_API_KEY')
        self.elevenlabs_api_key = os.getenv('ELEVENLABS_API_KEY')
        
        # Configuration objects
        self.database = DatabaseConfig(
            path=os.getenv('DB_PATH', 'workout_data.db'),
            backup_enabled=os.getenv('DB_BACKUP_ENABLED', 'true').lower() == 'true'
        )
        
        self.voice = VoiceConfig(
            language=os.getenv('VOICE_LANGUAGE', 'he-IL'),
            model=os.getenv('VOICE_MODEL', 'whisper'),
            tts_voice=os.getenv('TTS_VOICE', 'avri')
        )
        
        self.ui = UIConfig(
            theme=os.getenv('UI_THEME', 'light'),
            language=os.getenv('UI_LANGUAGE', 'he')
        )
        
        self.security = SecurityConfig()
        
        # Feature flags
        self.enable_social_features = os.getenv('ENABLE_SOCIAL_FEATURES', 'false').lower() == 'true'
        self.enable_cloud_sync = os.getenv('ENABLE_CLOUD_SYNC', 'false').lower() == 'true'
        self.enable_analytics = os.getenv('ENABLE_ANALYTICS', 'true').lower() == 'true'
    
    def _load_config_file(self):
        """Load configuration from JSON file if it exists"""
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    file_config = json.load(f)
                    
                # Update configuration with file values
                for key, value in file_config.items():
                    if hasattr(self, key):
                        setattr(self, key, value)
                        
            except (json.JSONDecodeError, FileNotFoundError) as e:
                print(f"Warning: Could not load config file {self.config_file}: {e}")
    
    def _validate_config(self):
        """Validate required configuration values"""
        required_keys = ['gemini_api_key']
        missing = [key for key in required_keys if not getattr(self, key, None)]
        
        if missing:
            raise ValueError(f"Missing required configuration: {missing}")
    
    def save_config(self):
        """Save current configuration to file"""
        config_data = {
            'database': {
                'path': self.database.path,
                'backup_enabled': self.database.backup_enabled,
                'backup_interval': self.database.backup_interval
            },
            'voice': {
                'language': self.voice.language,
                'model': self.voice.model,
                'tts_voice': self.voice.tts_voice,
                'recognition_timeout': self.voice.recognition_timeout,
                'phrase_timeout': self.voice.phrase_timeout
            },
            'ui': {
                'theme': self.ui.theme,
                'language': self.ui.language,
                'rtl_support': self.ui.rtl_support,
                'mobile_optimized': self.ui.mobile_optimized
            },
            'features': {
                'enable_social_features': self.enable_social_features,
                'enable_cloud_sync': self.enable_cloud_sync,
                'enable_analytics': self.enable_analytics
            }
        }
        
        os.makedirs(os.path.dirname(self.config_file), exist_ok=True)
        with open(self.config_file, 'w', encoding='utf-8') as f:
            json.dump(config_data, f, indent=2, ensure_ascii=False)
    
    def get_api_key(self, service: str) -> Optional[str]:
        """Get API key for a specific service"""
        key_map = {
            'gemini': self.gemini_api_key,
            'groq': self.groq_api_key,
            'openai': self.openai_api_key,
            'elevenlabs': self.elevenlabs_api_key
        }
        return key_map.get(service.lower())
    
    def has_api_key(self, service: str) -> bool:
        """Check if API key exists for a service"""
        return bool(self.get_api_key(service))

# Global configuration instance
config = Config()

def get_config() -> Config:
    """Get the global configuration instance"""
    return config

def reload_config():
    """Reload configuration from files and environment"""
    global config
    config = Config()
    return config