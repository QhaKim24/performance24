const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
const noteMap = {};
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let lyricsList = [];
let loopIndex = 0;
let loopInterval;
let typingTimeout;
let isMuted = false;

const canvas = document.getElementById('waveCanvas');
canvas.width = window.innerWidth;
canvas.height = 200;
const ctx = canvas.getContext('2d');

const inputBox = document.getElementById("inputBox");
const addButton = document.getElementById("addButton");
const lyricsDisplay = document.getElementById("lyricsDisplay");
const wordFlow = document.getElementById("wordFlow");

const analyser = audioCtx.createAnalyser();
analyser.fftSize = 1024;
const bufferLength = analyser.fftSize;
const dataArray = new Uint8Array(bufferLength);

const baseFrequency = 261.63;
const frequencyStep = 1.05946;
letters.forEach((char, i) => {
  noteMap[char] = baseFrequency * Math.pow(frequencyStep, i);
});

function connectAnalyser(gain) {
  gain.connect(analyser);
  analyser.connect(audioCtx.destination);
}

function drawWaveform() {
  requestAnimationFrame(drawWaveform);
  analyser.getByteTimeDomainData(dataArray);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#4ECDC4';
  ctx.beginPath();

  const sliceWidth = canvas.width / bufferLength;
  let x = 0;
  for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i] / 128.0;
    const y = (v * canvas.height) / 2;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    x += sliceWidth;
  }
  ctx.stroke();
}
drawWaveform();

function playNote(freq) {
  if (isMuted) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
  osc.connect(gain);
  gain.connect(analyser);
  analyser.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.3);
}

inputBox.addEventListener('input', (e) => {
  const lastChar = e.target.value.slice(-1).toLowerCase();
  if (noteMap[lastChar]) playNote(noteMap[lastChar]);
  if (loopInterval) clearInterval(loopInterval);
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(restartLoop, 2000);
});

inputBox.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') e.preventDefault();
});

addButton.addEventListener('click', () => {
  const value = inputBox.value.trim();
  if (!value) return;
  lyricsList.push(value);
  inputBox.value = '';
  updateWordFlowDisplay();
  restartLoop();
});

function updateLyricsDisplay() {
  lyricsDisplay.innerHTML = '';
  lyricsList.forEach((word, i) => {
    const line = document.createElement('div');
    line.className = 'lyrics-line';
    const index = lyricsList.length - i;
    line.style.opacity = index > 8 ? 0 : index > 5 ? 0.3 : 1;
    line.textContent = word;
    lyricsDisplay.appendChild(line);
  });
}

function updateWordFlowDisplay() {
  wordFlow.innerHTML = '';
  const maxVisible = 20;

  lyricsList.forEach((word, i) => {
    const span = document.createElement('span');
    span.className = 'word-item';
    span.textContent = word;

    const positionFromEnd = lyricsList.length - 1 - i;
    if (positionFromEnd >= maxVisible) {
      span.style.opacity = 0;
    } else if (positionFromEnd >= maxVisible - 5) {
      span.style.opacity = 0.3;
    } else {
      span.style.opacity = 1;
    }

    wordFlow.appendChild(span);
  });
  scrollWordFlowToBottom();
}

function scrollWordFlowToBottom() {
  wordFlow.scrollTop = wordFlow.scrollHeight;
}

function playWord(word) {
  word.split('').forEach((char, i) => {
    setTimeout(() => {
      if (noteMap[char]) playNote(noteMap[char]);
    }, i * 300);
  });
}

function restartLoop() {
  if (loopInterval) clearInterval(loopInterval);
  loopIndex = 0;
  if (lyricsList.length > 0) startLoop();
}

function startLoop() {
  loopInterval = setInterval(() => {
    const word = lyricsList[loopIndex];
    playWord(word);
    loopIndex = (loopIndex + 1) % lyricsList.length;
  }, getWordDuration(lyricsList[loopIndex]) + 500);
}

function getWordDuration(word) {
  return word.length * 300;
}



const clearButton = document.getElementById("clearButton");
if (clearButton) {
  clearButton.addEventListener("click", () => {
    lyricsList = [];
    wordFlow.innerHTML = '';
    clearInterval(loopInterval);
  });
}

const muteButton = document.getElementById("muteButton");
if (muteButton) {
  muteButton.addEventListener("click", () => {
    isMuted = !isMuted;
    muteButton.textContent = isMuted ? "🔇" : "🔊";
  });
}


document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".preset-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const words = btn.dataset.preset.split(" ");
      lyricsList.push(...words);
      updateWordFlowDisplay();
      restartLoop();
    });
  });

  document.querySelectorAll(".mode-btn").forEach(button => {
    button.addEventListener("click", () => {
      const mode = button.dataset.mode;
      document.body.className = '';
      if (mode !== "default") {
        document.body.classList.add(`${mode}-mode`);
      }
    });
  });
});