#!/usr/bin/env python3
"""
Hebrew CrossFit AI - Web Application Launcher
"""

import sys
import os
import subprocess
from pathlib import Path

def main():
    """Launch the web application using Streamlit"""
    # Set up paths
    project_root = Path(__file__).parent.parent
    src_path = project_root / "src"
    web_app_path = src_path / "ui" / "web_app.py"
    
    # Change to project directory
    os.chdir(project_root)
    
    print("🌐 Starting Hebrew CrossFit AI Web Application...")
    print(f"📁 Project root: {project_root}")
    print(f"🎯 Web app: {web_app_path}")
    
    # Check if web app exists
    if not web_app_path.exists():
        print(f"❌ Web app not found at {web_app_path}")
        sys.exit(1)
    
    try:
        # Launch Streamlit
        cmd = [
            sys.executable, "-m", "streamlit", "run", 
            str(web_app_path),
            "--server.address", "0.0.0.0",
            "--server.port", "8501",
            "--browser.gatherUsageStats", "false"
        ]
        
        print(f"🚀 Running: {' '.join(cmd)}")
        subprocess.run(cmd)
        
    except KeyboardInterrupt:
        print("\n👋 Shutting down Hebrew CrossFit AI Web...")
    except Exception as e:
        print(f"❌ Error launching web app: {e}")
        print("💡 Make sure Streamlit is installed: pip install streamlit")
        sys.exit(1)

if __name__ == "__main__":
    main()