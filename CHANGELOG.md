# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
