# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2026-03-15

### Added
- **Project-Scoped Tasks (`todo project`)**: Organize your tasks by project. Each project has its own isolated task list.
  - `todo project create <name>` — Create a new project.
  - `todo project list` — List all projects with task counts, highlighting the active one.
  - `todo project switch <name>` — Switch to a project (use `global` for the default task list).
  - `todo project delete <name>` — Delete a project and its tasks (with confirmation).
  - `todo project` — Show the currently active project.
- **Zen Mode Project Switching**: Press `[P]` in Zen Mode to cycle through all projects without leaving the TUI. The header now displays the active project name.

### Changed
- Bumped CLI version to `3.0.0`.
- Storage now supports per-project directories under `~/.local/share/todo-cli/projects/<name>/`.

---

## [2.0.0] - 2026-03-10

### Added
- **Zen Mode (`todo zen`)**: A new immersive fullscreen interface built with `ink` and `react` to help you focus. Includes:
  - Pomodoro timer with work and break sessions.
  - Fast keyboard shortcuts to navigate and modify your task list directly from the focus view.
  - Large ASCII art clock and progress bars for tasks and timer.
- Graceful exit handling for abrupt terminations and signal interrupts (`SIGINT`).

### Changed
- Bumped command-line utility version to `2.0.0`.

## [1.0.0] - Initial Release

### Added
- Base CLI tool utilizing `commander` for elegant command parsing.
- Core commands: `list`, `add`, `done`, `undone`, and `remove`.
- Beautiful table layouts powered by `cli-table3` and `chalk`.
- Interactive prompts using `@inquirer/prompts`.
- Local JSON data persistence securely stored in `~/.local/share/todo-cli/tasks.json`.
- Nerd Font icons mapping to visually improve the output aesthetics.
