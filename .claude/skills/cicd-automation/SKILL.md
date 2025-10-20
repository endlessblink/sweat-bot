---
name: CI/CD Automation
description: Complete CI/CD pipeline automation with GitHub Actions, testing, security scanning, and deployment. Use when setting up automated build/test/deploy pipelines or optimizing development workflows.
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
---

# CI/CD Automation

## Overview

Technical skill for implementing comprehensive CI/CD pipelines including automated testing, security scanning, containerization, and multi-environment deployments using GitHub Actions and modern DevOps practices.

## When to Use

- Setting up automated build and test pipelines
- Implementing continuous deployment workflows
- Adding security scanning and code quality checks
- Creating multi-environment deployment strategies
- Optimizing development and release workflows

## Technical Capabilities

1. **GitHub Actions Workflows**: Automated CI/CD pipeline implementation
2. **Container Orchestration**: Docker build, test, and deployment automation
3. **Security Scanning**: Automated vulnerability and dependency scanning
4. **Quality Gates**: Code quality, test coverage, and performance thresholds
5. **Multi-Environment Deployments**: Staging, production, and feature branch deployments

## GitHub Actions Workflow Templates

### Main CI/CD Pipeline
```yaml
# .github/workflows/ci-cd.yml

name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production
      force_deploy:
        description: 'Force deployment (skip tests)'
        required: false
        default: false
        type: boolean

env:
  NODE_VERSION: '18'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # Code Quality and Security
  code-quality:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: ESLint
        run: npm run lint

      - name: Prettier check
        run: npm run format:check

      - name: TypeScript check
        run: npm run type-check

      - name: Security audit
        run: npm audit --audit-level moderate

      - name: Dependency check
        run: npx audit-ci --moderate

  # Unit Tests
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unittests

  # Integration Tests
  integration-tests:
    runs-on: ubuntu-latest
    needs: [code-quality]
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run database migrations
        run: npm run migrate:test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testdb
          REDIS_URL: redis://localhost:6379

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testdb
          REDIS_URL: redis://localhost:6379

      - name: Upload integration test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: integration-test-results
          path: test-results/

  # Build and Push Docker Image
  build-and-push:
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests]
    if: github.event_name == 'push' || github.event_name == 'workflow_dispatch'
    outputs:
      image-digest: ${{ steps.build.outputs.digest }}
      image-tag: ${{ steps.meta.outputs.tags }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push Docker image
        id: build
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          provenance: false

  # E2E Tests
  e2e-tests:
    runs-on: ubuntu-latest
    needs: [build-and-push]
    if: github.event_name == 'push' || github.event_name == 'workflow_dispatch'
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Start services with Docker Compose
        run: |
          docker compose -f docker-compose.test.yml up -d
          timeout 60 bash -c 'until curl -s http://localhost:8000/health > /dev/null; do sleep 2; done'

      - name: Wait for services to be ready
        run: |
          echo "Waiting for services..."
          sleep 30

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          TEST_BASE_URL: http://localhost:8000

      - name: Upload E2E test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: e2e-test-results
          path: playwright-report/

      - name: Upload E2E test screenshots
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: e2e-screenshots
          path: test-results/screenshots/

      - name: Cleanup services
        if: always()
        run: docker compose -f docker-compose.test.yml down

  # Security Scanning
  security-scan:
    runs-on: ubuntu-latest
    needs: [build-and-push]
    steps:
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ needs.build-and-push.outputs.image-tag }}
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        if: always()
        with:
          sarif_file: 'trivy-results.sarif'

  # Deploy to Staging
  deploy-staging:
    runs-on: ubuntu-latest
    needs: [e2e-tests, security-scan]
    if: github.ref == 'refs/heads/develop' && github.event_name == 'push'
    environment:
      name: staging
      url: https://sweatbot-staging.onrender.com
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to Render
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.RENDER_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"serviceId": "${{ secrets.RENDER_SERVICE_ID_STAGING }}", "clearCache": true}' \
            https://api.render.com/v1/services/${{ secrets.RENDER_SERVICE_ID_STAGING }}/deploys

      - name: Wait for deployment
        run: |
          echo "Waiting for deployment to complete..."
          timeout 300 bash -c 'until curl -s https://sweatbot-staging.onrender.com/health | grep -q "healthy"; do sleep 10; done'

      - name: Run smoke tests
        run: |
          npm run test:smoke -- --base-url=https://sweatbot-staging.onrender.com

  # Deploy to Production
  deploy-production:
    runs-on: ubuntu-latest
    needs: [e2e-tests, security-scan]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment:
      name: production
      url: https://sweatbot.onrender.com
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to Render
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.RENDER_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"serviceId": "${{ secrets.RENDER_SERVICE_ID_PRODUCTION }}", "clearCache": true}' \
            https://api.render.com/v1/services/${{ secrets.RENDER_SERVICE_ID_PRODUCTION }}/deploys

      - name: Wait for deployment
        run: |
          echo "Waiting for deployment to complete..."
          timeout 300 bash -c 'until curl -s https://sweatbot.onrender.com/health | grep -q "healthy"; do sleep 10; done'

      - name: Run production smoke tests
        run: |
          npm run test:smoke -- --base-url=https://sweatbot.onrender.com

      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        if: always()
```

### Feature Branch Workflow
```yaml
# .github/workflows/feature-branch.yml

name: Feature Branch Preview

on:
  pull_request:
    types: [opened, synchronize, reopened]
    branches: [main, develop]

jobs:
  preview-deploy:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    permissions:
      pull-requests: write
      contents: read

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Generate preview URL
        id: preview
        run: |
          BRANCH_NAME=$(echo ${{ github.head_ref }} | sed 's/[^a-zA-Z0-9-]/-/g' | tr '[:upper:]' '[:lower:]')
          PREVIEW_URL="https://sweatbot-${BRANCH_NAME}.onrender.com"
          echo "preview_url=$PREVIEW_URL" >> $GITHUB_OUTPUT
          echo "branch_name=$BRANCH_NAME" >> $GITHUB_OUTPUT

      - name: Comment PR with preview URL
        uses: actions/github-script@v6
        with:
          script: |
            const previewUrl = `${{ steps.preview.outputs.preview_url }}`;
            const comment = `
            🚀 **Preview Environment Ready!**

            Preview URL: ${previewUrl}

            This environment will be automatically updated when new commits are pushed to this branch.
            `;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });

      - name: Deploy preview to Render
        run: |
          # Create temporary service for preview
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.RENDER_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{
              "serviceId": "${{ secrets.RENDER_TEMPLATE_ID }}",
              "name": "sweatbot-preview-${{ steps.preview.outputs.branch_name }}",
              "autoDeploy": "yes"
            }' \
            https://api.render.com/v1/services
```

## Docker Configuration

### Multi-Stage Dockerfile
```dockerfile
# Dockerfile

# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Health check
COPY --from=builder --chown=nodejs:nodejs /app/scripts/health-check.js ./scripts/

# Set permissions
RUN chmod +x scripts/health-check.js

# Expose port
EXPOSE 3000

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node scripts/health-check.js

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
```

### Docker Compose for Testing
```yaml
# docker-compose.test.yml

version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: builder
    environment:
      NODE_ENV: test
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/testdb
      REDIS_URL: redis://redis:6379
      JWT_SECRET: test-secret
    ports:
      - "8000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./test-results:/app/test-results
    command: npm run test:watch

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: testdb
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-test-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  mongodb:
    image: mongo:6
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: admin
      MONGO_INITDB_DATABASE: testdb
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    healthcheck:
      test: ["CMD", "mongo", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  mongodb_data:
```

## Security Scanning Scripts

### Dependency Security Scan
```bash
#!/bin/bash
# scripts/security-scan.sh

set -e

echo "🔒 Running Security Scans..."

# npm audit
echo "📦 Checking npm dependencies..."
npm audit --audit-level moderate

# Snyk vulnerability scan
if command -v snyk &> /dev/null; then
  echo "🛡️ Running Snyk vulnerability scan..."
  snyk test --severity-threshold=medium
fi

# OWASP dependency check
if command -v dependency-check &> /dev/null; then
  echo "🔍 Running OWASP dependency check..."
  dependency-check --project sweatbot --scanAllProjects
fi

# Container security scan
if command -v trivy &> /dev/null; then
  echo "🐳 Scanning Docker image..."
  trivy image sweatbot:latest
fi

echo "✅ Security scans completed!"
```

### Code Quality Gate
```bash
#!/bin/bash
# scripts/quality-gate.sh

set -e

echo "📊 Running Quality Gates..."

# Test coverage threshold
COVERAGE_THRESHOLD=80

echo "📈 Checking test coverage..."
COVERAGE=$(npm run test:coverage:report | grep -o '[0-9]*\.[0-9]*%' | head -1 | tr -d '%')

if (( $(echo "$COVERAGE < $COVERAGE_THRESHOLD" | bc -l) )); then
  echo "❌ Test coverage ($COVERAGE%) is below threshold ($COVERAGE_THRESHOLD%)"
  exit 1
fi

echo "✅ Test coverage ($COVERAGE%) meets threshold ($COVERAGE_THRESHOLD%)"

# Performance benchmarks
echo "⚡ Running performance benchmarks..."
npm run test:performance

# Bundle size analysis
echo "📦 Analyzing bundle size..."
npm run analyze:bundle

echo "✅ Quality gates passed!"
```

## Deployment Scripts

### Multi-Environment Deployment
```bash
#!/bin/bash
# scripts/deploy.sh

set -e

ENVIRONMENT=${1:-staging}
FORCE_DEPLOY=${2:-false}

echo "🚀 Deploying to $ENVIRONMENT environment..."

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(staging|production|preview)$ ]]; then
  echo "❌ Invalid environment. Use: staging, production, or preview"
  exit 1
fi

# Pre-deployment checks
echo "🔍 Running pre-deployment checks..."
npm run test:smoke

# Build application
echo "🔨 Building application..."
npm run build

# Deploy based on environment
case $ENVIRONMENT in
  "staging")
    echo "📋 Deploying to staging..."
    curl -X POST \
      -H "Authorization: Bearer $RENDER_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{"serviceId": "'"$STAGING_SERVICE_ID"'", "clearCache": true}' \
      https://api.render.com/v1/services/$STAGING_SERVICE_ID/deploys
    ;;

  "production")
    echo "📋 Deploying to production..."
    if [[ "$FORCE_DEPLOY" != "true" ]]; then
      read -p "⚠️  You're about to deploy to PRODUCTION. Are you sure? (yes/no): " confirm
      if [[ "$confirm" != "yes" ]]; then
        echo "❌ Deployment cancelled"
        exit 1
      fi
    fi

    curl -X POST \
      -H "Authorization: Bearer $RENDER_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{"serviceId": "'"$PRODUCTION_SERVICE_ID"'", "clearCache": true}' \
      https://api.render.com/v1/services/$PRODUCTION_SERVICE_ID/deploys
    ;;

  "preview")
    echo "📋 Deploying preview environment..."
    # Preview deployment logic here
    ;;
esac

echo "✅ Deployment initiated!"
```

## Release Automation

### Semantic Release Configuration
```json
// .releaserc.json

{
  "branches": [
    "main",
    {
      "name": "develop",
      "prerelease": "beta"
    }
  ],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/npm",
    "@semantic-release/github",
    "@semantic-release/docker"
  ],
  "docker": {
    "imageName": "ghcr.io/${GITHUB_REPOSITORY}",
    "registry": "ghcr.io"
  }
}
```

### Release Workflow
```yaml
# .github/workflows/release.yml

name: Release

on:
  push:
    branches:
      - main

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Release
        run: npx semantic-release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

This comprehensive CI/CD automation skill provides complete pipeline automation including testing, security scanning, containerization, and multi-environment deployments.
