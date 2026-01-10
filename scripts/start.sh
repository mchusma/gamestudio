#!/bin/bash
# Game Arcade Launcher
# This script runs the dashboard and launches selected games in a loop

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ARCADE_DIR="$(dirname "$SCRIPT_DIR")"
DASHBOARD_DIR="$ARCADE_DIR/dashboard"
GAMES_DIR="$ARCADE_DIR/games"

# Detect OS and set Love2D paths accordingly
if [[ "$OSTYPE" == "darwin"* ]]; then
    LOVE_SAVE_DIR="$HOME/Library/Application Support/LOVE/dashboard"
    LOVE="/Applications/love.app/Contents/MacOS/love"
else
    LOVE_SAVE_DIR="$HOME/.local/share/love/dashboard"
    LOVE="love"
fi
SELECTION_FILE="$LOVE_SAVE_DIR/selection.txt"

# Ensure Love2D save directory exists
mkdir -p "$LOVE_SAVE_DIR"

echo "Starting Game Arcade..."
echo "Press Escape in dashboard to exit completely"

while true; do
    # Clear previous selection
    echo "" > "$SELECTION_FILE"

    # Run dashboard
    "$LOVE" "$DASHBOARD_DIR"

    # Check what was selected
    if [ -f "$SELECTION_FILE" ]; then
        SELECTION=$(cat "$SELECTION_FILE" | tr -d '[:space:]')

        if [ -z "$SELECTION" ]; then
            echo "Exiting Game Arcade"
            exit 0
        fi

        GAME_PATH="$GAMES_DIR/$SELECTION"

        if [ -d "$GAME_PATH" ]; then
            echo "Launching: $SELECTION"
            "$LOVE" "$GAME_PATH"
            echo "Game exited, returning to dashboard..."
        else
            echo "Game not found: $SELECTION"
        fi
    else
        echo "No selection file found, exiting"
        exit 0
    fi
done
