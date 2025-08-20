#!/usr/bin/env python3
"""
Setup script for personal SweatBot user in PostgreSQL
Creates a default user for personal SweatBot use
"""

import asyncio
import asyncpg
import uuid
from datetime import datetime
import bcrypt
import jwt
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database configuration for Docker setup
DATABASE_URL = "postgresql://fitness_user:secure_password@localhost:5434/hebrew_fitness"
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def create_access_token(user_id: str) -> str:
    """Create JWT access token for personal user"""
    payload = {
        "sub": user_id,
        "username": "personal",
        "iat": datetime.utcnow().timestamp(),
        "exp": (datetime.utcnow().timestamp()) + (7 * 24 * 60 * 60)  # 7 days
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token

async def setup_personal_user():
    """Create personal user in PostgreSQL and generate token"""
    try:
        # Connect to PostgreSQL
        conn = await asyncpg.connect(DATABASE_URL)
        print("✅ Connected to PostgreSQL successfully")
        
        # Check if personal user already exists
        existing_user = await conn.fetchrow(
            "SELECT id, username FROM users WHERE username = 'personal'"
        )
        
        if existing_user:
            user_id = str(existing_user['id'])
            print(f"✅ Personal user already exists with ID: {user_id}")
        else:
            # Generate user ID
            user_id = str(uuid.uuid4())
            
            # Hash password for personal user
            hashed_password = hash_password("personal123")
            
            # Insert personal user
            await conn.execute("""
                INSERT INTO users (
                    id, email, username, hashed_password, password_hash,
                    full_name, full_name_he, preferred_language,
                    is_active, is_verified, is_guest, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            """, 
            user_id,
            'personal@sweatbot.local',
            'personal', 
            hashed_password,
            hashed_password,  # Alternative field name
            'Personal SweatBot User',
            'משתמש SweatBot אישי',
            'he',  # Hebrew preference
            True,  # is_active
            True,  # is_verified
            True,  # is_guest
            datetime.utcnow()
            )
            
            print(f"✅ Created personal user with ID: {user_id}")
        
        # Generate JWT token for personal use
        token = create_access_token(user_id)
        
        # Save token to file for PersonalSweatBot to use
        token_file = os.path.join(os.path.dirname(__file__), ".sweatbot_token")
        with open(token_file, 'w') as f:
            f.write(token)
        
        print(f"✅ Generated JWT token and saved to {token_file}")
        print(f"✅ User ID: {user_id}")
        print(f"✅ Token: {token[:50]}...")
        
        # Verify token works
        try:
            decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            print(f"✅ Token verification successful for user: {decoded['username']}")
        except Exception as e:
            print(f"❌ Token verification failed: {e}")
        
        # Close connection
        await conn.close()
        print("✅ Database connection closed")
        
        return user_id, token
        
    except Exception as e:
        print(f"❌ Error setting up personal user: {e}")
        return None, None

async def test_database_connection():
    """Test if we can connect to the database and see tables"""
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        
        # Check if users table exists
        tables = await conn.fetch("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name IN ('users', 'workouts', 'exercises')
        """)
        
        print("📋 Available tables:")
        for table in tables:
            print(f"  - {table['table_name']}")
        
        # Check current users
        users = await conn.fetch("SELECT username, email, is_active FROM users LIMIT 5")
        print(f"\n👥 Current users ({len(users)}):")
        for user in users:
            print(f"  - {user['username']} ({user['email']}) - Active: {user['is_active']}")
        
        await conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Database connection test failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 SweatBot Personal User Setup")
    print("=" * 40)
    
    # Test database connection first
    print("1. Testing database connection...")
    if not asyncio.run(test_database_connection()):
        print("❌ Please ensure PostgreSQL is running on localhost:5434")
        exit(1)
    
    print("\n2. Setting up personal user...")
    user_id, token = asyncio.run(setup_personal_user())
    
    if user_id and token:
        print("\n🎉 Setup complete!")
        print("\nNext steps:")
        print("1. PersonalSweatBot will automatically use the generated token")
        print("2. Exercises will be saved to PostgreSQL")
        print("3. Points will persist across sessions")
        print(f"\nUser ID for reference: {user_id}")
    else:
        print("❌ Setup failed. Please check the error messages above.")