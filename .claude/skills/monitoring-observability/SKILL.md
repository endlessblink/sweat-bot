---
name: Monitoring and Observability
description: Comprehensive monitoring, logging, and observability setup for production applications. Use when setting up monitoring infrastructure, implementing logging, or troubleshooting production issues.
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
---

# Monitoring and Observability

## Overview

Technical skill for implementing comprehensive monitoring, structured logging, metrics collection, and observability for production applications including health checks, alerting, and performance monitoring.

## When to Use

- Setting up production monitoring infrastructure
- Implementing structured logging for applications
- Creating health checks and status endpoints
- Setting up alerting and notification systems
- Troubleshooting production issues
- Performance monitoring and optimization

## Technical Capabilities

1. **Health Check Endpoints**: Comprehensive service health monitoring
2. **Structured Logging**: JSON-based logging with correlation IDs
3. **Metrics Collection**: Application performance metrics
4. **Alerting System**: Automated notifications for critical issues
5. **Performance Monitoring**: Response time and error rate tracking

## Health Check Implementation

### Comprehensive Health Check Endpoint
```typescript
// src/health/health-checker.ts

import { Request, Response } from 'express';
import { Pool } from 'pg';
import { MongoClient } from 'mongodb';
import Redis from 'ioredis';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  details?: any;
  error?: string;
}

interface HealthReport {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  checks: HealthCheck[];
  summary: {
    total: number;
    healthy: number;
    unhealthy: number;
    degraded: number;
  };
}

export class HealthChecker {
  private startTime: number;

  constructor(
    private postgresPool?: Pool,
    private mongoClient?: MongoClient,
    private redisClient?: Redis
  ) {
    this.startTime = Date.now();
  }

  async runHealthChecks(): Promise<HealthReport> {
    const checks: HealthCheck[] = [];

    // Database health checks
    if (this.postgresPool) {
      checks.push(await this.checkPostgres());
    }

    if (this.mongoClient) {
      checks.push(await this.checkMongoDB());
    }

    if (this.redisClient) {
      checks.push(await this.checkRedis());
    }

    // External service checks
    checks.push(await this.checkExternalServices());

    // System resource checks
    checks.push(await this.checkMemoryUsage());
    checks.push(await this.checkDiskSpace());

    const summary = this.summarizeChecks(checks);
    const overallStatus = this.determineOverallStatus(checks);

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || 'unknown',
      checks,
      summary
    };
  }

  private async checkPostgres(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      if (!this.postgresPool) {
        throw new Error('PostgreSQL pool not initialized');
      }

      await this.postgresPool.query('SELECT 1');

      // Get additional stats
      const result = await this.postgresPool.query(`
        SELECT
          count(*) as active_connections,
          count(*) FILTER (WHERE state = 'active') as active_queries
        FROM pg_stat_activity
      `);

      return {
        name: 'postgresql',
        status: 'healthy',
        responseTime: Date.now() - startTime,
        details: {
          activeConnections: parseInt(result.rows[0].active_connections),
          activeQueries: parseInt(result.rows[0].active_queries)
        }
      };

    } catch (error) {
      return {
        name: 'postgresql',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async checkMongoDB(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      if (!this.mongoClient) {
        throw new Error('MongoDB client not initialized');
      }

      const db = this.mongoClient.db();
      await db.admin().ping();

      // Get additional stats
      const stats = await db.stats();

      return {
        name: 'mongodb',
        status: 'healthy',
        responseTime: Date.now() - startTime,
        details: {
          collections: stats.collections,
          dataSize: stats.dataSize,
          indexes: stats.indexes
        }
      };

    } catch (error) {
      return {
        name: 'mongodb',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async checkRedis(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      if (!this.redisClient) {
        throw new Error('Redis client not initialized');
      }

      const result = await this.redisClient.ping();

      if (result !== 'PONG') {
        throw new Error('Redis ping failed');
      }

      // Get Redis info
      const info = await this.redisClient.info('memory');
      const memoryInfo = this.parseRedisInfo(info);

      return {
        name: 'redis',
        status: 'healthy',
        responseTime: Date.now() - startTime,
        details: {
          usedMemory: memoryInfo.used_memory_human,
          maxMemory: memoryInfo.maxmemory_human,
          connectedClients: memoryInfo.connected_clients
        }
      };

    } catch (error) {
      return {
        name: 'redis',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async checkExternalServices(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Check external APIs (example: OpenAI, Groq, etc.)
      const services = [];

      if (process.env.OPENAI_API_KEY) {
        services.push(this.checkOpenAI());
      }

      if (process.env.GROQ_API_KEY) {
        services.push(this.checkGroq());
      }

      const results = await Promise.allSettled(services);
      const failures = results.filter(r => r.status === 'rejected');

      return {
        name: 'external_services',
        status: failures.length > 0 ? 'degraded' : 'healthy',
        responseTime: Date.now() - startTime,
        details: {
          total_services: results.length,
          failures: failures.length
        }
      };

    } catch (error) {
      return {
        name: 'external_services',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async checkOpenAI(): Promise<boolean> {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      }
    });
    return response.ok;
  }

  private async checkGroq(): Promise<boolean> {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      }
    });
    return response.ok;
  }

  private async checkMemoryUsage(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const memUsage = process.memoryUsage();
      const totalMemory = memUsage.heapTotal;
      const usedMemory = memUsage.heapUsed;
      const usagePercent = (usedMemory / totalMemory) * 100;

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (usagePercent > 90) {
        status = 'unhealthy';
      } else if (usagePercent > 80) {
        status = 'degraded';
      }

      return {
        name: 'memory',
        status,
        responseTime: Date.now() - startTime,
        details: {
          heapTotal: Math.round(totalMemory / 1024 / 1024),
          heapUsed: Math.round(usedMemory / 1024 / 1024),
          usagePercent: Math.round(usagePercent),
          external: Math.round(memUsage.external / 1024 / 1024)
        }
      };

    } catch (error) {
      return {
        name: 'memory',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async checkDiskSpace(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const fs = await import('fs/promises');
      const stats = await fs.statfs('.');

      const totalSpace = stats.blocks * stats.bsize;
      const freeSpace = stats.bavail * stats.bsize;
      const usagePercent = ((totalSpace - freeSpace) / totalSpace) * 100;

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (usagePercent > 95) {
        status = 'unhealthy';
      } else if (usagePercent > 85) {
        status = 'degraded';
      }

      return {
        name: 'disk',
        status,
        responseTime: Date.now() - startTime,
        details: {
          totalGB: Math.round(totalSpace / 1024 / 1024 / 1024),
          freeGB: Math.round(freeSpace / 1024 / 1024 / 1024),
          usagePercent: Math.round(usagePercent)
        }
      };

    } catch (error) {
      return {
        name: 'disk',
        status: 'degraded',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private parseRedisInfo(info: string): any {
    const lines = info.split('\r\n');
    const result: any = {};

    for (const line of lines) {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        result[key] = value;
      }
    }

    return result;
  }

  private summarizeChecks(checks: HealthCheck[]) {
    return {
      total: checks.length,
      healthy: checks.filter(c => c.status === 'healthy').length,
      unhealthy: checks.filter(c => c.status === 'unhealthy').length,
      degraded: checks.filter(c => c.status === 'degraded').length
    };
  }

  private determineOverallStatus(checks: HealthCheck[]): 'healthy' | 'unhealthy' | 'degraded' {
    const hasUnhealthy = checks.some(c => c.status === 'unhealthy');
    const hasDegraded = checks.some(c => c.status === 'degraded');

    if (hasUnhealthy) {
      return 'unhealthy';
    } else if (hasDegraded) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }
}

// Express route handler
export async function healthCheckHandler(req: Request, res: Response) {
  const healthChecker = new HealthChecker(
    req.app.get('postgresPool'),
    req.app.get('mongoClient'),
    req.app.get('redisClient')
  );

  try {
    const healthReport = await healthChecker.runHealthChecks();

    const statusCode = healthReport.status === 'healthy' ? 200 :
                      healthReport.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json(healthReport);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
```

## Structured Logging Implementation

### Logger Configuration
```typescript
// src/logging/logger.ts

import winston from 'winston';
import { Request, Response } from 'express';

interface LogContext {
  requestId?: string;
  userId?: string;
  method?: string;
  url?: string;
  userAgent?: string;
  ip?: string;
  duration?: number;
  [key: string]: any;
}

interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: any;
}

export class Logger {
  private winston: winston.Logger;

  constructor() {
    this.winston = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: {
        service: process.env.SERVICE_NAME || 'sweatbot-api',
        version: process.env.npm_package_version || 'unknown',
        environment: process.env.NODE_ENV || 'development'
      },
      transports: [
        // Console transport for development
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),

        // File transport for production
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 5
        }),

        new winston.transports.File({
          filename: 'logs/combined.log',
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 5
        }),

        // External logging service (optional)
        ...(process.env.LOGGLY_TOKEN ? [
          new winston.transports.Http({
            host: 'logs-01.loggly.com',
            port: 443,
            path: '/bulk',
            ssl: true,
            auth: {
              username: process.env.LOGGLY_TOKEN,
              password: 'x'
            }
          })
        ] : [])
      ]
    });
  }

  info(message: string, context?: LogContext): void {
    this.winston.info(message, { context });
  }

  warn(message: string, context?: LogContext): void {
    this.winston.warn(message, { context });
  }

  error(message: string, error?: any, context?: LogContext): void {
    this.winston.error(message, { error, context });
  }

  debug(message: string, context?: LogContext): void {
    this.winston.debug(message, { context });
  }

  // Request logging middleware
  requestLogger() {
    return (req: Request, res: Response, next: any) => {
      const startTime = Date.now();
      const requestId = req.headers['x-request-id'] as string || this.generateRequestId();

      // Add request context
      req.requestId = requestId;
      req.startTime = startTime;

      // Log incoming request
      this.info('Incoming request', {
        requestId,
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
        ip: req.ip
      });

      // Override res.end to log response
      const originalEnd = res.end;
      res.end = function(this: any, ...args: any[]) {
        const duration = Date.now() - startTime;

        // Log response
        loggerInstance.info('Request completed', {
          requestId,
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration
        });

        originalEnd.apply(this, args);
      };

      next();
    };
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }
}

// Singleton instance
export const loggerInstance = new Logger();
export const logger = loggerInstance;
```

### Error Tracking and Monitoring
```typescript
// src/monitoring/error-tracker.ts

import { logger } from '../logging/logger';

interface ErrorReport {
  error: Error;
  context: any;
  timestamp: Date;
  stack: string;
  level: 'low' | 'medium' | 'high' | 'critical';
}

export class ErrorTracker {
  private errors: ErrorReport[] = [];
  private maxErrors = 1000;

  trackError(error: Error, context: any = {}, level: 'low' | 'medium' | 'high' | 'critical' = 'medium') {
    const errorReport: ErrorReport = {
      error,
      context,
      timestamp: new Date(),
      stack: error.stack || '',
      level
    };

    // Add to memory store
    this.errors.push(errorReport);

    // Trim if too many
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Log with structured format
    logger.error('Application error', error, { ...context, level });

    // Send to external services if configured
    this.sendToExternalServices(errorReport);

    // Trigger alerts for critical errors
    if (level === 'critical') {
      this.triggerAlert(errorReport);
    }
  }

  private async sendToExternalServices(errorReport: ErrorReport) {
    // Send to Sentry if configured
    if (process.env.SENTRY_DSN) {
      try {
        const Sentry = await import('@sentry/node');
        Sentry.captureException(errorReport.error, {
          extra: errorReport.context,
          level: errorReport.level
        });
      } catch (e) {
        logger.warn('Failed to send error to Sentry', { error: e });
      }
    }

    // Send to DataDog if configured
    if (process.env.DATADOG_API_KEY) {
      try {
        // DataDog error tracking implementation
        logger.info('Error sent to DataDog', { errorReport });
      } catch (e) {
        logger.warn('Failed to send error to DataDog', { error: e });
      }
    }
  }

  private async triggerAlert(errorReport: ErrorReport) {
    // Send alert to monitoring service
    try {
      await fetch(process.env.WEBHOOK_URL || '', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: `🚨 Critical Error in ${process.env.SERVICE_NAME}`,
          error: errorReport.error.message,
          stack: errorReport.stack,
          context: errorReport.context,
          timestamp: errorReport.timestamp
        })
      });
    } catch (e) {
      logger.error('Failed to send alert', { error: e });
    }
  }

  getErrorStats() {
    const last24Hours = this.errors.filter(e =>
      Date.now() - e.timestamp.getTime() < 24 * 60 * 60 * 1000
    );

    return {
      total: this.errors.length,
      last24h: last24Hours.length,
      byLevel: {
        low: last24Hours.filter(e => e.level === 'low').length,
        medium: last24Hours.filter(e => e.level === 'medium').length,
        high: last24Hours.filter(e => e.level === 'high').length,
        critical: last24Hours.filter(e => e.level === 'critical').length
      },
      recentErrors: last24Hours.slice(-10).map(e => ({
        message: e.error.message,
        timestamp: e.timestamp,
        level: e.level
      }))
    };
  }
}

export const errorTracker = new ErrorTracker();
```

## Metrics Collection

### Application Metrics
```typescript
// src/metrics/metrics-collector.ts

export interface Metrics {
  httpRequests: {
    total: number;
    success: number;
    error: number;
    avgResponseTime: number;
  };
  database: {
    connections: number;
    queryTime: number;
    errors: number;
  };
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  business: {
    activeUsers: number;
    workoutsCompleted: number;
    exercisesLogged: number;
  };
}

export class MetricsCollector {
  private metrics: Metrics = {
    httpRequests: {
      total: 0,
      success: 0,
      error: 0,
      avgResponseTime: 0
    },
    database: {
      connections: 0,
      queryTime: 0,
      errors: 0
    },
    memory: {
      heapUsed: 0,
      heapTotal: 0,
      external: 0
    },
    business: {
      activeUsers: 0,
      workoutsCompleted: 0,
      exercisesLogged: 0
    }
  };

  private responseTimes: number[] = [];

  recordHttpRequest(duration: number, statusCode: number) {
    this.metrics.httpRequests.total++;
    this.responseTimes.push(duration);

    if (statusCode >= 200 && statusCode < 400) {
      this.metrics.httpRequests.success++;
    } else {
      this.metrics.httpRequests.error++;
    }

    // Keep only last 100 response times for average
    if (this.responseTimes.length > 100) {
      this.responseTimes = this.responseTimes.slice(-100);
    }

    this.metrics.httpRequests.avgResponseTime =
      this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
  }

  recordDatabaseQuery(duration: number, success: boolean) {
    if (success) {
      this.metrics.database.queryTime =
        (this.metrics.database.queryTime + duration) / 2; // Simple moving average
    } else {
      this.metrics.database.errors++;
    }
  }

  recordDatabaseConnections(count: number) {
    this.metrics.database.connections = count;
  }

  updateMemoryMetrics() {
    const memUsage = process.memoryUsage();
    this.metrics.memory = {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external
    };
  }

  incrementActiveUsers() {
    this.metrics.business.activeUsers++;
  }

  recordWorkoutCompleted() {
    this.metrics.business.workoutsCompleted++;
  }

  recordExerciseLogged() {
    this.metrics.business.exercisesLogged++;
  }

  getMetrics(): Metrics {
    this.updateMemoryMetrics();
    return { ...this.metrics };
  }

  resetMetrics() {
    this.metrics = {
      httpRequests: {
        total: 0,
        success: 0,
        error: 0,
        avgResponseTime: 0
      },
      database: {
        connections: 0,
        queryTime: 0,
        errors: 0
      },
      memory: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0
      },
      business: {
        activeUsers: 0,
        workoutsCompleted: 0,
        exercisesLogged: 0
      }
    };
    this.responseTimes = [];
  }
}

export const metricsCollector = new MetricsCollector();
```

### Metrics Endpoint
```typescript
// src/metrics/metrics-endpoint.ts

import { Request, Response } from 'express';
import { metricsCollector } from './metrics-collector';
import { errorTracker } from '../monitoring/error-tracker';

export async function metricsHandler(req: Request, res: Response) {
  try {
    const metrics = metricsCollector.getMetrics();
    const errorStats = errorTracker.getErrorStats();

    const payload = {
      timestamp: new Date().toISOString(),
      service: process.env.SERVICE_NAME || 'sweatbot-api',
      version: process.env.npm_package_version || 'unknown',
      metrics,
      errors: errorStats,
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    };

    res.json(payload);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to collect metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
```

## Alerting System

### Alert Manager
```typescript
// src/alerting/alert-manager.ts

interface Alert {
  id: string;
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  condition: string;
  threshold: number;
  currentValue: number;
  triggeredAt: Date;
  resolvedAt?: Date;
  status: 'active' | 'resolved' | 'suppressed';
  message: string;
}

interface AlertRule {
  id: string;
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  duration: number; // seconds
  message: string;
}

export class AlertManager {
  private alerts: Map<string, Alert> = new Map();
  private rules: AlertRule[] = [];
  private lastEvaluation = new Map<string, Date>();

  constructor() {
    this.setupDefaultRules();
  }

  private setupDefaultRules() {
    this.rules = [
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        severity: 'high',
        metric: 'http_error_rate',
        operator: 'gt',
        threshold: 10, // 10% error rate
        duration: 300, // 5 minutes
        message: 'HTTP error rate is above 10%'
      },
      {
        id: 'high_response_time',
        name: 'High Response Time',
        severity: 'medium',
        metric: 'avg_response_time',
        operator: 'gt',
        threshold: 2000, // 2 seconds
        duration: 300,
        message: 'Average response time is above 2 seconds'
      },
      {
        id: 'memory_usage',
        name: 'High Memory Usage',
        severity: 'high',
        metric: 'memory_usage_percent',
        operator: 'gt',
        threshold: 85, // 85% memory usage
        duration: 600, // 10 minutes
        message: 'Memory usage is above 85%'
      },
      {
        id: 'database_errors',
        name: 'Database Errors',
        severity: 'critical',
        metric: 'database_error_rate',
        operator: 'gt',
        threshold: 5, // 5% error rate
        duration: 60, // 1 minute
        message: 'Database error rate is above 5%'
      }
    ];
  }

  async evaluateRules(metrics: any) {
    const now = new Date();

    for (const rule of this.rules) {
      try {
        const value = this.extractMetricValue(metrics, rule.metric);
        const conditionMet = this.evaluateCondition(value, rule.operator, rule.threshold);

        if (conditionMet) {
          const lastEvalTime = this.lastEvaluation.get(rule.id);
          const durationMet = lastEvalTime &&
            (now.getTime() - lastEvalTime.getTime()) >= rule.duration * 1000;

          if (durationMet && !this.alerts.has(rule.id)) {
            await this.triggerAlert(rule, value);
          }
        } else {
          // Resolve alert if condition no longer met
          const existingAlert = this.alerts.get(rule.id);
          if (existingAlert && existingAlert.status === 'active') {
            await this.resolveAlert(rule.id);
          }
        }

        // Update last evaluation time
        this.lastEvaluation.set(rule.id, now);

      } catch (error) {
        console.error(`Failed to evaluate rule ${rule.id}:`, error);
      }
    }
  }

  private extractMetricValue(metrics: any, metricPath: string): number {
    const paths = metricPath.split('.');
    let value = metrics;

    for (const path of paths) {
      value = value[path];
    }

    // Handle calculated metrics
    switch (metricPath) {
      case 'http_error_rate':
        const total = metrics.httpRequests?.total || 1;
        const errors = metrics.httpRequests?.error || 0;
        return (errors / total) * 100;

      case 'memory_usage_percent':
        const heapUsed = metrics.memory?.heapUsed || 0;
        const heapTotal = metrics.memory?.heapTotal || 1;
        return (heapUsed / heapTotal) * 100;

      case 'database_error_rate':
        const dbQueries = metrics.database?.queryTime ? 1 : 0;
        const dbErrors = metrics.database?.errors || 0;
        return dbQueries > 0 ? (dbErrors / dbQueries) * 100 : 0;

      default:
        return typeof value === 'number' ? value : 0;
    }
  }

  private evaluateCondition(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'gt': return value > threshold;
      case 'gte': return value >= threshold;
      case 'lt': return value < threshold;
      case 'lte': return value <= threshold;
      case 'eq': return value === threshold;
      default: return false;
    }
  }

  private async triggerAlert(rule: AlertRule, currentValue: number) {
    const alert: Alert = {
      id: rule.id,
      name: rule.name,
      severity: rule.severity,
      condition: `${rule.metric} ${rule.operator} ${rule.threshold}`,
      threshold: rule.threshold,
      currentValue,
      triggeredAt: new Date(),
      status: 'active',
      message: rule.message
    };

    this.alerts.set(rule.id, alert);

    // Send notification
    await this.sendNotification(alert);

    console.warn(`🚨 Alert triggered: ${rule.name}`, alert);
  }

  private async resolveAlert(alertId: string) {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.status = 'resolved';
      alert.resolvedAt = new Date();

      // Send resolution notification
      await this.sendResolutionNotification(alert);

      console.info(`✅ Alert resolved: ${alert.name}`, alert);
    }
  }

  private async sendNotification(alert: Alert) {
    const payload = {
      text: `🚨 Alert: ${alert.name}`,
      attachments: [{
        color: this.getSeverityColor(alert.severity),
        fields: [
          { title: 'Severity', value: alert.severity.toUpperCase(), short: true },
          { title: 'Condition', value: alert.condition, short: true },
          { title: 'Current Value', value: alert.currentValue.toString(), short: true },
          { title: 'Threshold', value: alert.threshold.toString(), short: true },
          { title: 'Triggered At', value: alert.triggeredAt.toISOString(), short: true }
        ],
        text: alert.message
      }]
    };

    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (error) {
        console.error('Failed to send Slack notification:', error);
      }
    }
  }

  private async sendResolutionNotification(alert: Alert) {
    const payload = {
      text: `✅ Resolved: ${alert.name}`,
      attachments: [{
        color: 'good',
        fields: [
          { title: 'Duration', value: this.getAlertDuration(alert), short: true },
          { title: 'Resolved At', value: alert.resolvedAt?.toISOString() || '', short: true }
        ]
      }]
    };

    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (error) {
        console.error('Failed to send resolution notification:', error);
      }
    }
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return '#ff9500';
      case 'low': return '#36a64f';
      default: return '#808080';
    }
  }

  private getAlertDuration(alert: Alert): string {
    if (!alert.resolvedAt) return 'N/A';

    const duration = alert.resolvedAt.getTime() - alert.triggeredAt.getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);

    return `${minutes}m ${seconds}s`;
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => alert.status === 'active');
  }

  getAllAlerts(): Alert[] {
    return Array.from(this.alerts.values());
  }
}

export const alertManager = new AlertManager();
```

## Monitoring Dashboard Script

### Monitoring Dashboard
```bash
#!/bin/bash
# monitoring-dashboard.sh

set -e

API_BASE_URL=${API_BASE_URL:-http://localhost:8000}
INTERVAL=${INTERVAL:-30}

echo "📊 Starting Monitoring Dashboard..."
echo "API URL: $API_BASE_URL"
echo "Refresh Interval: ${INTERVAL}s"

while true; do
  clear

  # Get current timestamp
  echo "📊 SweatBot Monitoring Dashboard - $(date)"
  echo "=================================================="

  # Health check
  echo "🏥 Health Status:"
  if health_data=$(curl -s "$API_BASE_URL/health" 2>/dev/null); then
    status=$(echo "$health_data" | jq -r '.status // "unknown"')
    if [ "$status" = "healthy" ]; then
      echo "  ✅ Overall Status: HEALTHY"
    else
      echo "  ❌ Overall Status: $status"
    fi

    # Database status
    postgres_status=$(echo "$health_data" | jq -r '.checks[] | select(.name=="postgresql") | .status // "unknown"')
    mongodb_status=$(echo "$health_data" | jq -r '.checks[] | select(.name=="mongodb") | .status // "unknown"')
    redis_status=$(echo "$health_data" | jq -r '.checks[] | select(.name=="redis") | .status // "unknown"')

    echo "  🐘 PostgreSQL: $postgres_status"
    echo "  🍃 MongoDB: $mongodb_status"
    echo "  🔴 Redis: $redis_status"
  else
    echo "  ❌ Health check failed"
  fi

  echo ""

  # Metrics
  echo "📈 Application Metrics:"
  if metrics_data=$(curl -s "$API_BASE_URL/metrics" 2>/dev/null); then
    http_total=$(echo "$metrics_data" | jq -r '.metrics.httpRequests.total // 0')
    http_success=$(echo "$metrics_data" | jq -r '.metrics.httpRequests.success // 0')
    http_error=$(echo "$metrics_data" | jq -r '.metrics.httpRequests.error // 0')
    avg_response=$(echo "$metrics_data" | jq -r '.metrics.httpRequests.avgResponseTime // 0')

    echo "  🌐 HTTP Requests: $http_total total, $http_success success, $http_error errors"
    echo "  ⏱️  Avg Response Time: ${avg_response}ms"

    # Business metrics
    active_users=$(echo "$metrics_data" | jq -r '.metrics.business.activeUsers // 0')
    workouts_completed=$(echo "$metrics_data" | jq -r '.metrics.business.workoutsCompleted // 0')
    exercises_logged=$(echo "$metrics_data" | jq -r '.metrics.business.exercisesLogged // 0')

    echo "  👥 Active Users: $active_users"
    echo "  🏋️  Workouts Completed: $workouts_completed"
    echo "  📝 Exercises Logged: $exercises_logged"

    # Error stats
    error_total=$(echo "$metrics_data" | jq -r '.errors.total // 0')
    error_24h=$(echo "$metrics_data" | jq -r '.errors.last24h // 0')

    echo "  🚨 Errors: $error_24h (24h), $error_total (total)"
  else
    echo "  ❌ Metrics unavailable"
  fi

  echo ""
  echo "Last updated: $(date)"
  echo "Refreshing in ${INTERVAL}s... (Ctrl+C to exit)"

  sleep $INTERVAL
done
```

This comprehensive monitoring and observability skill provides all the necessary infrastructure for production monitoring including health checks, structured logging, metrics collection, alerting, and real-time dashboards.