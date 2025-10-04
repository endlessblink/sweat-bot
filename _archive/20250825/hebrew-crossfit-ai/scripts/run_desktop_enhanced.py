#!/usr/bin/env python3
"""
Run the Enhanced Hebrew CrossFit AI Desktop Application
With weight tracking and personal records
"""

import sys
import os
from pathlib import Path

def main():
    """Launch the enhanced desktop application"""
    # Add src directory to Python path
    project_root = Path(__file__).parent.parent
    src_path = project_root / "src"
    sys.path.insert(0, str(src_path))
    
    # Set working directory
    os.chdir(project_root)
    
    # Check for .env file
    env_file = project_root / ".env"
    if not env_file.exists():
        print("⚠️  No .env file found!")
        print("Creating .env from template...")
        
        env_example = project_root / ".env.example"
        if env_example.exists():
            import shutil
            shutil.copy(env_example, env_file)
            print("✅ Created .env file")
            print("📝 Please edit .env and add your Gemini API key")
            print("")
        else:
            # Create basic .env
            with open(env_file, 'w') as f:
                f.write("# Hebrew CrossFit AI Configuration\n")
                f.write("GEMINI_API_KEY=your_key_here\n")
            print("✅ Created basic .env file")
            print("📝 Please edit .env and add your Gemini API key")
            input("Press Enter after adding your API key...")
    
    try:
        # Import and run the enhanced desktop app
        from ui.desktop_app_enhanced import main as desktop_main
        
        print("🏋️ Starting Enhanced Hebrew CrossFit AI...")
        print("✨ New Features:")
        print("  - Weight tracking (e.g., 'עשיתי בק סקווט 50 קילו')")
        print("  - Personal records tracking")
        print("  - Progress monitoring")
        print("  - Enhanced points with weight bonuses")
        print("")
        
        desktop_main()
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("\n💡 Installing required dependencies...")
        
        import subprocess
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        
        print("\n🔄 Retrying...")
        from ui.desktop_app_enhanced import main as desktop_main
        desktop_main()
        
    except Exception as e:
        print(f"❌ Error launching enhanced desktop app: {e}")
        import traceback
        traceback.print_exc()
        input("\nPress Enter to exit...")
        sys.exit(1)

if __name__ == "__main__":
    main()