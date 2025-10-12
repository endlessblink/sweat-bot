# SweatBot Documentation

**Last Updated**: October 12, 2025

## 📋 Documentation Structure

```
docs/
├── README.md                          # This file - documentation index
├── DEBUGGING-SOP.md                   # Standard debugging procedures
├── DOCUMENTATION_CONSOLIDATION.md     # Consolidation history
│
├── main-docs/                         # Core documentation
│   ├── development/                   # Development guides
│   │   ├── TESTING_GUIDE.md
│   │   └── AUTO_PORT_README.md
│   ├── setup/                         # Setup and deployment
│   │   ├── DOCKER_GUIDE.md
│   │   ├── DOCKER_MIGRATION_COMPLETE.md
│   │   └── wsl-gui-options.md
│   ├── AUTHENTICATION.md              # Auth system docs
│   ├── CHAT_UI_LIBRARY_DEBUG_QUERY.md
│   ├── FIX_SUMMARY.md
│   └── _legacy/                       # Archived duplicates
│
├── testing/                           # Testing documentation
│   ├── VOICE-INPUT-TESTING-GUIDE.md
│   ├── VOICE-INPUT-FIX-MISSING-PARAMETERS.md
│   ├── voice-input-research-summary.md
│   └── HEBREW-TEST-PHRASES.md
│
├── screenshots-debug/                 # Test screenshots
├── debug/                             # Debug artifacts
├── inspiration/                       # Design references
│
└── _archive/                          # Historical documentation
    ├── session-summaries/             # Development session notes
    ├── feature-summaries/             # Completed feature docs
    └── old-guides/                    # Outdated/replaced guides
```

## 🚀 Quick Links

### For New Developers
1. **[Project README](../README.md)** - Start here for project overview
2. **[CLAUDE.md](../CLAUDE.md)** - Development guidelines
3. **[Docker Guide](main-docs/setup/DOCKER_GUIDE.md)** - Setup instructions
4. **[Testing Guide](main-docs/development/TESTING_GUIDE.md)** - Testing procedures

### For Debugging
1. **[DEBUGGING-SOP.md](DEBUGGING-SOP.md)** - Infrastructure-first debugging protocol
2. **[screenshots-debug/](screenshots-debug/)** - Visual debugging artifacts
3. **[debug/](debug/)** - Debug logs and traces

### For Testing
1. **[testing/](testing/)** - All testing documentation
2. **[HEBREW-TEST-PHRASES.md](testing/HEBREW-TEST-PHRASES.md)** - Hebrew language test cases

## 📚 Documentation Conventions

### Active Documentation
Files in root and `main-docs/` are **actively maintained** and reflect current implementation.

### Archived Documentation
Files in `_archive/` are **historical reference only**:
- Session summaries from development
- Completed feature documentation
- Replaced/outdated guides

**Do not use archived docs for current development.**

### Testing Documentation
Files in `testing/` are for **QA and verification**:
- Test procedures
- Test data and phrases
- Bug reports and fixes

## 🗂️ Finding What You Need

### "How do I start the project?"
→ **[Project README](../README.md)** - Quick Start section

### "What are the development rules?"
→ **[CLAUDE.md](../CLAUDE.md)** - Development guidelines

### "Something's broken, how do I debug?"
→ **[DEBUGGING-SOP.md](DEBUGGING-SOP.md)** - Debug protocol

### "How do I set up Docker?"
→ **[Docker Guide](main-docs/setup/DOCKER_GUIDE.md)** - Complete setup

### "How do I test the system?"
→ **[Testing Guide](main-docs/development/TESTING_GUIDE.md)** - E2E testing

### "I found an old document, is it current?"
→ Check if it's in `_archive/` - if yes, it's historical only

## 📝 Contributing to Documentation

### When Adding New Documentation
1. Place in appropriate directory (`main-docs/`, `testing/`, etc.)
2. Update this README.md with link
3. Use clear, descriptive filenames
4. Follow markdown formatting standards

### When Documentation Becomes Outdated
1. Move to `_archive/` with appropriate subfolder
2. Update references in other docs
3. Note in consolidation log if significant

### When Finding Redundancy
1. Identify the most accurate version
2. Archive duplicates
3. Update `DOCUMENTATION_CONSOLIDATION.md`

## 🎯 Documentation Principles

1. **Single Source of Truth** - No conflicting information
2. **Clear Organization** - Intuitive folder structure
3. **Active vs Historical** - Clear separation
4. **Findable** - Logical naming and indexing
5. **Maintained** - Regular review and cleanup

---

**Questions?** Check the [Project README](../README.md) or [CLAUDE.md](../CLAUDE.md)
