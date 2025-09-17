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

### Local Development
1. Clone repository
2. Start local server: `python -m http.server 8000` or `npx serve`
3. Open `http://localhost:8000`
4. Application auto-detects local environment

### Backend Development (Optional)
1. Install Python dependencies: `cd backend && pip install -r requirements.txt`
2. Start backend: `python app.py`
3. Start frontend on `localhost` (backend auto-detected)

## 🔧 Configuration

The application automatically configures based on environment:

- **GitHub Pages**: Frontend-only mode (no backend calls)
- **Localhost**: Attempts backend connection, fallback to frontend
- **Other domains**: Frontend-only mode

## 📚 Documentation

- **Architecture**: See `docs/development/ARCHITECTURE.md`
- **Recent Fixes**: See `docs/development/RECURSION_FIX_SUMMARY.md`  
- **Testing Guide**: See `docs/development/TESTING_INSTRUCTIONS.md`

## 🧪 Testing

Run the test validation:
```bash
node docs/development/test-recursion-fix.js
```

## 🏗️ Build Process

No build process required! This is a vanilla JavaScript application that runs directly in browsers.

## 📝 Contributing

1. Check existing issues and documentation
2. Test changes locally
3. Ensure GitHub Pages compatibility
4. Submit pull request

For technical details about recent fixes and system architecture, see the development documentation folder.
