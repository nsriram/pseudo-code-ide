#!/bin/sh
# Installs the project's git hooks into .git/hooks/.
# Run once after cloning: sh scripts/setup-hooks.sh

set -e

HOOKS_DIR="$(git rev-parse --show-toplevel)/.git/hooks"

cat > "$HOOKS_DIR/pre-push" << 'EOF'
#!/bin/sh
# Pre-push hook: run lint and unit tests before pushing to remote.

set -e

echo "▶ lint..."
npm run lint

echo "▶ unit tests..."
npm test

echo "✓ All checks passed — pushing."
EOF

chmod +x "$HOOKS_DIR/pre-push"
echo "✓ pre-push hook installed."