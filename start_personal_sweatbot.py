#!/usr/bin/env python3
"""
Personal SweatBot Startup Script
Starts both the FastAPI backend and Next.js frontend for your personal experience
"""

import subprocess
import sys
import time
import os
import signal
from pathlib import Path
import threading

def start_backend():
    """Start the FastAPI backend server"""
    print("🐍 Starting FastAPI backend...")
    try:
        process = subprocess.Popen([
            sys.executable, "personal_sweatbot_server.py"
        ], cwd=Path(__file__).parent)
        return process
    except Exception as e:
        print(f"❌ Failed to start backend: {e}")
        return None

def start_frontend():
    """Start the Next.js frontend"""
    print("⚛️ Starting Next.js frontend...")
    try:
        # Install dependencies first
        subprocess.run(["npm", "install"], cwd="personal-ui", check=True)
        
        # Start the development server
        process = subprocess.Popen([
            "npm", "run", "dev"
        ], cwd="personal-ui")
        return process
    except Exception as e:
        print(f"❌ Failed to start frontend: {e}")
        return None

def main():
    print("🏋️ Starting Personal SweatBot System...")
    print("=" * 50)
    
    backend_process = None
    frontend_process = None
    
    try:
        # Start backend
        backend_process = start_backend()
        if not backend_process:
            print("❌ Failed to start backend")
            return
        
        print("⏳ Waiting for backend to initialize...")
        time.sleep(3)
        
        # Start frontend
        frontend_process = start_frontend()
        if not frontend_process:
            print("❌ Failed to start frontend")
            if backend_process:
                backend_process.terminate()
            return
        
        print("\n✅ Personal SweatBot System Started!")
        print("🌐 Frontend: http://localhost:4445")
        print("🔌 Backend API: http://localhost:8765")
        print("📖 API Docs: http://localhost:8765/docs")
        print("\nPress Ctrl+C to stop both servers...")
        
        # Wait for processes
        while backend_process and frontend_process:
            if backend_process.poll() is not None:
                print("❌ Backend process ended")
                break
            if frontend_process.poll() is not None:
                print("❌ Frontend process ended") 
                break
            time.sleep(1)
    
    except KeyboardInterrupt:
        print("\n🛑 Stopping Personal SweatBot System...")
    
    finally:
        # Clean shutdown
        if backend_process:
            print("🐍 Stopping backend...")
            backend_process.terminate()
            try:
                backend_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                backend_process.kill()
        
        if frontend_process:
            print("⚛️ Stopping frontend...")
            frontend_process.terminate()
            try:
                frontend_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                frontend_process.kill()
        
        print("🏋️ Personal SweatBot System stopped. Keep up the great work!")

if __name__ == "__main__":
    main()