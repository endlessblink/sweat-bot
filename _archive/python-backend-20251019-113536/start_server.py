#!/usr/bin/env python3
"""
SweatBot Backend Server Starter
Supports dynamic port allocation
"""

import os
import sys
import json
import uvicorn
from pathlib import Path

def load_port_config():
    """Load port configuration from .ports.json if it exists"""
    ports_file = Path(__file__).parent.parent / '.ports.json'
    if ports_file.exists():
        try:
            with open(ports_file, 'r') as f:
                config = json.load(f)
                return config.get('backend', 8000)
        except:
            pass
    return 8000

def main():
    # Get port from environment variable, command line, or config file
    port = 8000
    
    # Priority 1: Command line argument
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print(f"Invalid port number: {sys.argv[1]}")
            sys.exit(1)
    # Priority 2: Environment variable
    elif os.environ.get('BACKEND_PORT_ENV'):
        try:
            port = int(os.environ['BACKEND_PORT_ENV'])
        except ValueError:
            pass
    # Priority 3: Port config file
    else:
        port = load_port_config()
    
    print(f"🚀 Starting SweatBot Backend on port {port}...")
    
    # Start the server
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )

if __name__ == "__main__":
    main()