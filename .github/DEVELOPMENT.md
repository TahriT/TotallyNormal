# Development Instructions

This file contains setup and development instructions for contributors and maintainers.

## 📁 Project Structure

```
TotallyNormal/
├── docs/
│   ├── development/           # 👈 Development documentation
│   │   ├── ARCHITECTURE.md    # System architecture overview
│   │   ├── RECURSION_FIX_SUMMARY.md  # Technical fix details
│   │   ├── TESTING_INSTRUCTIONS.md   # Testing procedures
│   │   └── test-recursion-fix.js      # Test validation script
│   └── images/               # Documentation assets
├── .github/                  # GitHub configuration
├── js/                      # Application JavaScript
├── backend/                 # Optional Python backend
└── ...                      # Application files
```

## 🚀 Quick Start

### GitHub Pages Deployment (Production)
1. Fork/clone repository
2. Enable GitHub Pages in repository settings
3. Application automatically deploys to `https://[username].github.io/TotallyNormal`
4. No build process required - runs as static site

## 🔧 Configuration

The application automatically configures based on environment:

- **GitHub Pages**: Frontend-only mode (no backend calls)
- **Localhost**: Attempts backend connection, fallback to frontend
- **Other domains**: Frontend-only mode

## 🏗️ Build Process

No build process required! This is a vanilla JavaScript application that runs directly in browsers.

## 📝 Contributing

1. Check existing issues and documentation
2. Test changes locally
3. Ensure GitHub Pages compatibility
4. Submit pull request

For technical details about recent fixes and system architecture, see the development documentation folder.
