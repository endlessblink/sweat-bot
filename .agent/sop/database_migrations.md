# Database Migrations Standard Operating Procedure

## 🎯 Purpose

This SOP defines the standard procedure for making database schema changes in the SweatBot project across multiple databases (PostgreSQL, MongoDB, Redis).

---

## 📋 Prerequisites

### Required Knowledge
- Understanding of database schema design
- Familiarity with Alembic (PostgreSQL migrations)
- MongoDB document structure and versioning
- Redis data structures and TTL management
- Git version control and branching

### Required Tools
- Access to development environment
- Database client tools (psql, mongosh, redis-cli)
- Docker for local database testing
- Python virtual environment

---

## 🗄️ Database Migration Types

### 1. PostgreSQL Schema Migrations
Use Alembic for all PostgreSQL schema changes.

### 2. MongoDB Document Migrations  
Use versioned documents with schema version tracking.

### 3. Redis Data Structure Migrations
Use versioned key prefixes and migration scripts.

---

## 📝 PostgreSQL Migration Procedure

### Step 1: Plan the Migration
```bash
# Understand current schema
docker exec -it sweatbot_postgres psql -U fitness_user -d hebrew_fitness
\d+  # List all tables with details
```

### Step 2: Create Alembic Migration
```bash
# Navigate to backend directory
cd backend

# Generate migration file
alembic revision --autogenerate -m "add exercise difficulty level"

# This creates: alembic/versions/xxxx_add_exercise_difficulty_level.py
```

### Step 3: Review and Edit Migration
```python
"""Add exercise difficulty level

Revision ID: a1b2c3d4e5f6
Revises: 9f8e7d6c5b4a
Create Date: 2025-10-08 10:30:00.123456

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '9f8e7d6c5b4a'
branch_labels: Union[str, None] = None
depends_on: Union[str, None] = None

def upgrade() -> None:
    # Add new column with default
    op.add_column('exercises', sa.Column('difficulty_level', sa.Integer(), nullable=True))
    
    # Update existing records with default value
    op.execute("UPDATE exercises SET difficulty_level = 5 WHERE difficulty_level IS NULL")
    
    # Make column non-nullable
    op.alter_column('exercises', 'difficulty_level', nullable=False)
    
    # Add index for performance
    op.create_index('idx_exercises_difficulty', 'exercises', ['difficulty_level'])

def downgrade() -> None:
    # Remove index
    op.drop_index('idx_exercises_difficulty', table_name='exercises')
    
    # Remove column
    op.drop_column('exercises', 'difficulty_level')
```

### Step 4: Test Migration Locally
```bash
# Backup current database
docker exec sweatbot_postgres pg_dump -U fitness_user hebrew_fitness > backup_before_migration.sql

# Run migration
alembic upgrade head

# Verify changes
docker exec -it sweatbot_postgres psql -U fitness_user -d hebrew_fitness
\d exercises
SELECT difficulty_level FROM exercises LIMIT 5;

# Test application still works
curl http://localhost:8000/health
```

### Step 5: Rollback Test
```bash
# Test rollback
alembic downgrade -1

# Verify rollback worked
docker exec -it sweatbot_postgres psql -U fitness_user -d hebrew_fitness
\d exercises

# Re-apply migration
alembic upgrade head
```

### Step 6: Update Application Code
```python
# Update SQLAlchemy models
# backend/app/models/models.py
class Exercise(Base):
    __tablename__ = "exercises"
    
    # ... existing columns ...
    difficulty_level: int = sa.Column(sa.Integer, nullable=False, default=5)
    
# Update Pydantic schemas
# backend/app/schemas/exercise.py
class ExerciseCreate(BaseModel):
    # ... existing fields ...
    difficulty_level: int = Field(default=5, ge=1, le=10)

class ExerciseResponse(BaseModel):
    # ... existing fields ...
    difficulty_level: int
```

### Step 7: Add Tests
```python
# tests/test_exercise_migration.py
import pytest
from sqlalchemy import text

async def test_exercise_difficulty_migration(db_session):
    # Test new column exists and has correct type
    result = await db_session.execute(
        text("SELECT COUNT(*) FROM exercises WHERE difficulty_level IS NOT NULL")
    )
    assert result.scalar() >= 0  # Should not fail
    
    # Test default value assignment
    result = await db_session.execute(
        text("INSERT INTO exercises (user_id, exercise_name, exercise_name_he, exercise_type, points_earned, difficulty_level) VALUES (1, 'test', 'טסט', 'strength', 10, DEFAULT) RETURNING difficulty_level")
    )
    difficulty = result.scalar()
    assert difficulty == 5  # Default value
```

---

## 📋 MongoDB Migration Procedure

### Step 1: Plan Document Structure Changes
```bash
# Connect to MongoDB
docker exec -it sweatbot_mongodb mongosh
use sweatbot_conversations
db.conversations.findOne()
```

### Step 2: Create Migration Script
```javascript
// scripts/mongodb_migrations/add_schema_version.js
const { MongoClient } = require('mongodb');

async function migrateToSchemaVersion(mongoUri, targetVersion) {
  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db('sweatbot_conversations');
  
  console.log(`Migrating to schema version ${targetVersion}`);
  
  // Add schema version to existing documents
  const result = await db.collection('conversations').updateMany(
    { schemaVersion: { $exists: false } },
    { 
      $set: { 
        schemaVersion: 1,
        migratedAt: new Date()
      } 
    }
  );
  
  console.log(`Updated ${result.modifiedCount} conversations`);
  
  // Add new field to user context collection
  const contextResult = await db.collection('userContext').updateMany(
    { 'preferences.languagePreference': { $exists: false } },
    { 
      $set: { 
        'preferences.languagePreference': 'auto',
        updatedAt: new Date()
      } 
    }
  );
  
  console.log(`Updated ${contextResult.modifiedCount} user contexts`);
  
  await client.close();
}

// Run migration
migrateToSchemaVersion('mongodb://sweatbot:secure_password@localhost:8002/', 1);
```

### Step 3: Test Migration
```bash
# Create test data backup
docker exec sweatbot_mongodb mongodump --db sweatbot_conversations --out /backup

# Run migration script
cd scripts/mongodb_migrations
node add_schema_version.js

# Verify migration
docker exec -it sweatbot_mongodb mongosh
use sweatbot_conversations
db.conversations.findOne({schemaVersion: 1})
```

### Step 4: Update Application Code
```typescript
// personal-ui-vite/src/agent/memory/mongoMemory.ts
interface ConversationDocument {
  // ... existing fields ...
  schemaVersion: number;
  migratedAt?: Date;
}

// Update document handling
const saveConversation = async (conversation: Conversation) => {
  const doc = {
    ...conversation,
    schemaVersion: 1,
    updatedAt: new Date()
  };
  
  await collection.updateOne(
    { userId: conversation.userId, sessionId: conversation.sessionId },
    { $set: doc },
    { upsert: true }
  );
};
```

### Step 5: Add Backward Compatibility
```typescript
// Handle documents with and without new fields
const loadConversation = async (userId: number, sessionId: string) => {
  const doc = await collection.findOne({ userId, sessionId });
  
  if (!doc) return null;
  
  // Provide defaults for older schema versions
  return {
    ...doc,
    languagePreference: doc.preferences?.languagePreference || 'auto',
    schemaVersion: doc.schemaVersion || 0
  };
};
```

---

## ⚡ Redis Migration Procedure

### Step 1: Plan Data Structure Changes
```bash
# Check current Redis data
docker exec -it sweatbot_redis redis-cli
KEYS *
TYPE user_state:1
GET user_state:1
```

### Step 2: Create Migration Script
```python
# scripts/redis_migrations/migrate_user_state.py
import redis
import json
from datetime import datetime

def migrate_user_state(redis_host='localhost', redis_port=8003):
    r = redis.Redis(host=redis_host, port=redis_port, decode_responses=True)
    
    print("Starting Redis migration for user state...")
    
    # Get all user state keys
    user_state_keys = r.keys('user_state:*')
    
    migrated_count = 0
    for key in user_state_keys:
        # Get current data
        current_data = r.get(key)
        if not current_data:
            continue
            
        try:
            data = json.loads(current_data)
            
            # Add new fields
            if 'v2_features' not in data:
                data['v2_features'] = {
                    'enhancedTracking': True,
                    'aiInsights': True,
                    'socialFeatures': False
                }
                
                data['schemaVersion'] = 2
                data['lastMigrated'] = datetime.now().isoformat()
                
                # Save updated data with new key format
                new_key = key.replace('user_state:', 'user_state_v2:')
                r.set(new_key, json.dumps(data), ex=3600)  # 1 hour TTL
                
                migrated_count += 1
                
                # Optionally delete old key after verification
                # r.delete(key)
                
        except json.JSONDecodeError as e:
            print(f"Error parsing {key}: {e}")
            continue
    
    print(f"Migrated {migrated_count} user state records")
    return migrated_count

if __name__ == "__main__":
    migrate_user_state()
```

### Step 3: Test Migration
```bash
# Backup Redis data
docker exec sweatbot_redis redis-cli --rdb /backup/redis_backup.rdb

# Run migration
cd scripts/redis_migrations
python migrate_user_state.py

# Verify new keys exist
docker exec -it sweatbot_redis redis-cli
KEYS user_state_v2:*
GET user_state_v2:1
```

### Step 4: Update Application Code
```typescript
// Update Redis client to use new key format
const getUserState = async (userId: number): Promise<UserState | null> => {
  // Try new format first
  let data = await redis.get(`user_state_v2:${userId}`);
  
  if (!data) {
    // Fall back to old format and migrate
    data = await redis.get(`user_state:${userId}`);
    if (data) {
      // Migrate to new format
      await migrateToV2(userId, JSON.parse(data));
      data = await redis.get(`user_state_v2:${userId}`);
    }
  }
  
  return data ? JSON.parse(data) : null;
};
```

---

## 🔄 Full Migration Workflow

### Step 1: Preparation
```bash
# Create migration branch
git checkout -b migration/add_exercise_difficulty

# Backup all databases
./scripts/backup_all_databases.sh

# Schedule maintenance window if needed
echo "Migration scheduled for: $(date)"
```

### Step 2: Development and Testing
```bash
# Run all migrations in development
./scripts/run_all_migrations.sh

# Run full test suite
make test

# Manual testing
curl http://localhost:8000/api/v1/exercises  # Test API works
# Test frontend still loads new data correctly
```

### Step 3: Code Review
Create Pull Request with:
- Migration scripts
- Updated application code
- Tests for new schema
- Rollback procedures
- Documentation updates

### Step 4: Deployment
```bash
# In production/staging:
# 1. Put application in maintenance mode
# 2. Backup databases
# 3. Run migrations in order: PostgreSQL → MongoDB → Redis
# 4. Update application code
# 5. Run smoke tests
# 6. Bring application back online
```

---

## 🚨 Rollback Procedures

### PostgreSQL Rollback
```bash
# Identify migration to rollback
alembic history

# Rollback one migration
alembic downgrade -1

# Rollback to specific revision
alembic downgrade 9f8e7d6c5b4a

# Verify rollback
alembic current
```

### MongoDB Rollback
```javascript
// Create rollback script that reverses changes
async function rollbackSchemaVersion(mongoUri, targetVersion) {
  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db('sweatbot_conversations');
  
  // Remove fields added in migration
  await db.collection('conversations').updateMany(
    { schemaVersion: 1 },
    { 
      $unset: { 
        schemaVersion: "",
        migratedAt: ""
      } 
    }
  );
  
  await client.close();
}
```

### Redis Rollback
```python
def rollback_redis_migration():
    r = redis.Redis(host='localhost', port=8003, decode_responses=True)
    
    # Restore old key format
    v2_keys = r.keys('user_state_v2:*')
    
    for key in v2_keys:
        data = r.get(key)
        old_key = key.replace('user_state_v2:', 'user_state:')
        r.set(old_key, data)
        r.delete(key)
```

---

## 📊 Migration Checklist

### Before Migration
- [ ] Full database backup completed
- [ ] Migration scripts tested in development
- [ ] Rollback procedures documented
- [ ] Application code updated and tested
- [ ] Team notified of migration window
- [ ] Monitoring tools configured

### During Migration
- [ ] Maintenance mode enabled (if required)
- [ ] Migrations executed in correct order
- [ ] Each step verified before proceeding
- [ ] Error logs monitored
- [ ] Progress documented

### After Migration
- [ ] Application functionality verified
- [ ] Performance tests passed
- [ ] Data integrity checks completed
- [ ] Monitoring confirms normal operation
- [ ] Documentation updated
- [ ] Team notified of completion

---

## 🔧 Migration Scripts Template

### PostgreSQL Migration Template
```python
"""Migration description

Revision ID: {revision_id}
Revises: {down_revision}
Create Date: {create_date}

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '{revision_id}'
down_revision: Union[str, None] = '{down_revision}'
branch_labels: Union[str, None] = None
depends_on: Union[str, None] = None

def upgrade() -> None:
    # Add migration logic here
    pass

def downgrade() -> None:
    # Add rollback logic here
    pass
```

### MongoDB Migration Template
```javascript
const { MongoClient } = require('mongodb');

async function migrate(mongoUri) {
  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db('your_database');
  
  try {
    // Migration logic here
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await client.close();
  }
}
```

---

This SOP ensures safe, tested, and reversible database migrations across all SweatBot databases while maintaining data integrity and application availability.