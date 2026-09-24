// ── Audio Engine (Web Audio API) ──
const AudioEngine = (() => {
  let ctx = null;

  function init() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  function playKeySound() {
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Randomize pitch slightly for realism
    osc.type = 'square';
    osc.frequency.value = 600 + Math.random() * 200;

    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }

  return { init, playKeySound };
})();

// ── Terminal Engine ──
const output = document.getElementById('output');
const input = document.getElementById('cmd-input');
const clock = document.getElementById('clock');
const terminal = document.getElementById('terminal');

// Initialize audio on first interaction
document.addEventListener('click', () => AudioEngine.init(), { once: true });
document.addEventListener('keydown', () => AudioEngine.init(), { once: true });

// ── Clock ──
setInterval(() => {
  const now = new Date();
  clock.textContent = now.toLocaleTimeString('pt-BR', { hour12: false });
}, 1000);

// ── Typewriter engine ──
let typing = false;
const typeQueue = [];

function printLine(text, cls = '', delay = 20) {
  return new Promise(resolve => {
    typeQueue.push({ text, cls, delay, resolve });
    if (!typing) processQueue();
  });
}

async function processQueue() {
  typing = true;
  while (typeQueue.length > 0) {
    const { text, cls, delay, resolve } = typeQueue.shift();
    const div = document.createElement('div');
    div.className = 'line' + (cls ? ' ' + cls : '');
    output.appendChild(div);

    for (let i = 0; i < text.length; i++) {
      div.textContent += text[i];
      scrollToBottom();
      // Play sound only for visible characters during typewriter effect
      if (text[i] !== ' ') AudioEngine.playKeySound();
      await sleep(delay);
    }
    resolve();
  }
  typing = false;
  scrollToBottom();
}

function printInstant(text, cls = '') {
  const div = document.createElement('div');
  div.className = 'line' + (cls ? ' ' + cls : '');
  div.textContent = text;
  output.appendChild(div);
  scrollToBottom();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function scrollToBottom() {
  terminal.scrollTop = terminal.scrollHeight;
}

// ── Boot sequence ──
async function boot() {
  input.disabled = true;
  await printLine('SYSTEM INITIALIZING...', 'system', 15);
  await sleep(300);
  await printLine('LOADING KERNEL.............. OK', 'system', 10);
  await sleep(200);
  await printLine('MOUNTING VIRTUAL DRIVE...... OK', 'system', 10);
  await sleep(400);
  await printLine('');
  await printLine('READY.', 'success');
  await printLine('Type HELP for available commands.');
  await printLine('');
  input.disabled = false;
  input.focus();
}

// ── Command system ──
const commands = {};

commands.help = async () => {
  await printLine('AVAILABLE COMMANDS:', 'system');
  await printLine('  HELP    - Show this message');
  await printLine('  DIR     - List directory contents');
  await printLine('  CLS     - Clear terminal screen');
  await printLine('  DATE    - Show system date/time');
  await printLine('  EXIT    - Terminate session');
};

commands.cls = async () => {
  output.innerHTML = '';
};

commands.dir = async () => {
  await printLine(' Directory of C:\\', 'system');
  await printLine(' ─────────────────────────────────────', 'system');
  await printLine(' .           <DIR>        [SYSTEM]');
  await printLine(' ..          <DIR>        [SYSTEM]');
  await printLine(' CONFIG.SYS  0.4 KB       [READ]');
  await printLine(' AUTOEXEC.BAT 0.2 KB      [READ]');
  await printLine(' ─────────────────────────────────────', 'system');
  await printLine(' 4 file(s)  0 bytes free', 'system');
};

commands.date = async () => {
  const now = new Date();
  await printLine(`SYSTEM TIME: ${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}`, 'system');
};

commands.exit = async () => {
  await printLine('SESSION TERMINATED.', 'error');
  await sleep(500);
  input.disabled = true;
};

// ── Input handler ──
input.addEventListener('keydown', async (e) => {
  // Play key sound on user input
  AudioEngine.playKeySound();

  if (e.key === 'Enter') {
    const raw = input.value.trim();
    input.value = '';
    if (!raw) return;

    printInstant(`C:\\> ${raw}`);

    const parts = raw.split(/\s+/);
    const cmd = parts[0].toLowerCase();

    if (commands[cmd]) {
      input.disabled = true;
      await commands[cmd]();
      input.disabled = false;
      input.focus();
    } else {
      await printLine(`Bad command or filename: ${parts[0]}`, 'error');
    }
  }
});

// Keep focus on input
document.addEventListener('click', () => {
  if (!input.disabled) input.focus();
});

// ── Start ──
boot();