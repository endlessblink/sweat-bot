#!/usr/bin/env python3
"""
Hebrew CrossFit AI - Desktop Application Launcher
"""

import sys
import os
import subprocess
from pathlib import Path

def main():
    """Launch the desktop application"""
    # Add src directory to Python path
    project_root = Path(__file__).parent.parent
    src_path = project_root / "src"
    sys.path.insert(0, str(src_path))
    
    # Set working directory
    os.chdir(project_root)
    
    try:
        # Import and run the desktop app
        from ui.desktop_app import main as desktop_main
        print("🏋️ Starting Hebrew CrossFit AI Desktop...")
        desktop_main()
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("💡 Trying alternative launch method...")
        
        # Alternative: Run as subprocess
        desktop_script = src_path / "ui" / "desktop_app.py"
        if desktop_script.exists():
            subprocess.run([sys.executable, str(desktop_script)])
        else:
            print("❌ Desktop app not found!")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Error launching desktop app: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()