# Claude Code MCP Server Troubleshooting Guide

**Purpose**: Complete guide to diagnose and fix MCP server loading issues in Claude Code when `/mcp` shows "No MCP servers configured" or servers aren't loading.

**Last Updated**: 2025-10-17
**Version**: 1.0

---

## 🚨 Quick Diagnosis - Is This Your Issue?

Run this command to check if you have the common schema error:

```bash
# Check for invalid "user" wrapper in configuration
jq 'keys' ~/.claude.json | grep -q '"user"' && echo "❌ SCHEMA ERROR FOUND" || echo "✅ Configuration schema OK"
```

**If output shows "❌ SCHEMA ERROR FOUND"** → Use **Solution A** immediately.
**If output shows "✅ Configuration schema OK"** → Proceed to **Solution B**.

---

## 🎯 Solution A: Fix Invalid Schema (Most Common Issue)

### Problem: Invalid `user.mcpServers` Structure

**Symptoms:**
- `/mcp` shows "No MCP servers configured"
- MCP servers configured but not loading
- No error messages - silent failure

**Root Cause:** MCP servers are incorrectly nested under `user.mcpServers` instead of being at top level.

### Step-by-Step Fix

#### Step 1: Backup Current Configuration
```bash
# Create timestamped backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
cp ~/.claude.json ~/.claude.json.backup_$TIMESTAMP
echo "✅ Backup created: ~/.claude.json.backup_$TIMESTAMP"
```

#### Step 2: Extract and Fix Configuration
```bash
# Create fix script
cat > /tmp/fix_mcp_schema.sh << 'EOF'
#!/bin/bash

echo "🔧 Fixing MCP configuration schema..."

# Check if user.mcpServers exists
if jq -e '.user.mcpServers' ~/.claude.json > /dev/null 2>&1; then
    echo "📁 Found user.mcpServers - extracting to top level..."

    # Extract MCP servers configuration
    MCP_SERVERS=$(jq '.user.mcpServers' ~/.claude.json)

    # Remove user section and add mcpServers at top level
    jq --argjson mcpServers "$MCP_SERVERS" 'del(.user) | .mcpServers = $mcpServers' ~/.claude.json > /tmp/claude.json.fixed

    # Validate the new configuration
    if jq empty /tmp/claude.json.fixed 2>/dev/null; then
        mv /tmp/claude.json.fixed ~/.claude.json
        echo "✅ Configuration fixed successfully!"
        echo "✅ MCP servers moved to top level"

        # Show result
        echo "📋 MCP servers now configured:"
        jq '.mcpServers | keys[]' ~/.claude.json
    else
        echo "❌ Error: Invalid JSON produced. Restoring backup..."
        cp ~/.claude.json.backup_* ~/.claude.json
        exit 1
    fi
else
    echo "ℹ️  No user.mcpServers found - checking for other issues..."
    # Check if mcpServers exists at all
    if jq -e '.mcpServers' ~/.claude.json > /dev/null 2>&1; then
        echo "✅ mcpServers found at top level - schema is correct"
        echo "📋 Current servers:"
        jq '.mcpServers | keys[]' ~/.claude.json
    else
        echo "❌ No mcpServers found anywhere - need to add them"
    fi
fi
EOF

chmod +x /tmp/fix_mcp_schema.sh
bash /tmp/fix_mcp_schema.sh
```

#### Step 3: Verify the Fix
```bash
# Verify mcpServers is at top level
echo "🔍 Checking configuration structure:"
jq '.mcpServers | keys' ~/.claude.json

# Verify no "user" wrapper exists
echo "🔍 Checking for invalid 'user' wrapper:"
if jq 'has("user")' ~/.claude.json | grep -q true; then
    echo "❌ Still has 'user' section - fix incomplete"
else
    echo "✅ No invalid 'user' wrapper found"
fi
```

#### Step 4: Restart Claude Code
```bash
# Kill all Claude Code processes
pkill -9 -f "claude"
pkill -9 -f "node.*claude"

# Wait a moment
sleep 2

# Start fresh session
echo "🚀 Starting fresh Claude Code session..."
claude
```

#### Step 5: Test MCP Servers
Inside Claude Code, run:
```bash
/mcp
```

**Expected Output:**
```
⎿ MCP Server Status ⎿
⎿ • github: connected ⎿
⎿ • playwright: connected ⎿
⎿ • brave-search: connected ⎿
⎿ • context7: connected ⎿
⎿ • zai-mcp-server: connected ⎿
⎿ • like-i-said: connected ⎿
```

---

## 🔧 Solution B: Add Missing MCP Servers

### Problem: No mcpServers Configuration Exists

**Symptoms:**
- Fresh Claude Code installation
- Configuration file exists but no MCP servers
- Need to add new MCP servers

### Step-by-Step Setup

#### Step 1: Check Current State
```bash
# Check if mcpServers exists
if jq -e '.mcpServers' ~/.claude.json > /dev/null 2>&1; then
    echo "✅ mcpServers exists"
    jq '.mcpServers | keys[]' ~/.claude.json
else
    echo "❌ No mcpServers found - will add them"
fi
```

#### Step 2: Add Common MCP Servers
```bash
# Add essential MCP servers with correct package names
jq '.mcpServers = {
    "github": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-github"],
        "env": {
            "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_GITHUB_PAT_HERE"
        }
    },
    "playwright": {
        "command": "npx",
        "args": ["-y", "@playwright/mcp"]
    },
    "brave-search": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-brave-search"],
        "env": {
            "BRAVE_API_KEY": "YOUR_BRAVE_API_KEY_HERE"
        }
    },
    "context7": {
        "command": "npx",
        "args": ["-y", "context7-mcp-server"]
    },
    "zai-mcp-server": {
        "command": "npx",
        "args": ["-y", "zai-mcp-server"]
    },
    "like-i-said": {
        "command": "node",
        "args": ["/mnt/d/APPSNospaces/like-i-said-mcp/server-unified.js"],
        "env": {
            "MCP_MODE": "full",
            "MCP_QUIET": "true"
        }
    }
}' ~/.claude.json > /tmp/claude_with_mcp.json && mv /tmp/claude_with_mcp.json ~/.claude.json

echo "✅ MCP servers added to configuration"
```

#### Step 3: Replace API Keys
Edit `~/.claude.json` and replace the placeholder values:
- `YOUR_GITHUB_PAT_HERE` → Your GitHub Personal Access Token
- `YOUR_BRAVE_API_KEY_HERE` → Your Brave Search API Key
- `YOUR_ANTHROPIC_API_KEY_HERE` → Your Anthropic API Key

#### Step 4: Verify and Restart
```bash
# Verify configuration
jq '.mcpServers | keys[]' ~/.claude.json

# Restart Claude Code
pkill -9 -f claude && sleep 2 && claude
```

---

## 📋 MCP Server Templates

### NPM Package Pattern (Most Common)
```json
{
  "server-name": {
    "command": "npx",
    "args": ["-y", "@organization/server-package"],
    "env": {
      "API_KEY": "your-api-key-here"
    }
  }
}
```

### Direct Binary Pattern
```json
{
  "server-name": {
    "command": "/usr/local/bin/mcp-server",
    "args": ["--flag", "value"]
  }
}
```

### Add Single Server Using JQ
```bash
# Template for adding a new server
SERVER_NAME="new-server"
SERVER_CONFIG='{
  "command": "npx",
  "args": ["-y", "new-mcp-package"],
  "env": {"API_KEY": "your-key"}
}'

jq --argjson config "$SERVER_CONFIG" --arg name "$SERVER_NAME" \
   '.mcpServers[$name] = $config' ~/.claude.json > /tmp/claude_temp.json && \
mv /tmp/claude_temp.json ~/.claude.json
```

---

## 🔍 Advanced Troubleshooting

### Check for Duplicate mcpServers Sections
```bash
# Count mcpServers occurrences (should be exactly 1)
COUNT=$(grep -c '"mcpServers"' ~/.claude.json)
if [ "$COUNT" -gt 1 ]; then
    echo "⚠️  Found $COUNT mcpServers sections - this causes conflicts"
    echo "Use jq to consolidate them into one section"
else
    echo "✅ Found exactly 1 mcpServers section"
fi
```

### Enable MCP Debug Mode
```bash
# Start Claude Code with debug logging
claude --mcp-debug
```

### Test Individual MCP Servers
```bash
# Test a specific MCP server directly
echo '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}' | \
npx -y @modelcontextprotocol/server-github

# Should return JSON-RPC response, not hang or error
```

### Common Package Name Issues

**Problem**: Some MCP servers have incorrect or outdated package names in documentation.

**Common Fixes**:
- `@modelcontextprotocol/server-playwright` → `@playwright/mcp`
- `like-i-said` → Use local path: `node /path/to/server-unified.js`
- Always verify package exists: `npm search package-name`

**Test Package Names**:
```bash
# Check if package exists
npm search @playwright/mcp
npm install -g @playwright/mcp  # Test installation
```

### Check NPX and Node.js
```bash
# Verify npx is accessible
which npx
npx --version

# Verify Node.js
node --version

# If npx not found, add to PATH
export PATH="$HOME/.nvm/versions/node/v22.18.0/bin:$PATH"
echo 'export PATH="$HOME/.nvm/versions/node/v22.18.0/bin:$PATH"' >> ~/.bashrc
```

### Validate JSON Configuration
```bash
# Check for JSON syntax errors
if jq empty ~/.claude.json 2>/dev/null; then
    echo "✅ JSON syntax is valid"
else
    echo "❌ JSON syntax error - fix with:"
    jq . ~/.claude.json > /tmp/claude_fixed.json && mv /tmp/claude_fixed.json ~/.claude.json
fi
```

---

## 📊 Configuration Hierarchy (Important!)

Claude Code uses this exact precedence for MCP servers:

1. **Local scope** (highest priority): Temporary, session-only
   - Added via: `claude mcp add --scope local`

2. **Project scope**: Shared with team via version control
   - Stored in: `.mcp.json` in project root
   - Requires: `enableAllProjectMcpServers: true` in settings

3. **User scope** (lowest priority): Available across all your projects
   - Stored in: `~/.claude.json` under top-level `mcpServers` ← **THIS IS WHAT WE WANT**

**Key Point**: User-scope servers (top-level `mcpServers`) work globally across all projects.

---

## 🚨 Common Mistakes to Avoid

### ❌ Incorrect Schema (Silent Failure)
```json
{
  "user": {
    "mcpServers": {...}  // WRONG - silently ignored
  }
}
```

### ✅ Correct Schema
```json
{
  "mcpServers": {...}  // CORRECT - recognized
}
```

### ❌ Duplicate Sections
```json
{
  "mcpServers": {...},
  "projects": {
    "some-project": {
      "mcpServers": {...}  // Can cause conflicts
    }
  }
}
```

### ❌ Missing Command/Args
```json
{
  "mcpServers": {
    "broken-server": {
      // Missing command/args - will fail to start
    }
  }
}
```

---

## ✅ Verification Checklist

After any MCP configuration changes, run this checklist:

```bash
#!/bin/bash
echo "🔍 MCP Configuration Verification Checklist"
echo "=========================================="

# 1. JSON Syntax Check
echo "1. Checking JSON syntax..."
if jq empty ~/.claude.json 2>/dev/null; then
    echo "   ✅ JSON syntax valid"
else
    echo "   ❌ JSON syntax error"
    exit 1
fi

# 2. Schema Check
echo "2. Checking configuration schema..."
if jq 'has("user")' ~/.claude.json | grep -q true; then
    echo "   ❌ Invalid 'user' wrapper found"
    exit 1
else
    echo "   ✅ No invalid 'user' wrapper"
fi

# 3. mcpServers Existence Check
echo "3. Checking for mcpServers..."
if jq -e '.mcpServers' ~/.claude.json > /dev/null 2>&1; then
    echo "   ✅ mcpServers found at top level"
    echo "   📋 Configured servers:"
    jq '.mcpServers | keys[]' ~/.claude.json | sed 's/^/      - /'
else
    echo "   ❌ No mcpServers found"
    exit 1
fi

# 4. Duplicate Section Check
echo "4. Checking for duplicate mcpServers sections..."
COUNT=$(grep -c '"mcpServers"' ~/.claude.json)
if [ "$COUNT" -eq 1 ]; then
    echo "   ✅ Exactly 1 mcpServers section found"
else
    echo "   ⚠️  Found $COUNT mcpServers sections (may cause conflicts)"
fi

# 5. NPX Accessibility Check
echo "5. Checking npx accessibility..."
if command -v npx >/dev/null 2>&1; then
    echo "   ✅ npx is accessible: $(which npx)"
else
    echo "   ❌ npx not found - MCP servers using npx will fail"
fi

echo "=========================================="
echo "✅ Verification complete! Restart Claude Code to test."
```

---

## 🆘 Emergency Recovery

If everything goes wrong, restore from backup:

```bash
# List available backups
ls -la ~/.claude.json.backup_*

# Restore most recent backup
LATEST_BACKUP=$(ls -t ~/.claude.json.backup_* | head -1)
cp "$LATEST_BACKUP" ~/.claude.json
echo "✅ Restored from: $LATEST_BACKUP"

# Restart Claude Code
pkill -9 -f claude && sleep 2 && claude
```

---

## 📚 References

- [Claude Code MCP Documentation](https://docs.claude.com/en/docs/claude-code/mcp)
- [Configuration Schema Reference](https://github.com/anthropics/claude-code/issues/4109)
- [MCP Server Registry](https://mcpcat.io/)
- [Troubleshooting Guide](https://docs.claude.com/en/docs/claude-code/troubleshooting)

---

## 🎯 Quick Fix Summary

**For 90% of MCP issues, run this single command:**

```bash
# One-line fix for most common schema error
jq 'if has("user") then (.user.mcpServers // {}) as $servers | del(.user) | .mcpServers = $servers else . end' ~/.claude.json > /tmp/claude_fixed.json && mv /tmp/claude_fixed.json ~/.claude.json && pkill -9 -f claude && sleep 2 && claude
```

**Then test with:**
```bash
/mcp
```

This guide covers the most common MCP configuration issues and their solutions. Save this file for future reference!