# 📝 Todo CLI

A simple, interactive, and beautifully designed command-line interface (CLI) application for managing your to-do lists directly from your terminal. Built with Node.js, Commander, Inquirer, and Chalk.

## ✨ Features

- **Interactive Prompts**: Easily add, complete, and remove tasks with interactive menus using `@inquirer/prompts`.
- **Beautiful UI**: Colorful and well-formatted table outputs using `chalk` and `cli-table3`.
- **Nerd Font Icons**: Visually appealing icons for task statuses.
- **Data Persistence**: Tasks are saved locally and persistently in your system.

## 🚀 Installation (Global)

You can install this CLI globally on your system to access the `todo` command from anywhere in your terminal.

### Prerequisites
- [Node.js](https://nodejs.org/) (v14 or higher recommended)
- [NPM](https://www.npmjs.com/) (usually comes with Node.js)
- A terminal with [Nerd Fonts](https://www.nerdfonts.com/) installed to render the icons correctly.

### Steps to Install

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <your-repository-url>
   cd todo-cli
   ```

2. **Install dependencies**:
   Ensure you are in the project directory and run:
   ```bash
   npm install
   ```

3. **Install the CLI globally**:
   From inside the `todo-cli` directory, run the following command to link the package globally:
   ```bash
   npm install -g .
   ```
   *(Alternatively, you can use `npm link` to create a symlink.)*

4. **Verify the installation**:
   Run the following command anywhere in your terminal to check if everything works:
   ```bash
   todo --version
   ```
   Or to see the help menu:
   ```bash
   todo --help
   ```

## 🛠️ Usage

Once installed globally, you can use the `todo` command seamlessly from any directory.

### Available Commands

- **List Tasks**
  View all your tasks in a well-formatted table layout.
  ```bash
  todo list
  # or
  todo ls
  ```

- **Add a Task**
  Opens an interactive prompt to add a new task.
  ```bash
  todo add
  ```

- **Mark a Task as Done**
  Opens an interactive prompt to select a pending task and mark it as completed.
  ```bash
  todo done
  ```

- **Un-mark a Task (Undone)**
  Mistakenly marked a task as done? Revert its status back to pending.
  ```bash
  todo undone
  ```

- **Remove a Task**
  Opens an interactive prompt to select a task and permanently delete it.
  ```bash
  todo remove
  # or
  todo rm
  ```

## 📂 Data Storage

Your tasks are saved securely as a JSON file in your local system user directory:
- **Location**: `~/.local/share/todo-cli/tasks.json`

## 📄 License

This project is licensed under the [ISC License](https://opensource.org/licenses/ISC).
