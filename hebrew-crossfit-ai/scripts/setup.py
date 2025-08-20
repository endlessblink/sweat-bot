#!/usr/bin/env python3
"""
Hebrew CrossFit AI - Setup and Installation Script
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

class HebrewCrossFitSetup:
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.requirements_file = self.project_root / "requirements.txt"
        self.env_example = self.project_root / ".env.example"
        self.env_file = self.project_root / ".env"
        
    def check_python_version(self):
        """Check if Python version is compatible"""
        print("🐍 Checking Python version...")
        version = sys.version_info
        if version.major < 3 or (version.major == 3 and version.minor < 9):
            print(f"❌ Python {version.major}.{version.minor} detected")
            print("⚠️  Hebrew CrossFit AI requires Python 3.9 or higher")
            print("📥 Please install Python 3.9+ from https://python.org")
            return False
        
        print(f"✅ Python {version.major}.{version.minor}.{version.micro} is compatible")
        return True
    
    def install_dependencies(self):
        """Install required Python packages"""
        print("\n📦 Installing dependencies...")
        
        if not self.requirements_file.exists():
            print(f"❌ Requirements file not found: {self.requirements_file}")
            return False
        
        try:
            # Upgrade pip first
            subprocess.run([
                sys.executable, "-m", "pip", "install", "--upgrade", "pip"
            ], check=True)
            
            # Install requirements
            subprocess.run([
                sys.executable, "-m", "pip", "install", "-r", str(self.requirements_file)
            ], check=True)
            
            print("✅ Dependencies installed successfully")
            return True
            
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install dependencies: {e}")
            print("💡 Try running: pip install -r requirements.txt")
            return False
    
    def setup_environment(self):
        """Set up environment configuration"""
        print("\n⚙️  Setting up environment configuration...")
        
        if not self.env_file.exists():
            if self.env_example.exists():
                shutil.copy(self.env_example, self.env_file)
                print(f"✅ Created .env from template")
                print(f"📝 Please edit {self.env_file} with your API keys")
            else:
                print("⚠️  No .env.example found, creating basic .env")
                with open(self.env_file, 'w') as f:
                    f.write("# Hebrew CrossFit AI Configuration\n")
                    f.write("GEMINI_API_KEY=your_gemini_key_here\n")
                    f.write("UI_LANGUAGE=he\n")
                    f.write("VOICE_LANGUAGE=he-IL\n")
        else:
            print("✅ .env file already exists")
        
        return True
    
    def check_audio_support(self):
        """Check audio libraries installation"""
        print("\n🎤 Checking audio support...")
        
        try:
            import pyaudio
            print("✅ PyAudio is available")
        except ImportError:
            print("⚠️  PyAudio not found - voice features may not work")
            print("💡 Install with: pip install pyaudio")
            
            # Try to install PyAudio
            try:
                subprocess.run([
                    sys.executable, "-m", "pip", "install", "pyaudio"
                ], check=True)
                print("✅ PyAudio installed successfully")
            except subprocess.CalledProcessError:
                print("❌ PyAudio installation failed")
                print("🔧 Manual installation may be required")
        
        try:
            import sounddevice
            print("✅ SoundDevice is available")
        except ImportError:
            print("⚠️  SoundDevice not found")
        
        return True
    
    def create_directories(self):
        """Create necessary directories"""
        print("\n📁 Creating directories...")
        
        directories = [
            "data",
            "logs",
            "assets/icons",
            "assets/sounds", 
            "assets/images"
        ]
        
        for dir_path in directories:
            full_path = self.project_root / dir_path
            full_path.mkdir(parents=True, exist_ok=True)
            print(f"✅ Created: {dir_path}")
        
        return True
    
    def test_installation(self):
        """Test if installation is working"""
        print("\n🧪 Testing installation...")
        
        # Test core imports
        test_modules = [
            ("src.utils.config", "Configuration"),
            ("src.core.exercise_tracker", "Exercise Tracker"),
            ("streamlit", "Streamlit Web Framework")
        ]
        
        success = True
        for module, name in test_modules:
            try:
                __import__(module.replace("src.", ""))
                print(f"✅ {name}")
            except ImportError as e:
                print(f"❌ {name}: {e}")
                success = False
        
        return success
    
    def print_next_steps(self):
        """Print next steps for user"""
        print("\n🎉 Setup completed!")
        print("\n📋 Next steps:")
        print("1. 🔑 Edit .env file with your API keys:")
        print(f"   - Open: {self.env_file}")
        print("   - Add your Gemini API key (required)")
        print("   - Configure other settings as needed")
        print("\n2. 🚀 Run the application:")
        print("   - Desktop: python scripts/run_desktop.py")
        print("   - Web: python scripts/run_web.py")
        print("   - Or use: python -m pip install -e . && hebrew-crossfit-desktop")
        print("\n3. 🎤 Test voice features:")
        print("   - Grant microphone permissions")
        print("   - Speak in Hebrew: 'עשיתי 10 שכיבות סמיכה'")
        print("\n📚 Documentation: README.md")
        print("🐛 Issues: https://github.com/hebrew-crossfit-ai/issues")
    
    def run_setup(self):
        """Run the complete setup process"""
        print("🏋️ Hebrew CrossFit AI - Setup Script")
        print("=" * 50)
        
        steps = [
            ("Python Version", self.check_python_version),
            ("Dependencies", self.install_dependencies),
            ("Environment", self.setup_environment),
            ("Audio Support", self.check_audio_support),
            ("Directories", self.create_directories),
            ("Installation Test", self.test_installation)
        ]
        
        for step_name, step_func in steps:
            if not step_func():
                print(f"\n❌ Setup failed at: {step_name}")
                return False
        
        self.print_next_steps()
        return True

def main():
    """Main setup function"""
    setup = HebrewCrossFitSetup()
    success = setup.run_setup()
    
    if success:
        print("\n✅ Setup completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Setup failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()