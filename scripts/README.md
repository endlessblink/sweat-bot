# SweatBot Scripts Directory

This directory contains all SweatBot scripts organized by functionality.

## Directory Structure

### 📁 launch/
Main launch scripts for starting SweatBot:
- `start-sweatbot.sh` - Primary unified launcher (also available in project root)
- `docker-compose-launch.sh` - Docker Compose based launcher

### 📁 utils/
Utility and maintenance scripts:
- `check-status.sh` - Check SweatBot system status
- `restart.sh` - Restart SweatBot services
- `install-dependencies.sh` - Install all project dependencies

### 📁 backup/
Backup and restore utilities:
- `backup-volumes.sh` - Backup Docker volumes and data
- `restore-volumes.sh` - Restore from backups

### 📁 docker/
Docker-specific scripts:
- `docker-start.sh` - Start Docker containers (Linux/Mac)
- `docker-start.bat` - Start Docker containers (Windows)

### 📁 legacy/
Older launch scripts (kept for reference, use `start-sweatbot.sh` instead):
- `launch-sweatbot.sh` - Old launcher
- `launch-sweatbot-minimal.sh` - Old minimal mode
- `launch-sweatbot-fixed.sh` - Old fixed version
- `start-sweatbot-unified.sh` - Old unified version

## Quick Usage

From the project root, you can still use:
```bash
./start-sweatbot.sh
```

Or from anywhere in the project:
```bash
./scripts/launch/start-sweatbot.sh
```

For utilities:
```bash
./scripts/utils/check-status.sh
./scripts/backup/backup-volumes.sh
```