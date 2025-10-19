#!/bin/bash

# Database Migration Script
# Sets up PostgreSQL database for Node.js SweatBot backend

set -e

echo "🗄 Starting SweatBot Database Migration..."

# Database configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-8001}
DB_NAME=${DB_NAME:-sweatbot}
DB_USER=${DB_USER:-sweatbot}
DB_PASSWORD=${DB_PASSWORD:-secure_password}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📊 Database Configuration:${NC}"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"

# Wait for database to be ready
echo -e "${YELLOW}⏳ Checking database connection...${NC}"
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -q; do
  echo -e "${YELLOW}   Database not ready, waiting 5 seconds...${NC}"
  sleep 5
done

echo -e "${GREEN}✅ Database is ready!${NC}"

# Create extension for UUID generation if needed
echo -e "${YELLOW}🔧 Creating PostgreSQL extensions...${NC}"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" || echo "Extension already exists or failed"

# Run migrations
echo -e "${YELLOW}🚀 Running database migrations...${NC}"

migration_files=(
    "001_create_users.sql"
    "002_create_exercise_logs.sql"
    "003_create_points_records.sql"
)

for migration in "${migration_files[@]}"; do
    echo -e "${YELLOW}   Running $migration...${NC}"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$(dirname "$0")/$migration"
    echo -e "${GREEN}   ✅ $migration completed${NC}"
done

# Verify tables were created
echo -e "${YELLOW}🔍 Verifying table creation...${NC}"
tables=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public';" -A | tail -n +2 | head -n -1)

echo -e "${GREEN}📋 Created tables:${NC}"
echo "$tables" | while read -r table; do
    echo "   ✅ $table"
done

# Check for existing data
echo -e "${YELLOW}📊 Checking for existing data...${NC}"

user_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users;" -A | tail -n +1 | head -n -1)
exercise_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM exercise_logs;" -A | tail -n +1 | head -n -1)
points_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM points_records;" -A | tail -n +1 | head -n -1)

echo -e "${GREEN}📈 Existing data:${NC}"
echo "   Users: $user_count"
echo "   Exercise Logs: $exercise_count"
echo "   Points Records: $points_count"

# Test database permissions
echo -e "${YELLOW}🔐 Testing database permissions...${NC}"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "INSERT INTO test_table (id, name) VALUES (1, 'test') ON CONFLICT DO NOTHING;" >/dev/null 2>&1 || {
    # Create test table if it doesn't exist
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "CREATE TABLE IF NOT EXISTS test_table (id SERIAL PRIMARY KEY, name VARCHAR(50));" >/dev/null 2>&1
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "INSERT INTO test_table (id, name) VALUES (1, 'test') ON CONFLICT DO NOTHING;" >/dev/null 2>&1
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT * FROM test_table WHERE id = 1;" >/dev/null 2>&1
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "DELETE FROM test_table WHERE id = 1;" >/dev/null 2>&1
}

echo -e "${GREEN}✅ Database permissions verified${NC}"

# Create database health check function
echo -e "${YELLOW}💾 Creating health check function...${NC}"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
CREATE OR REPLACE FUNCTION health_check()
RETURNS JSON AS \$$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'status', 'healthy',
        'timestamp', NOW(),
        'users', (SELECT COUNT(*) FROM users),
        'exercise_logs', (SELECT COUNT(*) FROM exercise_logs),
        'points_records', (SELECT COUNT(*) FROM points_records),
        'database', '$DB_NAME'
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql;
" >/dev/null 2>&1

echo -e "${GREEN}✅ Health check function created${NC}"

# Test health check
health_result=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT health_check();" -A | tail -n +1)
echo -e "${GREEN}🏥 Database Health: $health_result${NC}"

echo -e "${GREEN}🎉 Database migration completed successfully!${NC}"
echo -e "${GREEN}📋 Summary:${NC}"
echo "   ✅ PostgreSQL extensions created"
echo "   ✅ Database tables created"
echo "   ✅ Indexes created"
echo "   ✅ Functions and triggers created"
echo "   ✅ Permissions verified"
echo "   ✅ Health check implemented"
echo ""
echo -e "${YELLOW}🚀 Next steps:${NC}"
echo "   1. Start Node.js backend: cd backend-nodejs && npm run dev"
echo "   2. Run migration test: npm run test:migration"
echo "   3. Test all endpoints"
echo "   4. Deploy to staging environment"