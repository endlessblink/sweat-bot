import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { postgresConfig } from '../config/environment';
import { logger } from '../utils/logger';

export class MigrationRunner {
  private pool: Pool;

  constructor() {
    this.pool = new Pool(postgresConfig);
  }

  async runMigrations(): Promise<void> {
    try {
      logger.info('🔄 Starting database migrations...');

      // Connect to database
      await this.pool.connect();
      logger.info('✅ Connected to PostgreSQL database');

      // Get migration files - look in source directory (absolute path from project root)
      const migrationsDir = path.join(process.cwd(), 'migrations');
      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort(); // Sort to ensure proper order

      logger.info(`📁 Found ${migrationFiles.length} migration files`);

      // Create migrations table if it doesn't exist
      await this.createMigrationsTable();

      // Get executed migrations
      const executedMigrations = await this.getExecutedMigrations();

      // Run pending migrations
      for (const file of migrationFiles) {
        if (!executedMigrations.includes(file)) {
          await this.runMigration(file, migrationsDir);
        } else {
          logger.info(`⏭️  Skipping already executed migration: ${file}`);
        }
      }

      logger.info('🎉 All migrations completed successfully!');
    } catch (error) {
      logger.error('❌ Migration failed:', error);
      throw error;
    } finally {
      await this.pool.end();
    }
  }

  private async createMigrationsTable(): Promise<void> {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    await this.pool.query(createTableQuery);
    logger.info('✅ Migrations table ensured');
  }

  private async getExecutedMigrations(): Promise<string[]> {
    const result = await this.pool.query('SELECT filename FROM migrations ORDER BY filename');
    return result.rows.map(row => row.filename);
  }

  private async runMigration(filename: string, migrationsDir: string): Promise<void> {
    try {
      logger.info(`🔧 Running migration: ${filename}`);

      // Read migration file
      const migrationPath = path.join(migrationsDir, filename);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

      // Start transaction
      const client = await this.pool.connect();

      try {
        await client.query('BEGIN');

        // Execute migration
        await client.query(migrationSQL);

        // Record migration
        await client.query(
          'INSERT INTO migrations (filename) VALUES ($1)',
          [filename]
        );

        await client.query('COMMIT');

        logger.info(`✅ Migration completed: ${filename}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error(`❌ Migration failed: ${filename}`, error);
      throw error;
    }
  }

  async rollbackMigration(filename: string): Promise<void> {
    logger.warn(`⚠️  Rollback not implemented for migration: ${filename}`);
    // In a production system, you might implement rollback functionality
    // For now, migrations are designed to be run multiple times safely
  }

  async getMigrationStatus(): Promise<{ pending: string[]; executed: string[] }> {
    try {
      await this.createMigrationsTable();
      const executed = await this.getExecutedMigrations();

      const migrationsDir = path.join(process.cwd(), 'migrations');
      const allMigrations = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      const pending = allMigrations.filter(file => !executed.includes(file));

      return { pending, executed };
    } catch (error) {
      logger.error('❌ Failed to get migration status:', error);
      throw error;
    } finally {
      await this.pool.end();
    }
  }
}

// Export convenience function for running migrations
export const runMigrations = async (): Promise<void> => {
  const runner = new MigrationRunner();
  await runner.runMigrations();
};

// Export convenience function for checking migration status
export const getMigrationStatus = async () => {
  const runner = new MigrationRunner();
  return await runner.getMigrationStatus();
};

export default MigrationRunner;