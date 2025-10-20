#!/bin/bash
# SweatBot Render Deployment Helper
# Purpose: Automate deployment verification and monitoring
# Usage: ./deploy.sh

set -e  # Exit on error

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVICE_NAME="${1:-sweatbot-api}"
RENDER_API_KEY="${RENDER_API_KEY:-}"

echo -e "${BLUE}🚀 SweatBot Render Deployment Helper${NC}"
echo "Service: $SERVICE_NAME"
echo ""

# Function: Check if service URL is provided
check_service_url() {
    if [ -z "$RENDER_API_KEY" ]; then
        echo -e "${YELLOW}⚠️  RENDER_API_KEY not set${NC}"
        echo "Set with: export RENDER_API_KEY=your-api-key"
        echo ""
        echo "To get API key:"
        echo "1. Go to https://dashboard.render.com/account/api-tokens"
        echo "2. Create new token"
        echo "3. Copy token"
        echo "4. export RENDER_API_KEY=<token>"
    fi
}

# Function: Verify deployment
verify_deployment() {
    echo -e "${BLUE}📊 Checking deployment status...${NC}"
    echo ""
    
    # Get service info from GitHub/environment
    SERVICE_URL="${SERVICE_URL:-https://${SERVICE_NAME}.onrender.com}"
    
    echo "Service URL: $SERVICE_URL"
    echo ""
    
    # Test health endpoint
    echo -e "${YELLOW}Testing health endpoint...${NC}"
    if response=$(curl -s -w "\n%{http_code}" "$SERVICE_URL/health" 2>/dev/null); then
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | head -n-1)
        
        if [ "$http_code" = "200" ]; then
            echo -e "${GREEN}✅ Health check passed (HTTP 200)${NC}"
            echo "Response: $body"
        else
            echo -e "${RED}❌ Health check failed (HTTP $http_code)${NC}"
            echo "Response: $body"
            return 1
        fi
    else
        echo -e "${RED}❌ Failed to reach service${NC}"
        echo "Make sure:"
        echo "1. Service is deployed"
        echo "2. URL is correct: $SERVICE_URL"
        echo "3. You have internet connection"
        return 1
    fi
    
    echo ""
    
    # Test database connection
    echo -e "${YELLOW}Testing database connection...${NC}"
    if response=$(curl -s -w "\n%{http_code}" "$SERVICE_URL/api/db-check" 2>/dev/null); then
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | head -n-1)
        
        if [ "$http_code" = "200" ]; then
            echo -e "${GREEN}✅ Database connected${NC}"
            echo "Response: $body"
        else
            echo -e "${YELLOW}⚠️  Database check returned $http_code${NC}"
            echo "Response: $body"
        fi
    else
        echo -e "${YELLOW}⚠️  Could not reach database check endpoint${NC}"
    fi
    
    echo ""
}

# Function: Display deployment info
show_deployment_info() {
    echo -e "${BLUE}📋 Deployment Information${NC}"
    echo ""
    echo "Service Name: $SERVICE_NAME"
    echo "Service URL: https://${SERVICE_NAME}.onrender.com"
    echo "Dashboard: https://dashboard.render.com"
    echo ""
    echo "Quick Links:"
    echo "- Service Logs: https://dashboard.render.com/services"
    echo "- PostgreSQL: https://dashboard.render.com/databases"
    echo "- Environment: https://dashboard.render.com/services/${SERVICE_NAME}/environment"
    echo ""
}

# Function: Show test commands
show_test_commands() {
    echo -e "${BLUE}🧪 Manual Test Commands${NC}"
    echo ""
    echo "Health check:"
    echo "  curl https://${SERVICE_NAME}.onrender.com/health"
    echo ""
    echo "Database check:"
    echo "  curl https://${SERVICE_NAME}.onrender.com/api/db-check"
    echo ""
    echo "API status:"
    echo "  curl https://${SERVICE_NAME}.onrender.com/api/status"
    echo ""
    echo "WebSocket test (in browser console):"
    echo "  ws = new WebSocket('wss://${SERVICE_NAME}.onrender.com/ws');"
    echo "  ws.onopen = () => console.log('Connected!');"
    echo ""
}

# Main execution
main() {
    check_service_url
    echo ""
    
    if verify_deployment; then
        echo -e "${GREEN}✅ Deployment verified successfully!${NC}"
    else
        echo -e "${RED}❌ Deployment verification failed${NC}"
        echo ""
        echo "Next steps:"
        echo "1. Check Render dashboard for error logs"
        echo "2. Review [TROUBLESHOOTING.md](.claude/skills/TROUBLESHOOTING.md)"
        echo "3. Verify environment variables are set"
        exit 1
    fi
    
    echo ""
    show_deployment_info
    show_test_commands
}

main "$@"
