#!/bin/bash
# Raspberry Pi Setup Script for Game Arcade
# Run this once to configure autostart

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ARCADE_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Game Arcade Pi Setup ==="
echo ""

# Check if Love2D is installed
if ! command -v love &> /dev/null; then
    echo "Love2D not found. Installing..."
    sudo apt-get update
    sudo apt-get install -y love
else
    echo "Love2D is already installed"
fi

# Create autostart directory
mkdir -p ~/.config/autostart

# Create desktop entry for autostart
cat > ~/.config/autostart/game-arcade.desktop << EOF
[Desktop Entry]
Type=Application
Name=Game Arcade
Exec=$SCRIPT_DIR/start.sh
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOF

echo ""
echo "Setup complete!"
echo ""
echo "The Game Arcade will now start automatically on login."
echo ""
echo "To start manually, run:"
echo "  $SCRIPT_DIR/start.sh"
echo ""
echo "To disable autostart, delete:"
echo "  ~/.config/autostart/game-arcade.desktop"
