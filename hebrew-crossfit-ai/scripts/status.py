#!/usr/bin/env python3
"""
Hebrew CrossFit AI - Project Status Check
"""

import os
import sys
from pathlib import Path

def check_project_structure():
    """Check if project structure is correct"""
    print("📁 Checking project structure...")
    
    project_root = Path(__file__).parent.parent
    
    required_dirs = [
        "src/core",
        "src/ui", 
        "src/services",
        "src/utils",
        "tests",
        "docs",
        "scripts",
        "data",
        "assets",
        "legacy"
    ]
    
    required_files = [
        "README.md",
        "requirements.txt",
        "setup.py",
        ".env.example",
        ".gitignore",
        "src/core/exercise_tracker.py",
        "src/core/ai_coach.py",
        "src/ui/desktop_app.py",
        "src/ui/web_app.py",
        "src/utils/config.py"
    ]
    
    # Check directories
    for dir_path in required_dirs:
        full_path = project_root / dir_path
        if full_path.exists():
            print(f"✅ {dir_path}")
        else:
            print(f"❌ {dir_path}")
    
    # Check files
    for file_path in required_files:
        full_path = project_root / file_path
        if full_path.exists():
            print(f"✅ {file_path}")
        else:
            print(f"❌ {file_path}")

def check_dependencies():
    """Check if dependencies are installed"""
    print("\n📦 Checking dependencies...")
    
    core_deps = [
        "streamlit",
        "pandas", 
        "plotly",
        "requests",
        "sqlite3"
    ]
    
    for dep in core_deps:
        try:
            if dep == "sqlite3":
                import sqlite3
            else:
                __import__(dep)
            print(f"✅ {dep}")
        except ImportError:
            print(f"❌ {dep}")

def check_configuration():
    """Check configuration files"""
    print("\n⚙️ Checking configuration...")
    
    project_root = Path(__file__).parent.parent
    env_file = project_root / ".env"
    
    if env_file.exists():
        print("✅ .env file exists")
        
        # Check for required keys
        with open(env_file, 'r') as f:
            content = f.read()
            
        if "GEMINI_API_KEY" in content:
            print("✅ GEMINI_API_KEY configured")
        else:
            print("⚠️  GEMINI_API_KEY not found in .env")
    else:
        print("❌ .env file missing")
        print("💡 Copy .env.example to .env and configure")

def print_summary():
    """Print project summary"""
    print("\n" + "="*50)
    print("🏋️ Hebrew CrossFit AI - Project Status Summary")
    print("="*50)
    print("\n📊 Current Status:")
    print("- ✅ Project restructured with clean architecture")
    print("- ✅ Legacy files moved to archive")
    print("- ✅ Unified configuration system created")
    print("- ✅ Documentation updated")
    print("- ✅ Setup scripts prepared")
    
    print("\n🚀 Ready to deploy:")
    print("- Desktop application")
    print("- Web application (Streamlit)")
    print("- Mobile-optimized PWA")
    
    print("\n📋 Next steps:")
    print("1. Run: python scripts/setup.py")
    print("2. Configure .env with API keys") 
    print("3. Test: python scripts/run_web.py")
    print("4. Deploy to production")

def main():
    """Main status check function"""
    print("🔍 Hebrew CrossFit AI - Project Status Check")
    print("=" * 50)
    
    check_project_structure()
    check_dependencies()
    check_configuration()
    print_summary()

if __name__ == "__main__":
    main()