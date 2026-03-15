#!/usr/bin/env node

import { program } from 'commander';
import { input, select, confirm } from '@inquirer/prompts';
import Table from 'cli-table3';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

// Graceful Exit
function handleExit(err) {
    if (err instanceof Error && (err.name === 'ExitPromptError' || err.message.includes('force closed'))) {
        console.log(chalk.gray('\n  Dibatalkan.\n'));
        process.exit(0);
    }
    console.error(err);
    process.exit(1);
}
process.on('uncaughtException', handleExit);
process.on('unhandledRejection', handleExit);
process.on('SIGINT', () => {
    console.log(chalk.gray('\n  Dibatalkan.\n'));
    process.exit(0);
});

// ─── Storage ───────────────────────────────────────
const DIR = path.join(process.env.HOME, '.local', 'share', 'todo-cli');
const ACTIVE_FILE = path.join(DIR, 'active-project.json');
const PROJECTS_DIR = path.join(DIR, 'projects');
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

function getActiveProject() {
    if (!fs.existsSync(ACTIVE_FILE)) return null;
    try {
        const data = JSON.parse(fs.readFileSync(ACTIVE_FILE, 'utf8'));
        return data.name || null;
    } catch { return null; }
}

function setActiveProject(name) {
    if (!name || name === 'global') {
        if (fs.existsSync(ACTIVE_FILE)) fs.unlinkSync(ACTIVE_FILE);
    } else {
        fs.writeFileSync(ACTIVE_FILE, JSON.stringify({ name }, null, 2));
    }
}

function getProjectDir(name) {
    return path.join(PROJECTS_DIR, name);
}

function getTaskFile(projectName) {
    if (!projectName) return path.join(DIR, 'tasks.json');
    return path.join(getProjectDir(projectName), 'tasks.json');
}

function listProjects() {
    if (!fs.existsSync(PROJECTS_DIR)) return [];
    return fs.readdirSync(PROJECTS_DIR).filter(f =>
        fs.statSync(path.join(PROJECTS_DIR, f)).isDirectory()
    );
}

function load(projectName) {
    const proj = projectName !== undefined ? projectName : getActiveProject();
    const file = getTaskFile(proj);
    if (!fs.existsSync(file)) return [];
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function save(tasks, projectName) {
    const proj = projectName !== undefined ? projectName : getActiveProject();
    const file = getTaskFile(proj);
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(tasks, null, 2));
}

// Nerd Font Icons
const I = {
    header: '\uf0ae',  // 󰫢 tasks
    done: '\uf058',  //  check-circle
    pending: '\uf10c',  //  circle
    add: '\uf067',  //  plus
    trash: '\uf1f8',  //  trash
    check: '\uf00c',  //  check
    list: '\uf03a',  //  list
    project: '\uf07c', //  folder-open
    star: '\uf005',    //  star
};

function printHeader() {
    const active = getActiveProject();
    const label = active ? `TODO CLI ${chalk.gray('•')} ${chalk.magenta(active)}` : 'TODO CLI';
    console.log('');
    console.log(chalk.cyan.bold(`  ${I.header}  ${label}`));
    console.log(chalk.gray('  ──────────────────────────'));
    console.log('');
}

// ─── PROJECT ───────────────────────────────────────
// Project name validation
const VALID_NAME = /^[a-zA-Z0-9_-]+$/;
function validateProjectName(name) {
    if (name === 'global') {
        console.log(chalk.red(`  ${I.trash}  "global" adalah nama yang sudah dipakai.\n`));
        return false;
    }
    if (!VALID_NAME.test(name)) {
        console.log(chalk.red(`  ${I.trash}  Nama project hanya boleh huruf, angka, "-", dan "_".\n`));
        return false;
    }
    return true;
}

const proj = program
    .command('project')
    .description('Kelola project');

proj
    .command('create <name>')
    .description('Buat project baru')
    .action((name) => {
        printHeader();
        if (!validateProjectName(name)) return;
        const dir = getProjectDir(name);
        if (fs.existsSync(dir)) {
            console.log(chalk.yellow(`  ${I.project}  Project "${name}" sudah ada.\n`));
            return;
        }
        fs.mkdirSync(dir, { recursive: true });
        save([], name);
        console.log(chalk.green(`  ${I.check}  Project "${name}" berhasil dibuat!\n`));
    });

proj
    .command('list')
    .description('Tampilkan semua project')
    .action(() => {
        printHeader();
        const projects = listProjects();
        const active = getActiveProject();

        console.log(chalk.cyan(`  ${I.project}  Projects:\n`));

        // Global entry (always shown)
        const globalMark = !active ? chalk.cyan(` ${I.star} `) : '   ';
        const globalColor = !active ? chalk.cyan : chalk.white;
        const globalTasks = load(null);
        const globalDone = globalTasks.filter(t => t.done).length;
        console.log(globalColor(`  ${globalMark} global  ${chalk.gray(`(${globalDone}/${globalTasks.length} tasks)`)}`));

        // Project entries
        if (!projects.length) {
            console.log(chalk.gray(`\n  Belum ada project lain. Gunakan \`todo project create <name>\`.`));
        }
        projects.forEach(p => {
            const isActive = p === active;
            const mark = isActive ? chalk.cyan(` ${I.star} `) : '   ';
            const color = isActive ? chalk.cyan : chalk.white;
            const tasks = load(p);
            const done = tasks.filter(t => t.done).length;
            console.log(color(`  ${mark} ${p}  ${chalk.gray(`(${done}/${tasks.length} tasks)`)}`));
        });
        console.log('');
    });

proj
    .command('switch <name>')
    .description('Pindah ke project (gunakan "global" untuk tanpa project)')
    .action((name) => {
        printHeader();
        if (name === 'global') {
            setActiveProject(null);
            console.log(chalk.green(`  ${I.check}  Beralih ke task global.\n`));
            return;
        }

        const dir = getProjectDir(name);
        if (!fs.existsSync(dir)) {
            console.log(chalk.red(`  ${I.trash}  Project "${name}" tidak ditemukan.\n`));
            return;
        }
        setActiveProject(name);
        console.log(chalk.green(`  ${I.check}  Beralih ke project "${name}".\n`));
    });

proj
    .command('delete <name>')
    .description('Hapus project')
    .action(async (name) => {
        printHeader();
        const dir = getProjectDir(name);
        if (!fs.existsSync(dir)) {
            console.log(chalk.red(`  ${I.trash}  Project "${name}" tidak ditemukan.\n`));
            return;
        }

        const tasks = load(name);
        const ok = await confirm({
            message: `Hapus project "${name}" beserta ${tasks.length} task?`,
            default: false,
        });

        if (ok) {
            fs.rmSync(dir, { recursive: true, force: true });
            // If this was the active project, switch to global
            if (getActiveProject() === name) setActiveProject(null);
            console.log(chalk.red(`\n  ${I.trash}  Project "${name}" dihapus.\n`));
        } else {
            console.log(chalk.gray('\n  Dibatalkan.\n'));
        }
    });

proj
    .action(() => {
        printHeader();
        const active = getActiveProject();
        if (active) {
            const tasks = load(active);
            const done = tasks.filter(t => t.done).length;
            console.log(chalk.cyan(`  ${I.project}  Project aktif: ${chalk.bold(active)}  ${chalk.gray(`(${done}/${tasks.length} tasks)`)}\n`));
        } else {
            console.log(chalk.gray(`  ${I.project}  Tidak ada project aktif (menggunakan task global).\n`));
        }
    });

// ─── LIST ──────────────────────────────────────────
program
    .command('list').alias('ls')
    .description('Tampilkan semua task')
    .action(() => {
        printHeader();
        const tasks = load();

        if (!tasks.length) {
            console.log(chalk.yellow(`  ${I.list}  Belum ada task. Gunakan \`todo add\`.\n`));
            return;
        }

        const table = new Table({
            head: [chalk.cyan('#'), chalk.cyan(`${I.list}  Task`), chalk.cyan('Status')],
            colWidths: [5, 42, 14],
            style: { border: ['gray'] },
        });

        tasks.forEach((t, i) => {
            const status = t.done
                ? chalk.green(`${I.done}  Selesai`)
                : chalk.yellow(`${I.pending}  Pending`);
            const text = t.done ? chalk.strikethrough.gray(t.text) : chalk.white(t.text);
            table.push([chalk.cyan(i + 1), text, status]);
        });

        console.log(table.toString());

        const done = tasks.filter(t => t.done).length;
        console.log(chalk.gray(`\n  ${I.check}  ${done}/${tasks.length} task selesai\n`));
    });

// ─── ADD (Interaktif) ──────────────────────────────
program
    .command('add')
    .description('Tambah task baru')
    .action(async () => {
        printHeader();
        console.log(chalk.cyan(`  ${I.add}  Tambah Task Baru\n`));

        const text = await input({
            message: 'Nama task:',
            validate: (v) => v.trim() ? true : 'Task tidak boleh kosong!',
        });

        const tasks = load();
        tasks.push({ id: Date.now(), text: text.trim(), done: false });
        save(tasks);

        console.log(chalk.green(`\n  ${I.check}  "${text}" berhasil ditambahkan!\n`));
    });

// ─── DONE (Pilih dari list) ────────────────────────
program
    .command('done')
    .description('Tandai task selesai')
    .action(async () => {
        printHeader();
        const pending = load().filter(t => !t.done);

        if (!pending.length) {
            console.log(chalk.green(`  ${I.done}  Semua task sudah selesai!\n`));
            return;
        }

        const id = await select({
            message: `Pilih task yang selesai:`,
            choices: pending.map(t => ({
                name: `${I.pending}  ${t.text}`,
                value: t.id,
            })),
        });

        const all = load();
        const task = all.find(t => t.id === id);
        task.done = true;
        save(all);

        console.log(chalk.green(`\n  ${I.done}  "${task.text}" ditandai selesai!\n`));
    });

// ─── UNDONE (Ubah status) ────────────────────────
program
    .command('undone')
    .description('Ubah status task (Selesai/Pending)')
    .action(async () => {
        printHeader();
        const done = load().filter(t => t.done);

        if (!done.length) {
            console.log(chalk.yellow(`  ${I.list}  Tidak ada task.\n`));
            return;
        }

        const id = await select({
            message: `Pilih task yang dibatalkan:`,
            choices: done.map(t => ({
                name: `${I.done}  ${t.text}`,
                value: t.id,
            })),
        });

        const all = load();
        const task = all.find(t => t.id === id);
        task.done = false;
        save(all);

        console.log(chalk.green(`\n  ${I.check}  Status "${task.text}" diubah menjadi pending!\n`));
    });

// ─── REMOVE (Konfirmasi) ───────────────────────────
program
    .command('remove').alias('rm')
    .description('Hapus task')
    .action(async () => {
        printHeader();
        const tasks = load();

        if (!tasks.length) {
            console.log(chalk.yellow(`  Tidak ada task.\n`));
            return;
        }

        const id = await select({
            message: `Pilih task yang ingin dihapus:`,
            choices: tasks.map(t => ({
                name: `${t.done ? I.done : I.pending}  ${t.text}`,
                value: t.id,
            })),
        });

        const task = tasks.find(t => t.id === id);
        const ok = await confirm({ message: `Hapus "${task.text}"?`, default: false });

        if (ok) {
            save(tasks.filter(t => t.id !== id));
            console.log(chalk.red(`\n  ${I.trash}  "${task.text}" dihapus.\n`));
        } else {
            console.log(chalk.gray('\n  Dibatalkan.\n'));
        }
    });

// ─── ZEN MODE ───────────────────────────
program
    .command('zen')
    .description('Buka Zen Mode - focus session fullscreen')
    .action(async () => {
        const { execFileSync } = await import('child_process');
        const { fileURLToPath } = await import('url');
        execFileSync('npx', ['tsx', fileURLToPath(new URL('./zen.jsx', import.meta.url))], { stdio: 'inherit' });
    });


program.name('todo').description('CLI To-Do List').version('3.0.0');
program.parse();
