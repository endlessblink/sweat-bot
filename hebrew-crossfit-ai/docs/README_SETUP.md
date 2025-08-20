# Hebrew CrossFit AI - Setup Instructions

## Prerequisites
- Miniconda or Anaconda installed
- Windows, Linux, or macOS

## Setup Process

### Windows Setup

1. **Run the setup script:**
   ```cmd
   setup.bat
   ```
   This will:
   - Check for conda installation
   - Create a new conda environment called `hebrew-crossfit-ai`
   - Install all dependencies INSIDE that environment
   - Create launch scripts

2. **Run the application:**
   ```cmd
   run_hebrew_crossfit.bat
   ```
   This will:
   - Activate the `hebrew-crossfit-ai` conda environment
   - Run the application with proper Hebrew support

### Manual Setup (All Platforms)

If you prefer to set up manually:

1. **Create conda environment:**
   ```bash
   conda create -n hebrew-crossfit-ai python=3.9 -y
   ```

2. **Activate the environment:**
   ```bash
   conda activate hebrew-crossfit-ai
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application:**
   ```bash
   python main.py
   ```

## Important Notes

- **All installations happen INSIDE the conda environment**, not in your base Python
- The application checks that it's running from a conda environment
- Hebrew support requires UTF-8 encoding, which is automatically configured

## Environment Flow

```
setup.bat
    ↓
Checks for conda
    ↓
Runs setup_conda.py
    ↓
Creates 'hebrew-crossfit-ai' environment
    ↓
Uses 'conda run -n hebrew-crossfit-ai pip install'
    ↓
All packages installed IN the environment
    ↓
Creates run_hebrew_crossfit.bat
    ↓
Ready to use!
```

## Verification

To verify the setup worked correctly:

1. Check the environment exists:
   ```cmd
   conda env list
   ```
   You should see `hebrew-crossfit-ai` in the list.

2. Check packages are installed in the environment:
   ```cmd
   conda activate hebrew-crossfit-ai
   pip list
   ```
   You should see all the required packages.

## Troubleshooting

If you get "conda not found":
- Make sure Miniconda is installed
- Add conda to your PATH
- Restart your terminal

If packages fail to install:
- Make sure you have internet connection
- Try installing packages one by one
- Check the error messages for specific issues