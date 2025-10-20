---
name: Database Management Automation
description: Automates database setup, migrations, backups, and health monitoring for PostgreSQL and MongoDB. Use when setting up databases, managing schemas, or troubleshooting database issues.
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
---

# Database Management Automation

## Overview

Technical skill for comprehensive database automation including setup, migrations, backups, monitoring, and troubleshooting for PostgreSQL and MongoDB deployments.

## When to Use

- Setting up new databases and schemas
- Running database migrations
- Creating backup and restore procedures
- Monitoring database health and performance
- Troubleshooting database connection issues

## Technical Capabilities

1. **Multi-Database Support**: PostgreSQL and MongoDB automation
2. **Migration Management**: Version-controlled schema changes
3. **Backup Automation**: Scheduled and on-demand backups
4. **Health Monitoring**: Performance metrics and alerting
5. **Connection Pooling**: Optimized database connection management

## Database Setup Automation

### PostgreSQL Setup Script
```bash
#!/bin/bash
# setup-postgres.sh

set -e

# Configuration
DB_NAME=${DB_NAME:-sweatbot}
DB_USER=${DB_USER:-sweatbot_user}
DB_PASSWORD=${DB_PASSWORD:-$(openssl rand -base64 32)}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

echo "🚀 Setting up PostgreSQL database..."

# Create database if it doesn't exist
psql -h $DB_HOST -p $DB_PORT -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
psql -h $DB_HOST -p $DB_PORT -U postgres -c "CREATE DATABASE $DB_NAME;"

# Create user if it doesn't exist
psql -h $DB_HOST -p $DB_PORT -U postgres -tc "SELECT 1 FROM pg_roles WHERE rolname = '$DB_USER'" | grep -q 1 || \
psql -h $DB_HOST -p $DB_PORT -U postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"

# Grant permissions
psql -h $DB_HOST -p $DB_PORT -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
psql -h $DB_HOST -p $DB_PORT -U postgres -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;"
psql -h $DB_HOST -p $DB_PORT -U postgres -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;"

echo "✅ PostgreSQL setup complete!"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "Host: $DB_HOST:$DB_PORT"

# Save connection string
echo "DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME" > .env.db
```

### MongoDB Setup Script
```bash
#!/bin/bash
# setup-mongodb.sh

set -e

# Configuration
DB_NAME=${DB_NAME:-sweatbot}
DB_USER=${DB_USER:-sweatbot_user}
DB_PASSWORD=${DB_PASSWORD:-$(openssl rand -base64 32)}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-27017}

echo "🚀 Setting up MongoDB database..."

# Create user and database
mongosh --host $DB_HOST:$DB_PORT <<EOF
use $DB_NAME;
db.createUser({
  user: "$DB_USER",
  pwd: "$DB_PASSWORD",
  roles: [
    { role: "readWrite", db: "$DB_NAME" },
    { role: "dbAdmin", db: "$DB_NAME" }
  ]
});
EOF

echo "✅ MongoDB setup complete!"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "Host: $DB_HOST:$DB_PORT"

# Save connection string
echo "MONGODB_URL=mongodb://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME" >> .env.db
```

## Migration Management

### Migration Framework (TypeScript)
```typescript
// src/database/migrator.ts

import { Pool } from 'pg';
import { MongoClient, Db } from 'mongodb';
import { readdir } from 'fs/promises';
import { join } from 'path';

interface Migration {
  id: string;
  name: string;
  sql?: string;
  mongo_script?: string;
  created_at: Date;
  executed_at?: Date;
}

export class DatabaseMigrator {
  private pgPool?: Pool;
  private mongoClient?: MongoClient;
  private mongoDb?: Db;

  constructor(
    private pgUrl?: string,
    private mongoUrl?: string,
    private migrationPath: string = './migrations'
  ) {}

  async initialize() {
    if (this.pgUrl) {
      this.pgPool = new Pool({ connectionString: this.pgUrl });
      await this.createMigrationsTable();
    }

    if (this.mongoUrl) {
      this.mongoClient = new MongoClient(this.mongoUrl);
      await this.mongoClient.connect();
      this.mongoDb = this.mongoClient.db();
      await this.createMigrationsCollection();
    }
  }

  private async createMigrationsTable() {
    if (!this.pgPool) return;

    await this.pgPool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        executed_at TIMESTAMP
      );
    `);
  }

  private async createMigrationsCollection() {
    if (!this.mongoDb) return;

    await this.mongoDb.collection('migrations').createIndex(
      { id: 1 },
      { unique: true }
    );
  }

  async migrate() {
    console.log('🔄 Running database migrations...');

    const migrations = await this.loadMigrations();
    const executedMigrations = await this.getExecutedMigrations();

    for (const migration of migrations) {
      if (!executedMigrations.find(m => m.id === migration.id)) {
        await this.executeMigration(migration);
        console.log(`✅ Executed migration: ${migration.name}`);
      } else {
        console.log(`⏭️  Skipping migration: ${migration.name}`);
      }
    }

    console.log('✅ All migrations completed!');
  }

  private async loadMigrations(): Promise<Migration[]> {
    const files = await readdir(this.migrationPath);
    const migrations: Migration[] = [];

    for (const file of files.sort()) {
      if (file.endsWith('.sql') || file.endsWith('.js')) {
        const content = await import(join(this.migrationPath, file));

        migrations.push({
          id: file.replace(/\.(sql|js)$/, ''),
          name: file,
          sql: file.endsWith('.sql') ? content.default : undefined,
          mongo_script: file.endsWith('.js') ? content.default : undefined,
          created_at: new Date()
        });
      }
    }

    return migrations;
  }

  private async getExecutedMigrations(): Promise<Migration[]> {
    const migrations: Migration[] = [];

    // Get PostgreSQL migrations
    if (this.pgPool) {
      const result = await this.pgPool.query('SELECT * FROM migrations ORDER BY id');
      migrations.push(...result.rows);
    }

    // Get MongoDB migrations
    if (this.mongoDb) {
      const docs = await this.mongoDb.collection('migrations').find({}).toArray();
      migrations.push(...docs);
    }

    return migrations;
  }

  private async executeMigration(migration: Migration) {
    try {
      // Execute PostgreSQL migration
      if (migration.sql && this.pgPool) {
        await this.pgPool.query(migration.sql);
      }

      // Execute MongoDB migration
      if (migration.mongo_script && this.mongoDb) {
        await migration.mongo_script(this.mongoDb);
      }

      // Record migration as executed
      await this.recordMigration(migration);

    } catch (error) {
      console.error(`❌ Migration failed: ${migration.name}`, error);
      throw error;
    }
  }

  private async recordMigration(migration: Migration) {
    migration.executed_at = new Date();

    if (this.pgPool) {
      await this.pgPool.query(
        'INSERT INTO migrations (id, name, executed_at) VALUES ($1, $2, $3)',
        [migration.id, migration.name, migration.executed_at]
      );
    }

    if (this.mongoDb) {
      await this.mongoDb.collection('migrations').insertOne(migration);
    }
  }

  async rollback(targetMigrationId?: string) {
    console.log('🔄 Rolling back migrations...');

    const executedMigrations = await this.getExecutedMigrations();
    const migrationsToRollback = targetMigrationId
      ? executedMigrations.filter(m => m.id >= targetMigrationId)
      : [executedMigrations[executedMigrations.length - 1]];

    for (const migration of migrationsToRollback.reverse()) {
      await this.rollbackMigration(migration);
      console.log(`✅ Rolled back migration: ${migration.name}`);
    }

    console.log('✅ Rollback completed!');
  }

  private async rollbackMigration(migration: Migration) {
    // Implementation would depend on specific rollback strategy
    // This is a simplified example
    if (this.pgPool) {
      await this.pgPool.query('DELETE FROM migrations WHERE id = $1', [migration.id]);
    }

    if (this.mongoDb) {
      await this.mongoDb.collection('migrations').deleteOne({ id: migration.id });
    }
  }

  async close() {
    if (this.pgPool) {
      await this.pgPool.end();
    }

    if (this.mongoClient) {
      await this.mongoClient.close();
    }
  }
}

// CLI interface
if (require.main === module) {
  const migrator = new DatabaseMigrator(
    process.env.DATABASE_URL,
    process.env.MONGODB_URL
  );

  const command = process.argv[2];

  migrator.initialize().then(() => {
    switch (command) {
      case 'migrate':
        return migrator.migrate();
      case 'rollback':
        return migrator.rollback(process.argv[3]);
      default:
        console.log('Usage: npm run migrate [migrate|rollback] [migration_id]');
    }
  }).then(() => {
    migrator.close();
    process.exit(0);
  }).catch((error) => {
    console.error('Migration failed:', error);
    migrator.close();
    process.exit(1);
  });
}
```

## Backup Automation

### PostgreSQL Backup Script
```bash
#!/bin/bash
# backup-postgres.sh

set -e

# Configuration
DB_NAME=${DB_NAME:-sweatbot}
DB_USER=${DB_USER:-sweatbot_user}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
BACKUP_DIR=${BACKUP_DIR:-./backups}
RETENTION_DAYS=${RETENTION_DAYS:-30}

echo "🗄️  Creating PostgreSQL backup..."

# Create backup directory
mkdir -p $BACKUP_DIR

# Generate backup filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_backup_$TIMESTAMP.sql"

# Create backup
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

echo "✅ Backup created: ${BACKUP_FILE}.gz"

# Cleanup old backups
find $BACKUP_DIR -name "${DB_NAME}_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "🧹 Cleaned up backups older than $RETENTION_DAYS days"
```

### MongoDB Backup Script
```bash
#!/bin/bash
# backup-mongodb.sh

set -e

# Configuration
DB_NAME=${DB_NAME:-sweatbot}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-27017}
BACKUP_DIR=${BACKUP_DIR:-./backups}
RETENTION_DAYS=${RETENTION_DAYS:-30}

echo "🗄️  Creating MongoDB backup..."

# Create backup directory
mkdir -p $BACKUP_DIR

# Generate backup filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/${DB_NAME}_backup_$TIMESTAMP"

# Create backup
mongodump --host $DB_HOST:$DB_PORT --db $DB_NAME --out $BACKUP_PATH

# Compress backup
tar -czf "${BACKUP_PATH}.tar.gz" -C $BACKUP_DIR "$(basename $BACKUP_PATH)"
rm -rf $BACKUP_PATH

echo "✅ Backup created: ${BACKUP_PATH}.tar.gz"

# Cleanup old backups
find $BACKUP_DIR -name "${DB_NAME}_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "🧹 Cleaned up backups older than $RETENTION_DAYS days"
```

### Scheduled Backup Automation
```yaml
# docker-compose.backup.yml
version: '3.8'

services:
  postgres-backup:
    image: postgres:15-alpine
    environment:
      DB_NAME: ${DB_NAME}
      DB_USER: ${DB_USER}
      DB_HOST: postgres
      DB_PORT: 5432
      BACKUP_DIR: /backups
      RETENTION_DAYS: 30
    volumes:
      - ./scripts/backup-postgres.sh:/backup.sh
      - ./backups:/backups
    command: |
      sh -c "
        while true; do
          /backup.sh
          sleep 86400
        done
      "
    depends_on:
      - postgres

  mongodb-backup:
    image: mongo:6
    environment:
      DB_NAME: ${DB_NAME}
      DB_HOST: mongodb
      DB_PORT: 27017
      BACKUP_DIR: /backups
      RETENTION_DAYS: 30
    volumes:
      - ./scripts/backup-mongodb.sh:/backup.sh
      - ./backups:/backups
    command: |
      sh -c "
        while true; do
          /backup.sh
          sleep 86400
        done
      "
    depends_on:
      - mongodb
```

## Database Health Monitoring

### Health Check Script
```python
#!/usr/bin/env python3
# db-health-check.py

import asyncio
import asyncpg
import motor.motor_asyncio
from datetime import datetime, timedelta
import json
import sys

class DatabaseHealthChecker:
    def __init__(self, pg_url=None, mongo_url=None):
        self.pg_url = pg_url
        self.mongo_url = mongo_url
        self.results = {}

    async def check_postgres(self):
        """Check PostgreSQL health"""
        if not self.pg_url:
            return {"status": "not_configured"}

        try:
            conn = await asyncpg.connect(self.pg_url)

            # Basic connection test
            await conn.execute("SELECT 1")

            # Performance metrics
            version = await conn.fetchval("SELECT version()")
            connections = await conn.fetchrow(
                "SELECT count(*) as total FROM pg_stat_activity"
            )

            # Database size
            db_size = await conn.fetchrow(
                "SELECT pg_size_pretty(pg_database_size(current_database())) as size"
            )

            await conn.close()

            return {
                "status": "healthy",
                "version": version.split(',')[0],
                "connections": int(connections['total']),
                "size": db_size['size'],
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    async def check_mongodb(self):
        """Check MongoDB health"""
        if not self.mongo_url:
            return {"status": "not_configured"}

        try:
            client = motor.motor_asyncio.AsyncIOMotorClient(self.mongo_url)
            db = client.get_default_database()

            # Basic connection test
            await db.command('ping')

            # Server status
            server_status = await db.command('serverStatus')

            # Database stats
            db_stats = await db.command('dbStats')

            await client.close()

            return {
                "status": "healthy",
                "version": server_status['version'],
                "collections": db_stats['collections'],
                "data_size": db_stats['dataSize'],
                "storage_size": db_stats['storageSize'],
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    async def check_all(self):
        """Check all configured databases"""
        tasks = []

        if self.pg_url:
            tasks.append(self.check_postgres())

        if self.mongo_url:
            tasks.append(self.check_mongodb())

        results = await asyncio.gather(*tasks, return_exceptions=True)

        self.results = {
            "postgresql": results[0] if self.pg_url else None,
            "mongodb": results[1] if self.mongo_url and len(results) > 1 else None,
            "overall_status": "healthy" if all(
                r.get('status') == 'healthy' for r in results
                if isinstance(r, dict)
            ) else "error",
            "timestamp": datetime.now().isoformat()
        }

    def print_results(self):
        """Print health check results"""
        print("🏥 Database Health Check Results")
        print("=" * 40)

        if self.results.get('postgresql'):
            pg_result = self.results['postgresql']
            print(f"PostgreSQL: {pg_result.get('status', 'unknown').upper()}")
            if pg_result.get('status') == 'healthy':
                print(f"  Version: {pg_result.get('version')}")
                print(f"  Connections: {pg_result.get('connections')}")
                print(f"  Size: {pg_result.get('size')}")
            elif pg_result.get('error'):
                print(f"  Error: {pg_result.get('error')}")

        if self.results.get('mongodb'):
            mongo_result = self.results['mongodb']
            print(f"MongoDB: {mongo_result.get('status', 'unknown').upper()}")
            if mongo_result.get('status') == 'healthy':
                print(f"  Version: {mongo_result.get('version')}")
                print(f"  Collections: {mongo_result.get('collections')}")
                print(f"  Data Size: {mongo_result.get('data_size')} bytes")
            elif mongo_result.get('error'):
                print(f"  Error: {mongo_result.get('error')}")

        print(f"\nOverall Status: {self.results.get('overall_status', 'unknown').upper()}")

async def main():
    checker = DatabaseHealthChecker(
        pg_url=sys.argv[1] if len(sys.argv) > 1 else None,
        mongo_url=sys.argv[2] if len(sys.argv) > 2 else None
    )

    await checker.check_all()
    checker.print_results()

    # Exit with appropriate code
    status_code = 0 if checker.results.get('overall_status') == 'healthy' else 1
    sys.exit(status_code)

if __name__ == "__main__":
    asyncio.run(main())
```

## Performance Optimization

### Connection Pool Configuration
```typescript
// src/database/connection-pool.ts

import { Pool, PoolConfig } from 'pg';
import { MongoClient, MongoClientOptions } from 'mongodb';

export class DatabaseConnectionManager {
  private static pgPool?: Pool;
  private static mongoClient?: MongoClient;

  static getPostgresPool(config?: Partial<PoolConfig>): Pool {
    if (!this.pgPool) {
      const defaultConfig: PoolConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'sweatbot',
        user: process.env.DB_USER || 'sweatbot_user',
        password: process.env.DB_PASSWORD,
        max: 20, // Maximum number of connections
        idleTimeoutMillis: 30000, // Close idle connections after 30s
        connectionTimeoutMillis: 2000, // Return error after 2s
        ...config
      };

      this.pgPool = new Pool(defaultConfig);

      // Handle pool errors
      this.pgPool.on('error', (err) => {
        console.error('Unexpected error on idle client', err);
      });
    }

    return this.pgPool;
  }

  static async getMongoClient(): Promise<MongoClient> {
    if (!this.mongoClient) {
      const options: MongoClientOptions = {
        maxPoolSize: 20,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferMaxEntries: 0,
        bufferCommands: false
      };

      this.mongoClient = new MongoClient(
        process.env.MONGODB_URL || 'mongodb://localhost:27017/sweatbot',
        options
      );

      await this.mongoClient.connect();
    }

    return this.mongoClient;
  }

  static async closeAll(): Promise<void> {
    if (this.pgPool) {
      await this.pgPool.end();
      this.pgPool = undefined;
    }

    if (this.mongoClient) {
      await this.mongoClient.close();
      this.mongoClient = undefined;
    }
  }
}
```

### Query Performance Monitor
```typescript
// src/database/performance-monitor.ts

import { Pool } from 'pg';

export class QueryPerformanceMonitor {
  private slowQueries: Array<{
    query: string;
    duration: number;
    timestamp: Date;
    params?: any[];
  }> = [];

  constructor(private pool: Pool) {}

  async monitoredQuery(text: string, params?: any[]): Promise<any> {
    const startTime = Date.now();

    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - startTime;

      // Log slow queries (more than 100ms)
      if (duration > 100) {
        this.slowQueries.push({
          query: text,
          duration,
          timestamp: new Date(),
          params
        });

        console.warn(`Slow query detected (${duration}ms):`, text);
      }

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Query failed after ${duration}ms:`, text, error);
      throw error;
    }
  }

  getSlowQueries(limit = 10) {
    return this.slowQueries
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  async analyzePerformance() {
    const stats = await this.pool.query(`
      SELECT
        query,
        calls,
        total_time,
        mean_time,
        rows
      FROM pg_stat_statements
      ORDER BY mean_time DESC
      LIMIT 10
    `);

    return {
      slow_queries: this.getSlowQueries(),
      pg_stats: stats.rows,
      recommendations: this.generateRecommendations(stats.rows)
    };
  }

  private generateRecommendations(stats: any[]): string[] {
    const recommendations: string[] = [];

    // Check for high mean execution times
    const highMeanQueries = stats.filter(s => s.mean_time > 1000);
    if (highMeanQueries.length > 0) {
      recommendations.push('Consider adding indexes for frequently queried columns');
    }

    // Check for high total execution times
    const highTotalQueries = stats.filter(s => s.total_time > 10000);
    if (highTotalQueries.length > 0) {
      recommendations.push('Consider query optimization or caching for frequently executed queries');
    }

    return recommendations;
  }
}
```

This database automation skill provides comprehensive tools for database setup, migrations, backups, and monitoring - all essential for production applications.