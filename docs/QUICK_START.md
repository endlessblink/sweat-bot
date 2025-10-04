# SweatBot Quick Start

## 🚀 One Command Setup

```bash
./start-sweatbot.sh
```

## 📋 Quick Commands

| Need | Command | Time |
|------|---------|------|
| **Quick Test** | `./start-sweatbot.sh --mode=minimal` | 2 min |
| **Full Features** | `./start-sweatbot.sh --mode=standard` | 5 min |
| **Everything** | `./start-sweatbot.sh --mode=full` | 10 min |
| **UI Only** | `./start-sweatbot.sh --frontend-only` | 1 min |

## 🎯 Access Points

After startup:
- **Web UI**: http://localhost:8004
- **API**: http://localhost:8001
- **Health**: http://localhost:8001/health

## ❓ Quick Test

```bash
curl -X POST http://localhost:8001/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"How many points do I have?"}'
```

## 🐛 Troubleshooting

```bash
# Debug mode
./start-sweatbot.sh --debug

# Force reinstall
./start-sweatbot.sh --force-reinstall

# Check logs
tail -f sweatbot-launch.log
```

## 🛑 Stop Services

```bash
# Ctrl+C in terminal where script is running
# Or kill processes:
pkill -f "start-sweatbot"
```

**💡 Tip**: First time? Just run `./start-sweatbot.sh` and follow the interactive menu!