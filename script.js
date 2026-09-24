// Audio setup - custom keyboard sound
const typingAudio = new Audio('tecla.mp3');
typingAudio.volume = 0.5;
let audioInitialized = false;

// Initialize audio (must be called after user gesture)
function initAudio() {
  if (!audioInitialized) {
    audioInitialized = true;
    // Preload the audio file
    typingAudio.load();
  }
}

// Play keyboard sound for typing and intro
function playTypingSound() {
  if (!audioInitialized) return;
  try {
    // Clone to allow overlapping sounds during fast typing
    const sound = typingAudio.cloneNode();
    sound.volume = typingAudio.volume;
    sound.play().catch(() => {});
  } catch (e) {
    // Ignorar erros de áudio
  }
}

// DOM elements
const output = document.getElementById('output');
const inputLine = document.getElementById('input-line');
const screen = document.getElementById('screen');

// State
let currentInput = '';
let isBooting = true;
let hasStarted = false;

// Virtual file system for DIR command
const virtualFiles = [
  { name: 'SYSTEM', type: 'DIR', size: '', date: '15-01-26' },
  { name: 'LOGS', type: 'DIR', size: '', date: '15-01-26' },
  { name: 'CONFIG.SYS', type: 'FILE', size: '1.024', date: '15-01-26' },
  { name: 'AUTOEXEC.BAT', type: 'FILE', size: '512', date: '15-01-26' },
  { name: 'README.TXT', type: 'FILE', size: '2.048', date: '15-01-26' },
  { name: 'TERMINAL.EXE', type: 'FILE', size: '65.536', date: '15-01-26' }
];

// Boot sequence text (Portuguese)
const bootLines = [
  '',
  'BIOS DATA 15/01/2026 14:22:56 VER 1.02',
  'CPU: INTEL FODERON, VELOCIDADE: 3.6 GHZ',
  '640K RAM SISTEMA... OK',
  '',
  'INICIALIZANDO TERMINAL...',
  '',
  'CARREGANDO MÓDULOS PRINCIPAIS...',
  '[OK] VERIFICAÇÃO DE MEMÓRIA',
  '[OK] SUBSISTEMA DE ENTRADA',
  '[OK] DRIVER DE VÍDEO',
  '[OK] INTERFACE DE ÁUDIO',
  '',
  'TERMINAL PRONTO.',
  '',
  'DIGITE "HELP" PARA VER OS COMANDOS DISPONÍVEIS.',
  ''
];

// Type out text character by character
async function typeText(text, element, delay = 30) {
  for (let i = 0; i < text.length; i++) {
    element.textContent += text[i];
    if (text[i] !== ' ') {
      playTypingSound();
    }
    await sleep(delay);
  }
}

// Sleep helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Add line to output
function addLine(text) {
  const line = document.createElement('div');
  line.textContent = text;
  output.appendChild(line);
  scrollToBottom();
}

// Scroll to bottom
function scrollToBottom() {
  screen.scrollTop = screen.scrollHeight;
}

// Random flicker effect (JS-driven, sporadic)
function scheduleRandomFlicker() {
  const nextDelay = 3000 + Math.random() * 12000; // 3-15 seconds
  setTimeout(() => {
    if (!hasStarted) {
      scheduleRandomFlicker();
      return;
    }
    screen.style.animation = 'none';
    screen.offsetHeight; // force reflow
    screen.style.animation = 'crt-flicker 0.15s ease-in-out';
    setTimeout(() => {
      screen.style.animation = '';
      scheduleRandomFlicker();
    }, 150);
  }, nextDelay);
}

// Boot sequence
async function runBootSequence() {
  if (hasStarted) return;
  hasStarted = true;

  // Hide start message
  const startMsg = document.getElementById('start-message');
  if (startMsg) startMsg.style.display = 'none';

  initAudio();

  // Clear screen
  output.innerHTML = '';

  // Display boot text with typing effect
  for (const line of bootLines) {
    const div = document.createElement('div');
    div.className = 'boot-text';
    output.appendChild(div);
    await typeText(line, div, 20);
    await sleep(100);
  }

  await sleep(500);

  // Show input line
  inputLine.classList.remove('hidden');
  isBooting = false;

  // Start random flicker scheduler
  scheduleRandomFlicker();
}

// Start on first user interaction
function startOnInteraction() {
  if (hasStarted) return;
  runBootSequence();
}

// Listen for first interaction
document.addEventListener('click', startOnInteraction, { once: true });
document.addEventListener('keydown', startOnInteraction, { once: true });

// Handle keyboard input
document.addEventListener('keydown', function handleKeyPress(e) {
  if (isBooting) return;

  // Ignore modifier keys
  if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') {
    return;
  }

  // Handle special keys
  if (e.key === 'Enter') {
    processCommand(currentInput);
    currentInput = '';
    updateInputDisplay();
  } else if (e.key === 'Backspace') {
    currentInput = currentInput.slice(0, -1);
    updateInputDisplay();
  } else if (e.key.length === 1) {
    currentInput += e.key;
    updateInputDisplay();
    playTypingSound();
  }
});

// Update input display
function updateInputDisplay() {
  // Rebuild input line
  inputLine.innerHTML = '';
  const promptEl = document.createElement('span');
  promptEl.id = 'prompt';
  promptEl.textContent = 'C:\\TERMINAL>';
  inputLine.appendChild(promptEl);

  const textNode = document.createTextNode(currentInput);
  inputLine.appendChild(textNode);

  const newCursor = document.createElement('span');
  newCursor.id = 'cursor';
  newCursor.textContent = '_';
  inputLine.appendChild(newCursor);
}

// Process commands (names in English, messages in Portuguese)
function processCommand(cmd) {
  // Add the command line to output
  const cmdLine = document.createElement('div');
  cmdLine.innerHTML = '<span style="color: #00ff00;">C:\\TERMINAL&gt;</span>' + cmd;
  output.appendChild(cmdLine);

  // Process command
  const lowerCmd = cmd.toLowerCase().trim();

  switch (lowerCmd) {
    case 'help':
      addLine('');
      addLine('COMANDOS DISPONÍVEIS:');
      addLine('  HELP   - Mostrar esta mensagem de ajuda');
      addLine('  CLEAR  - Limpar a tela');
      addLine('  DIR    - Listar arquivos e diretórios');
      addLine('  DATE   - Mostrar data e hora atual');
      addLine('  VER    - Mostrar informações da versão');
      addLine('  EXIT   - Fechar o terminal');
      addLine('');
      break;

    case 'clear':
    case 'cls':
      output.innerHTML = '';
      break;

    case 'dir':
    case 'ls':
      addLine('');
      addLine(' Volume no disco C é TERMINAL');
      addLine(' Diretório de C:\\TERMINAL');
      addLine('');
      for (const f of virtualFiles) {
        const nameCol = f.name.padEnd(12);
        const typeCol = f.type === 'DIR' ? '<DIR>       ' : f.size.padStart(10) + ' ';
        addLine('  ' + f.date + '  ' + typeCol + nameCol);
      }
      addLine('');
      addLine('        ' + virtualFiles.filter(f => f.type === 'FILE').length + ' arquivo(s)');
      addLine('        ' + virtualFiles.filter(f => f.type === 'DIR').length + ' diretório(s)');
      addLine('');
      break;

    case 'date':
      addLine('');
      addLine('Data/hora atual: ' + new Date().toLocaleString('pt-BR'));
      addLine('');
      break;

    case 'ver':
      addLine('');
      addLine('TERMINAL ARG v1.0.0');
      addLine('MODO DE EMULAÇÃO MS-DOS');
      addLine('');
      break;

    case 'exit':
      addLine('');
      addLine('Até logo!');
      addLine('');
      setTimeout(function() {
        window.close();
      }, 1000);
      break;

    case '':
      break;

    default:
      addLine('');
      addLine('Comando ou nome de arquivo inválido: "' + cmd + '"');
      addLine('Digite "HELP" para ver os comandos disponíveis.');
      addLine('');
  }

  scrollToBottom();
}