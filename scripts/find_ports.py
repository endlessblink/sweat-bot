#!/usr/bin/env python3
"""
Port Finder Utility for SweatBot
Finds available ports for backend and frontend services
"""

import socket
import json
import sys
import argparse
from typing import Optional, Dict

def is_port_available(port: int) -> bool:
    """Check if a port is available for binding"""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            s.bind(('', port))
            return True
    except OSError:
        return False

def find_available_port(start_port: int, end_port: int, preferred: Optional[int] = None) -> Optional[int]:
    """
    Find an available port in the given range
    
    Args:
        start_port: Starting port number
        end_port: Ending port number (inclusive)
        preferred: Preferred port to try first
    
    Returns:
        Available port number or None if no ports available
    """
    # Try preferred port first if specified
    if preferred and start_port <= preferred <= end_port:
        if is_port_available(preferred):
            return preferred
    
    # Try each port in the range
    for port in range(start_port, end_port + 1):
        if is_port_available(port):
            return port
    
    return None

def find_ports(
    backend_range: tuple = (8000, 8010),
    frontend_range: tuple = (3000, 3010),
    backend_preferred: Optional[int] = 8000,
    frontend_preferred: Optional[int] = 3000
) -> Dict[str, int]:
    """
    Find available ports for backend and frontend
    
    Returns:
        Dictionary with 'backend' and 'frontend' port numbers
    """
    backend_port = find_available_port(
        backend_range[0], 
        backend_range[1], 
        backend_preferred
    )
    
    if not backend_port:
        raise RuntimeError(f"No available ports in backend range {backend_range}")
    
    frontend_port = find_available_port(
        frontend_range[0], 
        frontend_range[1], 
        frontend_preferred
    )
    
    if not frontend_port:
        raise RuntimeError(f"No available ports in frontend range {frontend_range}")
    
    return {
        'backend': backend_port,
        'frontend': frontend_port,
        'api_url': f'http://localhost:{backend_port}',
        'app_url': f'http://localhost:{frontend_port}'
    }

def save_ports_config(ports: Dict[str, int], filename: str = '.ports.json') -> None:
    """Save port configuration to a JSON file"""
    with open(filename, 'w') as f:
        json.dump(ports, f, indent=2)

def load_ports_config(filename: str = '.ports.json') -> Optional[Dict[str, int]]:
    """Load port configuration from a JSON file"""
    try:
        with open(filename, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return None

def main():
    parser = argparse.ArgumentParser(description='Find available ports for SweatBot')
    parser.add_argument(
        '--backend-start', 
        type=int, 
        default=8000,
        help='Starting port for backend range (default: 8000)'
    )
    parser.add_argument(
        '--backend-end', 
        type=int, 
        default=8010,
        help='Ending port for backend range (default: 8010)'
    )
    parser.add_argument(
        '--frontend-start', 
        type=int, 
        default=3000,
        help='Starting port for frontend range (default: 3000)'
    )
    parser.add_argument(
        '--frontend-end', 
        type=int, 
        default=3010,
        help='Ending port for frontend range (default: 3010)'
    )
    parser.add_argument(
        '--save', 
        action='store_true',
        help='Save port configuration to .ports.json'
    )
    parser.add_argument(
        '--json', 
        action='store_true',
        help='Output as JSON'
    )
    parser.add_argument(
        '--check-current',
        action='store_true',
        help='Check if ports in .ports.json are still available'
    )
    
    args = parser.parse_args()
    
    try:
        # Check current configuration if requested
        if args.check_current:
            current = load_ports_config()
            if current:
                backend_available = is_port_available(current['backend'])
                frontend_available = is_port_available(current['frontend'])
                
                if backend_available and frontend_available:
                    if args.json:
                        print(json.dumps(current))
                    else:
                        print(f"Current ports are available:")
                        print(f"  Backend:  {current['backend']}")
                        print(f"  Frontend: {current['frontend']}")
                    return 0
                else:
                    if not args.json:
                        print("Current ports are not available, finding new ones...")
        
        # Find available ports
        ports = find_ports(
            backend_range=(args.backend_start, args.backend_end),
            frontend_range=(args.frontend_start, args.frontend_end)
        )
        
        # Save if requested
        if args.save:
            save_ports_config(ports)
            if not args.json:
                print(f"Port configuration saved to .ports.json")
        
        # Output results
        if args.json:
            print(json.dumps(ports))
        else:
            print(f"Available ports found:")
            print(f"  Backend:  {ports['backend']} ({ports['api_url']})")
            print(f"  Frontend: {ports['frontend']} ({ports['app_url']})")
            print(f"\nStart commands:")
            print(f"  Backend:  uvicorn app.main:app --port {ports['backend']}")
            print(f"  Frontend: npm run dev -- -p {ports['frontend']}")
        
        return 0
        
    except Exception as e:
        if args.json:
            print(json.dumps({'error': str(e)}))
        else:
            print(f"Error: {e}", file=sys.stderr)
        return 1

if __name__ == '__main__':
    sys.exit(main())