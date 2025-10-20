---
name: Render Deployment Automation
description: Automates deployment to Render.com with health checks, rollback capabilities, and environment management. Use when deploying applications to Render or troubleshooting deployment issues.
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

# Render Deployment Automation

## Overview

Technical skill for automating deployments to Render.com, including service creation, health checks, rollback procedures, and environment variable management.

## When to Use

- Setting up new Render services
- Deploying application updates
- Troubleshooting deployment failures
- Managing environment variables and secrets
- Implementing CI/CD pipelines with Render

## Technical Capabilities

1. **Service Creation**: Automated setup of web services, databases, and background workers
2. **render.yaml Management**: Generation and validation of Render configuration files
3. **Health Check Implementation**: Custom endpoints and monitoring setup
4. **Rollback Automation**: Automatic and manual rollback procedures
5. **Environment Management**: Secure handling of secrets and configuration

## Deployment Templates

### Node.js Backend Service
```yaml
services:
  - type: web
    name: sweatbot-api
    env: node
    runtime: node-18
    plan: free
    buildCommand: "npm ci && npm run build"
    startCommand: "npm start"
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
```

### PostgreSQL Database
```yaml
databases:
  - name: sweatbot-db
    plan: free
    databaseName: sweatbot
    user: sweatbot_user
    ipAllowList: []
```

### Static Frontend Site
```yaml
services:
  - type: web
    name: sweatbot-frontend
    env: static
    plan: free
    buildCommand: "npm run build"
    publishPath: dist
    envVars:
      - key: VITE_API_URL
        value: https://sweatbot-api.onrender.com
```

## Health Check Implementation

### Backend Health Endpoint
```javascript
// health.js
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version,
    checks: {
      database: 'unknown',
      redis: 'unknown',
      memory: 'unknown'
    }
  };

  try {
    // Database health check
    await db.query('SELECT 1');
    health.checks.database = 'ok';
  } catch (error) {
    health.checks.database = 'error';
    health.status = 'degraded';
  }

  // Memory check
  const memUsage = process.memoryUsage();
  health.checks.memory = memUsage.heapUsed / 1024 / 1024 + 'MB';

  res.status(health.status === 'ok' ? 200 : 503).json(health);
});
```

### Frontend Health Check
```javascript
// static-health.js
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'frontend',
    buildTime: process.env.BUILD_TIME,
    version: process.env.VITE_APP_VERSION
  });
});
```

## Environment Variable Management

### Secure Configuration Template
```bash
# .env.template
DATABASE_URL=${DATABASE_URL}
REDIS_URL=${REDIS_URL}
SECRET_KEY=${SECRET_KEY}
NODE_ENV=production
PORT=10000
LOG_LEVEL=info

# Third-party services
OPENAI_API_KEY=${OPENAI_API_KEY}
GROQ_API_KEY=${GROQ_API_KEY}

# Render-specific
RENDER_SERVICE_URL=${RENDER_SERVICE_URL}
RENDER_EXTERNAL_URL=${RENDER_EXTERNAL_URL}
```

### Doppler Integration Script
```bash
#!/bin/bash
# deploy-with-doppler.sh

# Load Doppler secrets
eval $(doppler run -- print-env | grep -v '^#')

# Deploy to Render
render-cli deploy \
  --service-id $RENDER_SERVICE_ID \
  --env-var "DOPPLER_SERVICE_TOKEN=$DOPPLER_SERVICE_TOKEN" \
  --env-var "DOPPLER_PROJECT=$DOPPLER_PROJECT" \
  --env-var "DOPPLER_CONFIG=$DOPPLER_CONFIG"
```

## Automated Deployment Script

### Full Deployment Automation
```python
#!/usr/bin/env python3
# deploy.py

import os
import sys
import json
import requests
import subprocess
from pathlib import Path

class RenderDeployment:
    def __init__(self, api_key=None):
        self.api_key = api_key or os.getenv('RENDER_API_KEY')
        self.base_url = "https://api.render.com/v1"
        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }

    def create_service(self, service_config):
        """Create a new Render service"""
        response = requests.post(
            f"{self.base_url}/services",
            headers=self.headers,
            json=service_config
        )
        return response.json()

    def deploy_service(self, service_id, commit_sha=None):
        """Trigger deployment for a service"""
        data = {}
        if commit_sha:
            data['commitSha'] = commit_sha

        response = requests.post(
            f"{self.base_url}/services/{service_id}/deploys",
            headers=self.headers,
            json=data
        )
        return response.json()

    def get_deployment_status(self, service_id, deploy_id):
        """Check deployment status"""
        response = requests.get(
            f"{self.base_url}/services/{service_id}/deploys/{deploy_id}",
            headers=self.headers
        )
        return response.json()

    def wait_for_deployment(self, service_id, deploy_id, timeout=300):
        """Wait for deployment to complete"""
        import time
        start_time = time.time()

        while time.time() - start_time < timeout:
            status = self.get_deployment_status(service_id, deploy_id)

            if status['status'] == 'live':
                return True, status
            elif status['status'] == 'failed':
                return False, status

            time.sleep(10)

        return False, {'error': 'Deployment timeout'}

    def rollback(self, service_id, previous_deploy_id):
        """Rollback to previous deployment"""
        response = requests.post(
            f"{self.base_url}/services/{service_id}/deploys/{previous_deploy_id}/restart",
            headers=self.headers
        )
        return response.json()

    def health_check(self, service_url, timeout=60):
        """Perform health check on deployed service"""
        import time
        start_time = time.time()

        while time.time() - start_time < timeout:
            try:
                response = requests.get(f"{service_url}/health", timeout=10)
                if response.status_code == 200:
                    return True, response.json()
            except requests.RequestException:
                pass

            time.sleep(5)

        return False, {'error': 'Health check failed'}

def main():
    if len(sys.argv) < 2:
        print("Usage: python deploy.py [deploy|rollback|health|status] [service_id]")
        sys.exit(1)

    action = sys.argv[1]
    service_id = sys.argv[2] if len(sys.argv) > 2 else None

    deployer = RenderDeployment()

    if action == 'deploy' and service_id:
        result = deployer.deploy_service(service_id)
        print(f"Deployment triggered: {result}")

    elif action == 'health' and service_id:
        service_url = f"https://{service_id}.onrender.com"
        healthy, data = deployer.health_check(service_url)
        print(f"Health check: {'✅ PASS' if healthy else '❌ FAIL'}")
        if healthy:
            print(json.dumps(data, indent=2))

    else:
        print("Invalid action or missing service_id")

if __name__ == "__main__":
    main()
```

## render.yaml Generator

### Automatic Configuration Generation
```python
#!/usr/bin/env python3
# generate-render-config.py

import yaml
from pathlib import Path

def generate_render_config(project_type, config_overrides={}):
    """Generate render.yaml configuration"""

    base_config = {
        'services': [],
        'databases': []
    }

    if project_type == 'nodejs-backend':
        base_config['services'].append({
            'type': 'web',
            'name': 'api',
            'env': 'node',
            'runtime': 'node-18',
            'plan': 'free',
            'buildCommand': 'npm ci && npm run build',
            'startCommand': 'npm start',
            'healthCheckPath': '/health',
            'envVars': [
                {'key': 'NODE_ENV', 'value': 'production'},
                {'key': 'PORT', 'value': 10000}
            ]
        })

    elif project_type == 'react-frontend':
        base_config['services'].append({
            'type': 'web',
            'name': 'frontend',
            'env': 'static',
            'plan': 'free',
            'buildCommand': 'npm ci && npm run build',
            'publishPath': 'dist'
        })

    # Apply overrides
    for key, value in config_overrides.items():
        if '.' in key:
            # Handle nested keys like 'services.0.buildCommand'
            keys = key.split('.')
            current = base_config
            for k in keys[:-1]:
                if k.isdigit():
                    current = current[int(k)]
                else:
                    current = current[k]
            current[keys[-1]] = value

    return base_config

def save_render_config(config, filepath='render.yaml'):
    """Save configuration to render.yaml"""
    with open(filepath, 'w') as f:
        yaml.dump(config, f, default_flow_style=False, indent=2)

# Usage example
if __name__ == "__main__":
    config = generate_render_config('nodejs-backend', {
        'services.0.name': 'sweatbot-api',
        'services.0.plan': 'starter',
        'databases': [{
            'name': 'sweatbot-db',
            'plan': 'free',
            'databaseName': 'sweatbot',
            'user': 'sweatbot_user'
        }]
    })

    save_render_config(config)
    print("render.yaml generated successfully!")
```

## CI/CD Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy-render.yml
name: Deploy to Render

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build application
        run: npm run build

      - name: Deploy to Render
        env:
          RENDER_API_KEY: ${{ secrets.RENDER_API_KEY }}
        run: |
          python scripts/deploy.py deploy ${{ secrets.RENDER_SERVICE_ID }}

      - name: Health Check
        run: |
          python scripts/deploy.py health ${{ secrets.RENDER_SERVICE_ID }}
```

## Troubleshooting Templates

### Common Issues and Solutions

#### Build Failures
```bash
# Check build logs
render-cli logs $SERVICE_ID --build

# Common fixes
npm ci --prefer-offline --no-audit
npm run build --verbose
```

#### Database Connection Issues
```bash
# Test database connection
curl "https://$SERVICE_ID.onrender.com/health"

# Check environment variables
render-cli env $SERVICE_ID
```

#### Memory Issues
```yaml
# Add memory limits to render.yaml
services:
  - type: web
    disk:
      name: data
      sizeGB: 1
      mountPath: /opt/render/project/data
```

## Performance Optimization

### Build Optimization
```dockerfile
# Dockerfile for optimized builds
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
CMD ["npm", "start"]
```

### Start-up Optimization
```javascript
// server.js - optimized startup
const fastify = require('fastify');

const server = fastify({
  logger: process.env.NODE_ENV === 'production'
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await server.close();
  process.exit(0);
});

// Health check before ready
server.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

const start = async () => {
  try {
    await server.listen({
      port: process.env.PORT || 3000,
      host: '0.0.0.0'
    });
    console.log('Server listening');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
```

## Monitoring and Alerts

### Custom Monitoring Script
```python
#!/usr/bin/env python3
# monitor-render.py

import requests
import time
import json
from datetime import datetime

def monitor_service(service_url, webhook_url=None):
    """Monitor service health and send alerts"""

    while True:
        try:
            response = requests.get(f"{service_url}/health", timeout=30)

            if response.status_code == 200:
                data = response.json()
                status = "✅ Healthy"
            else:
                status = f"❌ HTTP {response.status_code}"

        except Exception as e:
            status = f"❌ Error: {str(e)}"

        print(f"{datetime.now().isoformat()} - {status}")

        # Send webhook alert if configured
        if webhook_url and "❌" in status:
            requests.post(webhook_url, json={
                "service": service_url,
                "status": status,
                "timestamp": datetime.now().isoformat()
            })

        time.sleep(60)  # Check every minute

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python monitor.py <service_url> [webhook_url]")
        sys.exit(1)

    monitor_service(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
```

This technical skill provides everything needed to automate deployments to Render.com, including configuration generation, health checks, rollback procedures, and monitoring.