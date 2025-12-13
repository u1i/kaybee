# Kaybee

Kaybee is a lightweight, standalone Kanban board that runs entirely in your browser. It is designed to be a simple, offline-capable tool for personal task management.

## Features

- **Multi-Board Support**: Manage multiple boards within the same app using the Board Switcher or direct links (e.g., `/#1`, `/#2`).
- **Focus Mode**: Click the colorful dots in the header to filter cards by color and focus on specific topics.
- **Board Deletion**: Easily remove boards you no longer need.
- **Headless & Offline**: No backend server or database required. All data is stored locally in your browser (LocalStorage).
- **Drag & Drop**: Easily move cards between columns and organize your board.
- **Customizable**: Add as many columns as you need.
- **Card Styling**: Color-code your cards and toggle between a fun handwritten font and a clean, readable sans-serif font.
- **Sticky Preferences**: Your theme (Dark/Light) and font choices are remembered across sessions.
- **Zero Setup**: Just open `index.html` to get started.

## Usage

1.  **Open**: Double-click `index.html` or visit the deployed site.
2.  **Manage Boards**: Use the dropdown next to the logo to switch boards. Click `+` to create a new board.
3.  **Delete Boards**: Click the red `×` button next to the switcher to delete the current board (with confirmation).
4.  **Focus Mode**: Click the small color dots in the header (e.g., Blue) to fade out all other cards. Click again to reset.
5.  **Add Columns**: Use the `+` button in the header (right side) to create new columns.
6.  **Add Cards**: Click the `+` inside any column to add a task card.
7.  **Edit**: Click on card text to edit. Click color dots to change card color.
8.  **Delete Cards**: Drag a card to the trash zone in the bottom right corner to remove it.
9.  **Reset**: Use the "Reset" button to clear the *current* board and start fresh.

## Easter Egg

- **Invisible Shooter Mode**: Press `Cmd + Shift + K` (Mac) or `Ctrl + Shift + K` (Windows) to activate. Click specifically to paint the town green! (Note: Disabled while editing cards or columns).

## Privacy

Since Kaybee is headless, your data never leaves your device. It persists in your browser's storage until you clear it.
