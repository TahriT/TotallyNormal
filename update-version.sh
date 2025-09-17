#!/bin/bash
# Version Update Script for TotallyNormal

if [ $# -eq 0 ]; then
    echo "Usage: $0 <version> [description]"
    echo "Example: $0 1.3.0 'Added new features and bug fixes'"
    exit 1
fi

VERSION=$1
DESCRIPTION=${2:-"Updated to version $VERSION"}
BUILD_DATE=$(date +"%Y-%m-%d")

echo "Updating TotallyNormal to version $VERSION..."

# Update version.json
cat > version.json << EOF
{
  "version": "$VERSION",
  "name": "TotallyNormal PBR Generator",
  "buildDate": "$BUILD_DATE",
  "description": "$DESCRIPTION",
  "changes": [
    "Version $VERSION release",
    "Updated build date to $BUILD_DATE"
  ]
}
EOF

# Update service worker
sed -i "s/const APP_VERSION = '[^']*'/const APP_VERSION = '$VERSION'/" sw.js

# Update textureGenerator.js
sed -i "s/this.version = '[^']*'/this.version = '$VERSION'/" js/textureGenerator.js

# Update CHANGELOG.md
echo "" >> CHANGELOG.md
echo "## v$VERSION - $BUILD_DATE" >> CHANGELOG.md
echo "$DESCRIPTION" >> CHANGELOG.md
echo "" >> CHANGELOG.md

echo "✅ Updated to version $VERSION"
echo "📝 Updated files:"
echo "   - version.json"
echo "   - sw.js"
echo "   - js/textureGenerator.js"
echo "   - CHANGELOG.md"
echo ""
echo "🚀 Ready to commit and deploy!"
echo "   git add ."
echo "   git commit -m 'Release v$VERSION: $DESCRIPTION'"
echo "   git tag v$VERSION"
echo "   git push origin main --tags"
