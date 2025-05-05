const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
const noteMap = {};
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let currentWordList = [];

const canvas = document.getElementById('waveCanvas');
canvas.width = window.innerWidth;
canvas.height = 120;

const ctx = canvas.getContext('2d');
const inputBox = document.getElementById("inputBox");
const prompt = document.getElementById("prompt");
const typedWords = document.getElementById("typedWords");
const playButton = document.getElementById("playButton");
const finalSentence = document.getElementById("finalSentence");

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

// 🎨 다양한 색을 위한 팔레트
const colorPalette = ['#FF6B6B', '#4ECDC4', '#556270', '#C7F464', '#FFCC5C', '#6A4C93', '#FF6F91', '#88D8B0'];

function getRandomColor() {
  return colorPalette[Math.floor(Math.random() * colorPalette.length)];
}

let currentStroke = '#4ECDC4';

function drawWaveform() {
  requestAnimationFrame(drawWaveform);
  analyser.getByteTimeDomainData(dataArray);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.lineWidth = 2;
  ctx.strokeStyle = currentStroke;
  ctx.beginPath();

  const sliceWidth = canvas.width / bufferLength;
  let x = 0;

  for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i] / 128.0;
    const y = (v * canvas.height) / 2; // 웨이브의 크기를 절반으로 줄임 (canvas.height / 2)

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);

    x += sliceWidth;
  }

  ctx.stroke();
}


drawWaveform();

const playNote = (frequency) => {
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

  oscillator.connect(gain);
  connectAnalyser(gain);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.3);

  currentStroke = getRandomColor(); // 🎨 매 음마다 선 색 바꾸기
};

inputBox.addEventListener('input', (e) => {
  const value = e.target.value.toLowerCase();
  const lastChar = value[value.length - 1];

  if (noteMap[lastChar]) {
    playNote(noteMap[lastChar]);
  }

  typedWords.textContent = value;
});

inputBox.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const value = inputBox.value.trim();
    if (value) {
      currentWordList.push(value);
      updateTypedWords();
      inputBox.value = '';
    }
  }
});

const updateTypedWords = () => {
  typedWords.textContent = currentWordList.join(' / ');
};

playButton.addEventListener('click', () => {
  if (currentWordList.length > 0) {
    playMelody();
  }
});

const playMelody = () => {
  finalSentence.textContent = "";
  let delay = 0;

  currentWordList.forEach((word, index) => {
    setTimeout(() => {
      finalSentence.textContent += word + " ";
      word.split("").forEach((char, i) => {
        setTimeout(() => {
          if (noteMap[char]) {
            playNote(noteMap[char]);
          }
        }, i * 300);
      });
    }, delay);
    delay += word.length * 300 + 500;
  });

  setTimeout(() => {
    typedWords.textContent = "";
    currentWordList = [];
  }, delay);
};
