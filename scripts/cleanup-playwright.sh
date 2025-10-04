#!/bin/bash
# Playwright MCP Cleanup Script
# Removes all locks and processes to fix "Browser is already in use" error

echo "Starting Playwright MCP cleanup..."

# Kill any Chrome processes started by Playwright
echo "Terminating Chrome processes..."
pkill -f "chrome.*--remote-debugging-pipe" 2>/dev/null
pkill -f "chrome.*--user-data-dir.*mcp-chrome" 2>/dev/null
pkill -f "chromium.*--remote-debugging" 2>/dev/null

# Wait for processes to fully terminate
sleep 2

# Remove all Playwright MCP cache and lock files
echo "Removing cache and lock files..."
rm -rf ~/.cache/ms-playwright/mcp-chrome-* 2>/dev/null
rm -rf ~/.cache/ms-playwright/mcp-* 2>/dev/null
rm -rf /tmp/playwright_* 2>/dev/null
rm -rf /tmp/.com.google.Chrome.* 2>/dev/null
rm -rf /tmp/.org.chromium.* 2>/dev/null

# Clear any WSL2-specific temporary files
rm -rf /tmp/chrome-* 2>/dev/null

echo "✅ Playwright cleanup completed successfully!"
echo "Safe to restart Claude Desktop and use Playwright MCP."