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

// Storage
const DIR = path.join(process.env.HOME, '.local', 'share', 'todo-cli');
const FILE = path.join(DIR, 'tasks.json');
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

function load() {
    if (!fs.existsSync(FILE)) return [];
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
}
function save(tasks) {
    fs.writeFileSync(FILE, JSON.stringify(tasks, null, 2));
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
};

function printHeader() {
    console.log('');
    console.log(chalk.cyan.bold(`  ${I.header}  TODO CLI`));
    console.log(chalk.gray('  ──────────────────────────'));
    console.log('');
}

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



program.name('todo').description('CLI To-Do List').version('1.0.0');
program.parse();
