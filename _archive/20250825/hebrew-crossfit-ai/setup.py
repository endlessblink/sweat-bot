#!/usr/bin/env python3
"""
Setup configuration for Hebrew CrossFit AI
"""

from setuptools import setup, find_packages
from pathlib import Path

# Read the README file
README_PATH = Path(__file__).parent / "README.md"
if README_PATH.exists():
    with open(README_PATH, "r", encoding="utf-8") as fh:
        long_description = fh.read()
else:
    long_description = "AI-powered Hebrew CrossFit coaching with voice interaction"

# Read requirements
REQUIREMENTS_PATH = Path(__file__).parent / "requirements.txt"
if REQUIREMENTS_PATH.exists():
    with open(REQUIREMENTS_PATH, "r", encoding="utf-8") as fh:
        requirements = [
            line.strip() 
            for line in fh 
            if line.strip() and not line.startswith("#") and not line.startswith("python>=")
        ]
else:
    requirements = []

setup(
    name="hebrew-crossfit-ai",
    version="2.0.0",
    author="Hebrew CrossFit AI Team",
    author_email="contact@hebrew-crossfit-ai.com",
    description="AI-powered Hebrew CrossFit coaching with voice interaction",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/hebrew-crossfit-ai/hebrew-crossfit-ai",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: End Users/Desktop",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Multimedia :: Sound/Audio :: Speech",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "Natural Language :: Hebrew",
        "Topic :: Games/Entertainment",
    ],
    python_requires=">=3.9",
    install_requires=requirements,
    extras_require={
        "dev": [
            "pytest>=7.4.0",
            "black>=23.0.0",
            "flake8>=6.0.0",
            "mypy>=1.5.0",
        ],
        "web": [
            "streamlit>=1.28.0",
            "fastapi>=0.104.0",
            "uvicorn>=0.23.0",
        ],
        "audio": [
            "pyaudio>=0.2.11",
            "sounddevice>=0.4.6",
            "soundfile>=0.12.1",
        ]
    },
    entry_points={
        "console_scripts": [
            "hebrew-crossfit-desktop=ui.desktop_app:main",
            "hebrew-crossfit-web=ui.web_app:main",
            "hebrew-crossfit-mobile=ui.mobile_app:main",
        ],
    },
    include_package_data=True,
    package_data={
        "": ["*.json", "*.yml", "*.yaml", "*.md"],
        "data": ["*.json", "*.csv"],
        "assets": ["**/*"],
    },
    zip_safe=False,
    keywords=[
        "hebrew", "crossfit", "ai", "voice", "speech", "fitness", "workout", 
        "coaching", "gamification", "health", "exercise", "tracking"
    ],
    project_urls={
        "Bug Tracker": "https://github.com/hebrew-crossfit-ai/hebrew-crossfit-ai/issues",
        "Documentation": "https://hebrew-crossfit-ai.readthedocs.io/",
        "Source Code": "https://github.com/hebrew-crossfit-ai/hebrew-crossfit-ai",
    },
)