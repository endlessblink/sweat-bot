---
name: Debugging & Troubleshooting
description: Complete debugging and troubleshooting workflows for systematic error analysis, performance profiling, log analysis, and incident response. Use when encountering errors, performance issues, system failures, or needing systematic debugging methodologies.
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
---

# Debugging & Troubleshooting

## Overview

Technical skill for implementing comprehensive debugging and troubleshooting workflows including error analysis, performance profiling, log analysis, memory leak detection, network issue diagnosis, and systematic incident response procedures.

## When to Use

- Analyzing application errors and exceptions
- Investigating performance bottlenecks and slow responses
- Debugging memory leaks and resource utilization issues
- Diagnosing network connectivity and API failures
- Implementing systematic troubleshooting workflows
- Setting up monitoring and alerting for proactive debugging

## Technical Capabilities

1. **Error Analysis**: Stack trace interpretation, error categorization, root cause analysis
2. **Performance Profiling**: CPU usage analysis, memory profiling, I/O bottleneck identification
3. **Log Analysis**: Structured log parsing, error pattern detection, correlation analysis
4. **Memory Debugging**: Memory leak detection, heap analysis, garbage collection monitoring
5. **Network Troubleshooting**: Connection debugging, API failure analysis, latency investigation
6. **Incident Response**: Systematic troubleshooting procedures, escalation protocols

## Debugging Workflow Templates

### Error Analysis Framework
```typescript
// utils/errorAnalyzer.ts

export interface ErrorContext {
  timestamp: Date;
  environment: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  ip?: string;
}

export interface ErrorAnalysis {
  errorType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'syntax' | 'runtime' | 'logic' | 'integration' | 'performance' | 'security';
  rootCause: string;
  stackTrace?: string;
  relatedFiles: string[];
  suggestedFixes: string[];
  preventionStrategies: string[];
  context: ErrorContext;
}

export class ErrorAnalyzer {
  private errorPatterns: Map<string, RegExp[]> = new Map([
    ['database', [
      /connection.*refused/i,
      /timeout.*expired/i,
      /too.*many.*connections/i,
      /duplicate.*key/i
    ]],
    ['network', [
      /ECONNREFUSED/i,
      /ETIMEDOUT/i,
      /ENOTFOUND/i,
      /5\d{2}/g  // 5xx HTTP errors
    ]],
    ['memory', [
      /out.*of.*memory/i,
      /heap.*overflow/i,
      /allocation.*failed/i,
      /gc.*overhead/i
    ]],
    ['authentication', [
      /unauthorized/i,
      /token.*expired/i,
      /invalid.*credentials/i,
      /forbidden/i
    ]]
  ]);

  analyzeError(error: Error, context: Partial<ErrorContext> = {}): ErrorAnalysis {
    const fullContext: ErrorContext = {
      timestamp: new Date(),
      environment: process.env.NODE_ENV || 'unknown',
      ...context
    };

    const errorType = this.classifyError(error);
    const severity = this.assessSeverity(error, errorType);
    const category = this.categorizeError(error);
    const rootCause = this.identifyRootCause(error, category);
    const relatedFiles = this.findRelatedFiles(error);
    const suggestedFixes = this.generateFixSuggestions(error, category, rootCause);
    const preventionStrategies = this.generatePreventionStrategies(category, rootCause);

    return {
      errorType,
      severity,
      category,
      rootCause,
      stackTrace: error.stack,
      relatedFiles,
      suggestedFixes,
      preventionStrategies,
      context: fullContext
    };
  }

  private classifyError(error: Error): string {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    for (const [category, patterns] of this.errorPatterns) {
      for (const pattern of patterns) {
        if (pattern.test(message) || pattern.test(stack)) {
          return category;
        }
      }
    }

    return 'unknown';
  }

  private assessSeverity(error: Error, errorType: string): ErrorAnalysis['severity'] {
    // Critical errors that stop the application
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      return 'critical';
    }

    // High severity errors
    if (['database', 'authentication', 'security'].includes(errorType)) {
      return 'high';
    }

    // Medium severity errors
    if (['network', 'memory'].includes(errorType)) {
      return 'medium';
    }

    return 'low';
  }

  private categorizeError(error: Error): ErrorAnalysis['category'] {
    if (error.name.includes('Syntax') || error.name.includes('Type')) {
      return 'syntax';
    }

    if (error.message.includes('timeout') || error.message.includes('performance')) {
      return 'performance';
    }

    if (error.message.includes('unauthorized') || error.message.includes('forbidden')) {
      return 'security';
    }

    if (error.message.includes('fetch') || error.message.includes('axios')) {
      return 'integration';
    }

    return 'runtime';
  }

  private identifyRootCause(error: Error, category: ErrorAnalysis['category']): string {
    switch (category) {
      case 'syntax':
        return 'Code syntax or type error preventing execution';
      case 'performance':
        return 'Resource bottleneck or inefficient algorithm';
      case 'security':
        return 'Authentication or authorization failure';
      case 'integration':
        return 'External service or API communication failure';
      default:
        return 'Runtime execution error';
    }
  }

  private findRelatedFiles(error: Error): string[] {
    const stackLines = error.stack?.split('\n') || [];
    const files: string[] = [];

    for (const line of stackLines) {
      const match = line.match(/at.*\(([^)]+)\)/) || line.match(/at\s+(.+)/);
      if (match) {
        const filePath = match[1].split(':')[0];
        if (filePath.includes('/') || filePath.includes('\\')) {
          files.push(filePath);
        }
      }
    }

    return [...new Set(files)]; // Remove duplicates
  }

  private generateFixSuggestions(error: Error, category: ErrorAnalysis['category'], rootCause: string): string[] {
    const suggestions: string[] = [];

    switch (category) {
      case 'syntax':
        suggestions.push(
          'Check for missing semicolons or brackets',
          'Verify variable declarations and types',
          'Run linter to catch syntax errors early'
        );
        break;
      case 'performance':
        suggestions.push(
          'Profile the code to identify bottlenecks',
          'Consider caching frequently accessed data',
          'Optimize database queries and indexes'
        );
        break;
      case 'security':
        suggestions.push(
          'Verify authentication token validity',
          'Check user permissions and roles',
          'Implement proper error handling for auth failures'
        );
        break;
      case 'integration':
        suggestions.push(
          'Verify API endpoint availability and configuration',
          'Check network connectivity and firewall settings',
          'Implement retry logic with exponential backoff'
        );
        break;
      default:
        suggestions.push(
          'Review error logs for additional context',
          'Check recent code changes that might have introduced the issue',
          'Consider adding more defensive programming practices'
        );
    }

    return suggestions;
  }

  private generatePreventionStrategies(category: ErrorAnalysis['category'], rootCause: string): string[] {
    const strategies: string[] = [];

    strategies.push(
      'Implement comprehensive error handling and logging',
      'Add unit tests to catch similar errors early',
      'Set up monitoring and alerting for error patterns'
    );

    switch (category) {
      case 'syntax':
        strategies.push(
          'Configure pre-commit hooks for linting and type checking',
          'Use TypeScript for better type safety'
        );
        break;
      case 'performance':
        strategies.push(
          'Implement performance monitoring and profiling',
          'Set up automated performance testing in CI/CD'
        );
        break;
      case 'security':
        strategies.push(
          'Implement regular security audits and penetration testing',
          'Use secure coding practices and frameworks'
        );
        break;
    }

    return strategies;
  }
}
```

### Performance Profiler
```typescript
// utils/performanceProfiler.ts

export interface PerformanceMetrics {
  cpu: {
    usage: number;
    userTime: number;
    systemTime: number;
  };
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  eventLoop: {
    utilization: number;
    lag: number;
  };
  gc: {
    collections: number;
    duration: number;
    type: 'minor' | 'major';
  }[];
}

export interface PerformanceSnapshot {
  timestamp: Date;
  metrics: PerformanceMetrics;
  bottlenecks: string[];
  recommendations: string[];
}

export class PerformanceProfiler {
  private snapshots: PerformanceSnapshot[] = [];
  private isProfiling = false;
  private profilingInterval?: NodeJS.Timeout;

  startProfiling(intervalMs: number = 1000): void {
    if (this.isProfiling) {
      return;
    }

    this.isProfiling = true;
    console.log('🔍 Starting performance profiling...');

    this.profilingInterval = setInterval(() => {
      this.takeSnapshot();
    }, intervalMs);
  }

  stopProfiling(): PerformanceSnapshot[] {
    if (!this.isProfiling) {
      return [];
    }

    this.isProfiling = false;
    if (this.profilingInterval) {
      clearInterval(this.profilingInterval);
    }

    console.log('⏹️ Performance profiling stopped');
    return this.snapshots;
  }

  private takeSnapshot(): void {
    const metrics = this.collectMetrics();
    const bottlenecks = this.identifyBottlenecks(metrics);
    const recommendations = this.generateRecommendations(metrics, bottlenecks);

    const snapshot: PerformanceSnapshot = {
      timestamp: new Date(),
      metrics,
      bottlenecks,
      recommendations
    };

    this.snapshots.push(snapshot);

    // Keep only last 60 snapshots (1 minute if profiling every second)
    if (this.snapshots.length > 60) {
      this.snapshots.shift();
    }

    // Log if significant issues found
    if (bottlenecks.length > 0) {
      console.warn('⚠️ Performance bottlenecks detected:', bottlenecks);
    }
  }

  private collectMetrics(): PerformanceMetrics {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      cpu: {
        usage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
        userTime: cpuUsage.user / 1000000,
        systemTime: cpuUsage.system / 1000000
      },
      memory: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss
      },
      eventLoop: {
        utilization: 0, // Would need external library for accurate measurement
        lag: 0 // Would need event-loop monitoring library
      },
      gc: [] // Would need GC hooks from v8 module
    };
  }

  private identifyBottlenecks(metrics: PerformanceMetrics): string[] {
    const bottlenecks: string[] = [];

    // Memory usage thresholds
    const memoryUsagePercent = (metrics.memory.heapUsed / metrics.memory.heapTotal) * 100;
    if (memoryUsagePercent > 80) {
      bottlenecks.push(`High memory usage: ${memoryUsagePercent.toFixed(1)}%`);
    }

    if (metrics.memory.rss > 1024 * 1024 * 1024) { // > 1GB
      bottlenecks.push(`High RSS memory: ${(metrics.memory.rss / 1024 / 1024).toFixed(1)}MB`);
    }

    // CPU usage thresholds
    if (metrics.cpu.usage > 0.8) { // > 80% CPU
      bottlenecks.push(`High CPU usage: ${(metrics.cpu.usage * 100).toFixed(1)}%`);
    }

    return bottlenecks;
  }

  private generateRecommendations(metrics: PerformanceMetrics, bottlenecks: string[]): string[] {
    const recommendations: string[] = [];

    if (bottlenecks.some(b => b.includes('memory'))) {
      recommendations.push(
        'Check for memory leaks in long-running operations',
        'Optimize data structures and reduce object creation',
        'Consider implementing object pooling for frequently created objects'
      );
    }

    if (bottlenecks.some(b => b.includes('CPU'))) {
      recommendations.push(
        'Profile CPU-intensive functions and optimize algorithms',
        'Consider moving heavy computations to worker threads',
        'Implement caching for expensive operations'
      );
    }

    // General recommendations based on metrics
    if (metrics.memory.heapUsed > 500 * 1024 * 1024) { // > 500MB
      recommendations.push('Monitor heap usage and consider implementing heap snapshots');
    }

    return recommendations;
  }

  generateReport(): string {
    if (this.snapshots.length === 0) {
      return 'No performance data available. Start profiling first.';
    }

    const latest = this.snapshots[this.snapshots.length - 1];
    const oldest = this.snapshots[0];

    const report = `
# Performance Analysis Report

**Time Range**: ${oldest.timestamp.toISOString()} to ${latest.timestamp.toISOString()}
**Snapshots Collected**: ${this.snapshots.length}

## Current Metrics
- **Memory Usage**: ${(latest.metrics.memory.heapUsed / 1024 / 1024).toFixed(1)}MB / ${(latest.metrics.memory.heapTotal / 1024 / 1024).toFixed(1)}MB
- **RSS Memory**: ${(latest.metrics.memory.rss / 1024 / 1024).toFixed(1)}MB
- **CPU Usage**: ${(latest.metrics.cpu.usage * 100).toFixed(2)}%

## Detected Issues
${latest.bottlenecks.length > 0
  ? latest.bottlenecks.map(b => `- ⚠️ ${b}`).join('\n')
  : '- ✅ No significant bottlenecks detected'
}

## Recommendations
${latest.recommendations.length > 0
  ? latest.recommendations.map(r => `- 💡 ${r}`).join('\n')
  : '- ✅ Performance looks optimal'
}

## Trends
- Memory change: ${((latest.metrics.memory.heapUsed - oldest.metrics.memory.heapUsed) / 1024 / 1024).toFixed(1)}MB
- Average memory: ${(this.snapshots.reduce((sum, s) => sum + s.metrics.memory.heapUsed, 0) / this.snapshots.length / 1024 / 1024).toFixed(1)}MB
    `;

    return report.trim();
  }
}
```

### Log Analyzer
```typescript
// utils/logAnalyzer.ts

export interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  module?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

export interface LogAnalysis {
  totalEntries: number;
  errorCount: number;
  warningCount: number;
  criticalErrors: LogEntry[];
  errorPatterns: Map<string, number>;
  recommendations: string[];
  timeline: Array<{
    time: Date;
    level: string;
    count: number;
  }>;
}

export class LogAnalyzer {
  private logLevels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4
  };

  parseLogFile(logContent: string): LogEntry[] {
    const lines = logContent.split('\n').filter(line => line.trim());
    const entries: LogEntry[] = [];

    for (const line of lines) {
      try {
        const entry = this.parseLogLine(line);
        if (entry) {
          entries.push(entry);
        }
      } catch (error) {
        // Skip malformed log lines
        continue;
      }
    }

    return entries;
  }

  private parseLogLine(line: string): LogEntry | null {
    // Common log formats
    // JSON format: {"timestamp":"2025-01-01T12:00:00.000Z","level":"error","message":"Something went wrong"}
    // Common format: 2025-01-01 12:00:00 ERROR [module] Something went wrong

    // Try JSON format first
    try {
      const jsonEntry = JSON.parse(line);
      return {
        timestamp: new Date(jsonEntry.timestamp),
        level: jsonEntry.level.toLowerCase(),
        message: jsonEntry.message,
        module: jsonEntry.module,
        userId: jsonEntry.userId,
        sessionId: jsonEntry.sessionId,
        requestId: jsonEntry.requestId,
        metadata: jsonEntry.metadata
      };
    } catch {
      // Not JSON, try common format
    }

    // Common format regex
    const commonFormatRegex = /^(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})?)\s+(\w+)\s*(?:\[([^\]]+)\])?\s*(.+)$/i;
    const match = line.match(commonFormatRegex);

    if (match) {
      const [, timestamp, level, module, message] = match;
      return {
        timestamp: new Date(timestamp),
        level: level.toLowerCase() as LogEntry['level'],
        message: message.trim(),
        module: module?.trim()
      };
    }

    return null;
  }

  analyzeLogs(entries: LogEntry[]): LogAnalysis {
    const errorCount = entries.filter(e => e.level === 'error' || e.level === 'fatal').length;
    const warningCount = entries.filter(e => e.level === 'warn').length;
    const criticalErrors = entries.filter(e => e.level === 'fatal');

    const errorPatterns = new Map<string, number>();
    entries
      .filter(e => e.level === 'error' || e.level === 'fatal')
      .forEach(entry => {
        const pattern = this.extractErrorPattern(entry.message);
        errorPatterns.set(pattern, (errorPatterns.get(pattern) || 0) + 1);
      });

    const timeline = this.generateTimeline(entries);
    const recommendations = this.generateLogRecommendations(errorCount, warningCount, errorPatterns);

    return {
      totalEntries: entries.length,
      errorCount,
      warningCount,
      criticalErrors,
      errorPatterns,
      recommendations,
      timeline
    };
  }

  private extractErrorPattern(message: string): string {
    // Extract common error patterns
    const patterns = [
      /connection.*refused/i,
      /timeout.*expired/i,
      /duplicate.*key/i,
      /authentication.*failed/i,
      /validation.*error/i,
      /null.*pointer/i,
      /undefined.*property/i
    ];

    for (const pattern of patterns) {
      if (pattern.test(message)) {
        return pattern.source;
      }
    }

    // Use first few words as pattern if no specific pattern matches
    return message.split(' ').slice(0, 3).join(' ');
  }

  private generateTimeline(entries: LogEntry[]): Array<{time: Date; level: string; count: number}> {
    const timeGroups = new Map<string, Map<string, number>>();

    for (const entry of entries) {
      const minuteKey = new Date(entry.timestamp).toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
      if (!timeGroups.has(minuteKey)) {
        timeGroups.set(minuteKey, new Map());
      }
      const levelMap = timeGroups.get(minuteKey)!;
      levelMap.set(entry.level, (levelMap.get(entry.level) || 0) + 1);
    }

    return Array.from(timeGroups.entries())
      .map(([time, levels]) => ({
        time: new Date(time),
        level: Array.from(levels.entries()).reduce((a, b) => a[1] > b[1] ? a : b)[0],
        count: Array.from(levels.values()).reduce((a, b) => a + b, 0)
      }))
      .sort((a, b) => a.time.getTime() - b.time.getTime());
  }

  private generateLogRecommendations(errorCount: number, warningCount: number, errorPatterns: Map<string, number>): string[] {
    const recommendations: string[] = [];

    if (errorCount > 0) {
      recommendations.push(`Investigate ${errorCount} error(s) - prioritize critical issues first`);
    }

    if (warningCount > errorCount * 2) {
      recommendations.push('High warning-to-error ratio - address warning conditions to prevent future errors');
    }

    // Top error patterns
    const topPatterns = Array.from(errorPatterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    if (topPatterns.length > 0) {
      recommendations.push('Most common error patterns:');
      topPatterns.forEach(([pattern, count]) => {
        recommendations.push(`  - ${pattern}: ${count} occurrences`);
      });
    }

    if (errorCount === 0 && warningCount === 0) {
      recommendations.push('✅ Excellent log health - no errors or warnings detected');
    }

    return recommendations;
  }

  searchLogs(entries: LogEntry[], query: {
    level?: LogEntry['level'];
    module?: string;
    messageContains?: string;
    userId?: string;
    timeRange?: { start: Date; end: Date };
  }): LogEntry[] {
    return entries.filter(entry => {
      if (query.level && entry.level !== query.level) return false;
      if (query.module && entry.module !== query.module) return false;
      if (query.messageContains && !entry.message.toLowerCase().includes(query.messageContains.toLowerCase())) return false;
      if (query.userId && entry.userId !== query.userId) return false;
      if (query.timeRange) {
        const entryTime = entry.timestamp.getTime();
        if (entryTime < query.timeRange.start.getTime() || entryTime > query.timeRange.end.getTime()) return false;
      }
      return true;
    });
  }
}
```

## Debugging Scripts

### Comprehensive Error Analysis
```bash
#!/bin/bash
# scripts/debug-error.sh

set -e

echo "🔍 Starting comprehensive error analysis..."

# Check if we're in a project directory
if [ ! -f "package.json" ] && [ ! -f "requirements.txt" ]; then
    echo "❌ Error: Not in a valid project directory"
    exit 1
fi

# Create debug directory
mkdir -p debug-output

# 1. Check application logs
echo "📋 Analyzing application logs..."
if [ -d "logs" ]; then
    find logs -name "*.log" -exec echo "=== {} ===" \; -exec tail -50 {} \;
else
    echo "No logs directory found"
fi

# 2. Check for common error patterns
echo "🔍 Searching for error patterns in code..."
error_patterns=(
    "Error:"
    "Exception:"
    "FAIL"
    "panic:"
    "fatal:"
    "critical:"
)

for pattern in "${error_patterns[@]}"; do
    echo "🔍 Searching for pattern: $pattern"
    if [ -d "src" ]; then
        grep -r "$pattern" src/ --include="*.js" --include="*.ts" --include="*.py" || echo "No $pattern found in src/"
    fi
    if [ -d "backend" ]; then
        grep -r "$pattern" backend/ --include="*.js" --include="*.ts" --include="*.py" || echo "No $pattern found in backend/"
    fi
done

# 3. Check environment and dependencies
echo "🔧 Checking environment configuration..."
if [ -f ".env" ]; then
    echo "✅ .env file found"
    # Check for missing required variables
    if [ -f ".env.example" ]; then
        echo "🔍 Checking for missing environment variables..."
        comm -23 <(sort .env.example) <(sort .env 2>/dev/null || echo "") || echo "All variables present"
    fi
else
    echo "❌ No .env file found"
fi

# 4. Check database connectivity
echo "🗄️ Checking database connectivity..."
if command -v curl &> /dev/null; then
    if [ -n "$DATABASE_URL" ] || grep -q "DATABASE_URL" .env 2>/dev/null; then
        echo "✅ DATABASE_URL configured"
    else
        echo "❌ DATABASE_URL not found"
    fi
fi

# 5. Memory and process analysis
echo "💾 Checking memory usage..."
if command -v node &> /dev/null && [ -f "package.json" ]; then
    echo "Node.js process analysis:"
    if pgrep -f "node" > /dev/null; then
        ps aux | grep node | grep -v grep
    else
        echo "No Node.js processes running"
    fi
fi

echo "✅ Error analysis complete. Check debug-output/ for detailed results."
```

### Performance Profiling Script
```bash
#!/bin/bash
# scripts/profile-performance.sh

set -e

echo "📊 Starting performance profiling..."

# Check if Node.js project
if [ -f "package.json" ]; then
    echo "🟢 Node.js project detected"

    # Install clinic.js if not present
    if ! npm list -g @clinic/clinic > /dev/null 2>&1; then
        echo "📦 Installing clinic.js for performance profiling..."
        npm install -g @clinic/clinic
    fi

    # Check if application is running
    if pgrep -f "node" > /dev/null; then
        echo "🔍 Found running Node.js processes"

        # Get PID of main application process
        APP_PID=$(pgrep -f "node.*server\|node.*app" | head -1)

        if [ -n "$APP_PID" ]; then
            echo "📈 Starting Clinic.js profiling for PID: $APP_PID"

            # Create profiling directory
            mkdir -p profiling-results

            # Run different profilers
            echo "🔬 Running bubbleprof (I/O profiling)..."
            timeout 30s clinic bubbleprof --on-port 'http://localhost:8000' --output profiling-results/bubbleprof || true

            echo "🔬 Running doctor (general health)..."
            timeout 30s clinic doctor --on-port 'http://localhost:8000' --output profiling-results/doctor || true

            echo "🔬 Running flame (CPU profiling)..."
            timeout 30s clinic flame --on-port 'http://localhost:8000' --output profiling-results/flame || true

            echo "✅ Performance profiling complete"
            echo "📊 Check profiling-results/ directory for detailed reports"

        else
            echo "❌ Could not identify main application process"
            echo "💡 Make sure your application is running on port 8000"
        fi
    else
        echo "❌ No Node.js processes found"
        echo "💡 Start your application first, then run this script"
    fi

elif [ -f "requirements.txt" ]; then
    echo "🐍 Python project detected"

    # Check for Python profiling tools
    if command -v python3 &> /dev/null; then
        echo "📈 Python memory profiling..."

        # Check if application is running
        if pgrep -f "python" > /dev/null; then
            echo "🔍 Found running Python processes"

            # Get memory usage of Python processes
            ps aux | grep python | grep -v grep

            # If memory-profiler is available, use it
            if python3 -c "import memory_profiler" 2>/dev/null; then
                echo "📊 memory-profiler available"
                echo "💡 Use: python3 -m memory_profiler your_script.py"
            else
                echo "💡 Install memory-profiler: pip install memory-profiler"
            fi

        else
            echo "❌ No Python processes found"
        fi
    fi

else
    echo "❌ Unsupported project type for performance profiling"
    echo "💡 This script supports Node.js and Python projects"
fi
```

### Log Analysis Script
```bash
#!/bin/bash
# scripts/analyze-logs.sh

set -e

echo "📋 Starting log analysis..."

# Find log files
LOG_FILES=()
if [ -d "logs" ]; then
    while IFS= read -r -d '' file; do
        LOG_FILES+=("$file")
    done < <(find logs -name "*.log" -print0)
fi

if [ ${#LOG_FILES[@]} -eq 0 ]; then
    echo "❌ No log files found in logs/ directory"

    # Check common log locations
    COMMON_LOG_LOC=(
        "app.log"
        "server.log"
        "error.log"
        "debug.log"
        "application.log"
    )

    for log_file in "${COMMON_LOG_LOC[@]}"; do
        if [ -f "$log_file" ]; then
            LOG_FILES+=("$log_file")
        fi
    done

    if [ ${#LOG_FILES[@]} -eq 0 ]; then
        echo "❌ No log files found in common locations"
        exit 1
    fi
fi

echo "📁 Found ${#LOG_FILES[@]} log file(s):"
printf '  %s\n' "${LOG_FILES[@]}"

# Create analysis directory
mkdir -p log-analysis

# Analyze each log file
for log_file in "${LOG_FILES[@]}"; do
    echo "🔍 Analyzing: $log_file"

    filename=$(basename "$log_file")
    analysis_file="log-analysis/${filename%.log}-analysis.txt"

    {
        echo "# Log Analysis: $log_file"
        echo "Generated: $(date)"
        echo ""

        echo "## File Information"
        echo "- Size: $(du -h "$log_file" | cut -f1)"
        echo "- Lines: $(wc -l < "$log_file")"
        echo "- Modified: $(stat -c %y "$log_file")"
        echo ""

        echo "## Error Analysis"
        error_count=$(grep -c -i "error\|exception\|fail\|fatal" "$log_file" || echo "0")
        echo "- Total errors/warnings: $error_count"

        if [ "$error_count" -gt 0 ]; then
            echo ""
            echo "### Recent Errors (last 10):"
            grep -i "error\|exception\|fail\|fatal" "$log_file" | tail -10 | sed 's/^/  /'
        fi

        echo ""
        echo "## Log Levels Distribution"
        if grep -q "INFO" "$log_file"; then
            info_count=$(grep -c "INFO" "$log_file" || echo "0")
            echo "- INFO: $info_count"
        fi
        if grep -q "WARN" "$log_file"; then
            warn_count=$(grep -c "WARN" "$log_file" || echo "0")
            echo "- WARN: $warn_count"
        fi
        if grep -q "ERROR" "$log_file"; then
            error_count=$(grep -c "ERROR" "$log_file" || echo "0")
            echo "- ERROR: $error_count"
        fi

        echo ""
        echo "## Most Recent Entries (last 20 lines)"
        tail -20 "$log_file" | sed 's/^/  /'

    } > "$analysis_file"

    echo "✅ Analysis saved to: $analysis_file"
done

# Generate summary report
echo ""
echo "📊 Generating summary report..."
{
    echo "# Log Analysis Summary"
    echo "Generated: $(date)"
    echo ""
    echo "## Files Analyzed"
    printf '  %s\n' "${LOG_FILES[@]}"
    echo ""
    echo "## Total Statistics"
    total_lines=0
    total_errors=0

    for log_file in "${LOG_FILES[@]}"; do
        lines=$(wc -l < "$log_file")
        errors=$(grep -c -i "error\|exception\|fail\|fatal" "$log_file" 2>/dev/null || echo "0")
        total_lines=$((total_lines + lines))
        total_errors=$((total_errors + errors))
        echo "- $(basename "$log_file"): $lines lines, $errors errors"
    done

    echo ""
    echo "### Totals"
    echo "- Total lines: $total_lines"
    echo "- Total errors: $total_errors"

    if [ "$total_errors" -gt 0 ]; then
        error_rate=$(( (total_errors * 100) / total_lines ))
        echo "- Error rate: $error_rate%"
    fi

} > "log-analysis/summary.txt"

echo "✅ Log analysis complete"
echo "📊 Check log-analysis/ directory for detailed reports"
echo "📋 Summary available at: log-analysis/summary.txt"
```

## Systematic Troubleshooting Workflows

### Incident Response Procedure
```typescript
// utils/incidentResponse.ts

export interface Incident {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  title: string;
  description: string;
  impact: string;
  affectedSystems: string[];
  detectedAt: Date;
  assignedTo?: string;
  resolvedAt?: Date;
  resolution?: string;
  followUpActions: string[];
}

export class IncidentResponse {
  private incidents: Map<string, Incident> = new Map();
  private escalationRules: Map<string, string[]> = new Map();

  createIncident(incident: Omit<Incident, 'id' | 'detectedAt' | 'status'>): Incident {
    const newIncident: Incident = {
      ...incident,
      id: this.generateIncidentId(),
      detectedAt: new Date(),
      status: 'open',
      followUpActions: []
    };

    this.incidents.set(newIncident.id, newIncident);
    this.logIncidentCreated(newIncident);

    // Auto-escalate based on severity
    if (incident.severity === 'critical' || incident.severity === 'high') {
      this.escalateIncident(newIncident.id);
    }

    return newIncident;
  }

  updateIncident(id: string, updates: Partial<Incident>): Incident | null {
    const incident = this.incidents.get(id);
    if (!incident) {
      return null;
    }

    const updatedIncident = { ...incident, ...updates };
    this.incidents.set(id, updatedIncident);

    if (updates.status === 'resolved' && !updatedIncident.resolvedAt) {
      updatedIncident.resolvedAt = new Date();
    }

    this.logIncidentUpdated(updatedIncident);
    return updatedIncident;
  }

  investigateIncident(id: string, investigationSteps: string[]): Incident | null {
    const incident = this.incidents.get(id);
    if (!incident) {
      return null;
    }

    // Update status to investigating
    incident.status = 'investigating';

    // Add investigation steps to follow-up actions
    incident.followUpActions.push(...investigationSteps);

    // Log investigation start
    console.log(`🔍 Investigating incident ${id}: ${incident.title}`);

    return this.updateIncident(id, incident);
  }

  resolveIncident(id: string, resolution: string, followUpActions: string[] = []): Incident | null {
    const incident = this.incidents.get(id);
    if (!incident) {
      return null;
    }

    const updates: Partial<Incident> = {
      status: 'resolved',
      resolvedAt: new Date(),
      resolution,
      followUpActions: [...incident.followUpActions, ...followUpActions]
    };

    const resolvedIncident = this.updateIncident(id, updates);

    if (resolvedIncident) {
      console.log(`✅ Incident ${id} resolved: ${resolution}`);
      this.scheduleFollowUp(id);
    }

    return resolvedIncident;
  }

  private generateIncidentId(): string {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `INC-${timestamp}-${random}`;
  }

  private escalateIncident(id: string): void {
    const incident = this.incidents.get(id);
    if (!incident) return;

    console.log(`🚨 Escalating incident ${id}: ${incident.title}`);

    // In a real system, this would send notifications
    // For now, we'll just log the escalation
    const escalationTargets = this.escalationRules.get(incident.severity) || [];

    if (escalationTargets.length > 0) {
      console.log(`📧 Notifying escalation targets: ${escalationTargets.join(', ')}`);
    }
  }

  private scheduleFollowUp(id: string): void {
    const incident = this.incidents.get(id);
    if (!incident || !incident.resolvedAt) return;

    // Schedule follow-up in 24 hours
    const followUpTime = new Date(incident.resolvedAt.getTime() + 24 * 60 * 60 * 1000);

    console.log(`📅 Follow-up scheduled for incident ${id} at ${followUpTime.toISOString()}`);
  }

  private logIncidentCreated(incident: Incident): void {
    console.log(`🚨 Incident Created: ${incident.id} - ${incident.title} (${incident.severity})`);
    console.log(`   Impact: ${incident.impact}`);
    console.log(`   Affected Systems: ${incident.affectedSystems.join(', ')}`);
  }

  private logIncidentUpdated(incident: Incident): void {
    console.log(`📝 Incident Updated: ${incident.id} - Status: ${incident.status}`);
  }

  getActiveIncidents(): Incident[] {
    return Array.from(this.incidents.values())
      .filter(incident => incident.status !== 'closed');
  }

  getIncidentsBySeverity(severity: Incident['severity']): Incident[] {
    return Array.from(this.incidents.values())
      .filter(incident => incident.severity === severity);
  }

  generateIncidentReport(): string {
    const activeIncidents = this.getActiveIncidents();
    const totalIncidents = this.incidents.size;
    const resolvedIncidents = Array.from(this.incidents.values())
      .filter(incident => incident.status === 'resolved').length;

    return `
# Incident Response Report

**Generated**: ${new Date().toISOString()}

## Summary
- Total Incidents: ${totalIncidents}
- Active Incidents: ${activeIncidents.length}
- Resolved Incidents: ${resolvedIncidents}

## Active Incidents
${activeIncidents.length > 0
  ? activeIncidents.map(inc =>
      `### ${inc.id} - ${inc.title}
- **Severity**: ${inc.severity}
- **Status**: ${inc.status}
- **Detected**: ${inc.detectedAt.toISOString()}
- **Impact**: ${inc.impact}
- **Affected Systems**: ${inc.affectedSystems.join(', ')}
`).join('\n')
  : '- No active incidents ✅'
}

## Recent Resolutions
${Array.from(this.incidents.values())
  .filter(inc => inc.status === 'resolved' && inc.resolvedAt)
  .sort((a, b) => (b.resolvedAt?.getTime() || 0) - (a.resolvedAt?.getTime() || 0))
  .slice(0, 5)
  .map(inc =>
    `### ${inc.id} - ${inc.title}
- **Resolved**: ${inc.resolvedAt?.toISOString()}
- **Resolution**: ${inc.resolution || 'N/A'}
`).join('\n') || '- No recent resolutions'
}
    `.trim();
  }
}
```

This comprehensive Debugging & Troubleshooting skill provides systematic approaches to error analysis, performance profiling, log analysis, and incident response, making debugging workflows more efficient and thorough.