#!/usr/bin/env node
import React, { useState, useEffect } from 'react';
import { render, Box, Text, useInput, useStdout } from 'ink';
import { withFullScreen } from 'fullscreen-ink';
import fs from 'fs';
import path from 'path';
import figlet from 'figlet';

// ─── Storage (project-aware) ──────────────────────
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

function getTaskFile(projectName) {
  if (!projectName) return path.join(DIR, 'tasks.json');
  return path.join(PROJECTS_DIR, projectName, 'tasks.json');
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

function save(t, projectName) {
  const proj = projectName !== undefined ? projectName : getActiveProject();
  const file = getTaskFile(proj);
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(t, null, 2));
}

// ─── Nerd Font Icons ──────────────────────────────
const I = {
  done: '\uf058',   //  check-circle
  pending: '\ueabc',   //  circle
  zen: '\udb80\udf2a',   //  zen/leaf
  clock: '\udb82\udd54',   //  clock
  focus: '\uf135',   //  rocket
  pause: '\uf04c',   //  pause
  play: '\uf04b',   //  play
  reset: '\uebb0',   //  redo
  tasks: '\uf0ae',   //  tasks
  project: '\uf07c', //  folder-open
};

// ─── POMODORO TIMER ───────────────────────────────
const WORK_TIME = 25 * 60; // 25 menit
const BREAK_TIME = 5 * 60;  // 5 menit

function usePomodoro() {
  const [seconds, setSeconds] = useState(WORK_TIME);
  const [running, setRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessions, setSessions] = useState(0);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          setRunning(false);
          if (!isBreak) {
            setSessions(n => n + 1);
            setIsBreak(true);
            return BREAK_TIME;
          } else {
            setIsBreak(false);
            return WORK_TIME;
          }
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running, isBreak]);

  const toggle = () => setRunning(r => !r);
  const reset = () => { setRunning(false); setSeconds(isBreak ? BREAK_TIME : WORK_TIME); };
  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return { time: fmt(seconds), running, isBreak, sessions, toggle, reset, pct: 1 - seconds / (isBreak ? BREAK_TIME : WORK_TIME) };
}

// ─── CLOCK ────────────────────────────────────────
function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return {
    time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
    date: `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`,
  };
}

// ─── BIG CLOCK COMPONENT ─────────────────────────
function BigClock({ timeText }) {
  const [art, setArt] = useState('');
  useEffect(() => {
    figlet.text(timeText, { font: 'Slant' }, (err, data) => {
      if (!err) setArt(data);
    });
  }, [timeText]);

  return (
    <Box flexDirection="column" alignItems="center" justifyContent="center" paddingY={1}>
      <Text color="cyan">{art}</Text>
    </Box>
  );
}

// ─── PROGRESS BAR ─────────────────────────────────
function ProgressBar({ pct, width = 20 }) {
  const filled = Math.round(pct * width);
  const empty = width - filled;
  return (
    <Text>
      <Text color="cyan">{'█'.repeat(filled)}</Text>
      <Text color="gray">{'░'.repeat(empty)}</Text>
    </Text>
  );
}

// ─── MAIN ZEN APP ─────────────────────────────────
function ZenApp() {
  const { stdout } = useStdout();
  const W = stdout.columns || 100;
  const H = stdout.rows || 30;
  const colW = Math.floor((W - 4) / 2);

  // Project state
  const [activeProject, setActiveProjectState] = useState(getActiveProject());

  const [tasks, setTasks] = useState(load());
  const [cursor, setCursor] = useState(0);
  const [mode, setMode] = useState('normal'); // 'normal' | 'add'
  const [input, setInput] = useState('');
  const [message, setMessage] = useState('');
  const pomo = usePomodoro();
  const clock = useClock();

  const done = tasks.filter(t => t.done).length;
  const flash = (msg) => { setMessage(msg); setTimeout(() => setMessage(''), 2000); };

  // Switch active project and reload tasks
  const switchProject = (projName) => {
    setActiveProject(projName);
    setActiveProjectState(projName);
    setTasks(load(projName));
    setCursor(0);
    const label = projName || 'global';
    flash(`  ${I.project}  Switched to: ${label}`);
  };

  useInput((char, key) => {
    // ── Add mode ────────────────────────────────
    if (mode === 'add') {
      if (key.return) {
        if (input.trim()) {
          const updated = [...tasks, { id: Date.now(), text: input.trim(), done: false }];
          save(updated); setTasks(updated);
          flash(`  Added: "${input.trim()}"`);
        }
        setMode('normal'); setInput('');
      } else if (key.escape) {
        setMode('normal'); setInput('');
      } else if (key.backspace || key.delete) {
        setInput(i => i.slice(0, -1));
      } else if (char && !key.ctrl) {
        setInput(i => i + char);
      }
      return;
    }

    // ── Normal mode ─────────────────────────────
    if (key.upArrow) setCursor(c => Math.max(0, c - 1));
    if (key.downArrow) setCursor(c => Math.min(tasks.length - 1, c + 1));

    if (char === ' ') {
      const updated = tasks.map((t, i) => i === cursor ? { ...t, done: !t.done } : t);
      save(updated); setTasks(updated);
    }
    if (char === 'a') { setMode('add'); setInput(''); }
    if (char === 'd') {
      const t = tasks[cursor];
      const updated = tasks.filter((_, i) => i !== cursor);
      save(updated); setTasks(updated);
      setCursor(c => Math.min(c, updated.length - 1));
      flash(`  Deleted: "${t?.text}"`);
    }
    if (char === 'p') {
      // Cycle through projects: global → project1 → project2 → ... → global
      // Computed fresh each time to pick up newly created projects
      const currentProjects = [null, ...listProjects()];
      const idx = currentProjects.indexOf(activeProject);
      const next = currentProjects[(idx + 1) % currentProjects.length];
      switchProject(next);
    }
    if (char === 'f') pomo.toggle();
    if (char === 'r') pomo.reset();
    if (char === 'q' || (key.ctrl && char === 'c')) process.exit(0);
  });

  // Project label for header
  const projectLabel = activeProject
    ? `ZEN MODE  ${I.project} ${activeProject}`
    : 'ZEN MODE';

  // ─── RENDER ────────────────────────────────────
  return (
    <Box flexDirection="column" width={W} height={H} borderStyle="round" borderColor="cyan" padding={0}>

      {/* Header */}
      <Box justifyContent="space-between" paddingX={2} paddingY={0} borderStyle="single" borderColor="gray" borderTop={false} borderLeft={false} borderRight={false}>
        <Text color="cyan" bold>{I.zen}  {projectLabel}</Text>
        <Text color="gray">{clock.date}</Text>
      </Box>

      {/* Big Clock in Middle */}
      <Box flexGrow={1} flexDirection="column" alignItems="center" justifyContent="center">
        <BigClock timeText={clock.time} />
      </Box>

      {/* Body: Task List + Focus Panel */}
      <Box flexDirection="row" borderStyle="single" borderColor="gray" borderRight={false} borderLeft={false} borderBottom={false}>

        {/* Left: Task List */}
        <Box width={colW} flexDirection="column" paddingX={2} paddingTop={1} borderStyle="single" borderColor="gray" borderTop={false} borderBottom={false} borderLeft={false}>
          <Box marginBottom={1} justifyContent="space-between">
            <Text color="cyan" bold>{I.tasks}  TASKS</Text>
            <Text color="gray">{done}/{tasks.length} done</Text>
          </Box>

          <Box flexDirection="column" height={8}>
            {tasks.length === 0 && (
              <Text color="gray" dimColor>  No tasks yet. Press [A] to add.</Text>
            )}

            {tasks.slice(0, 6).map((t, i) => {
              const isSelected = i === cursor && mode !== 'add';
              return (
                <Box key={t.id}>
                  <Text
                    color={isSelected ? 'cyan' : t.done ? 'gray' : 'white'}
                    bold={isSelected}
                    dimColor={t.done}
                  >
                    {isSelected ? '▶ ' : '  '}
                    {t.done ? I.done : I.pending}
                    {'  '}
                    {t.done ? `${t.text}` : t.text}
                  </Text>
                </Box>
              );
            })}
            {tasks.length > 6 && <Text color="gray" dimColor>  ... and {tasks.length - 6} more</Text>}
          </Box>

          {/* Task Progress */}
          <Box marginTop={1} flexDirection="column">
            <ProgressBar pct={tasks.length ? done / tasks.length : 0} width={colW - 6} />
          </Box>
        </Box>

        {/* Right: Focus / Pomodoro Panel */}
        <Box width={colW} flexGrow={1} flexDirection="column" paddingX={2} paddingTop={1} alignItems="center" justifyContent="center">
          <Text color="cyan" bold>{I.focus}  POMODORO</Text>
          <Box marginTop={1} />

          <Box borderStyle="round" borderColor={pomo.isBreak ? 'green' : 'yellow'} paddingX={4} paddingY={0}>
            <Text color={pomo.isBreak ? 'green' : 'yellow'} bold>
              {pomo.time}
            </Text>
          </Box>

          <Box marginTop={1}>
            <Text color={pomo.running ? 'green' : 'gray'}>
              {pomo.running
                ? (pomo.isBreak ? '  ☕  BREAK TIME' : '  🔥  FOCUSING')
                : '  ⏸  PAUSED'}
            </Text>
          </Box>

          {/* Timer Progress */}
          <Box marginTop={1} flexDirection="column" alignItems="center">
            <ProgressBar pct={pomo.pct} width={colW - 8} />
          </Box>

          <Box marginTop={1}>
            <Text color="gray">Sessions completed: </Text>
            <Text color="cyan" bold>{pomo.sessions}</Text>
          </Box>

          <Box marginTop={1} gap={2}>
            <Text color={pomo.running ? 'red' : 'green'}>
              [{pomo.running ? I.pause : I.play}] [F] {pomo.running ? 'Pause' : 'Start'}
            </Text>
            <Text color="gray">[{I.reset}] [R] Reset</Text>
          </Box>
        </Box>

      </Box>

      {/* Footer */}
      <Box paddingX={2} borderStyle="single" borderColor="gray" borderBottom={false} borderLeft={false} borderRight={false}>
        {mode === 'add' ? (
          <Text color="cyan"> Add task: <Text color="white">{input}<Text color="cyan">█</Text></Text></Text>
        ) : message ? (
          <Text color="green">{message}</Text>
        ) : (
          <Text color="white" dimColor>
            [↑↓] Navigate  [Space] Toggle  [A] Add  [D] Delete  [P] Switch Project  [F] Focus  [R] Reset  [Q] Quit
          </Text>
        )}
      </Box>

    </Box>
  );
}

// ─── Launch ───────────────────────────────────────
withFullScreen(<ZenApp />).start();
