const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
const noteMap = {};
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let currentWordList = [];

// Store the wave element
const wave = document.getElementById("wave");
const inputBox = document.getElementById("inputBox");
const prompt = document.getElementById("prompt");
const typedWords = document.getElementById("typedWords");
const playButton = document.getElementById("playButton");
const finalSentence = document.getElementById("finalSentence");

// Note frequencies for each letter (expanding the range to include a wider scale)
const baseFrequency = 261.63; // C4
const frequencyStep = 1.05946; // Ratio for each semitone (12th root of 2)

letters.forEach((char, i) => {
  noteMap[char] = baseFrequency * Math.pow(frequencyStep, i);
});

// Function to play sound when a key is pressed
const playNote = (frequency) => {
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

  oscillator.connect(gain);
  gain.connect(audioCtx.destination);

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.3);

  // Animate wave
  wave.style.opacity = 1;
  wave.style.transform = 'scaleY(1)';
  setTimeout(() => {
    wave.style.transform = 'scaleY(0.5)';
    wave.style.opacity = 0;
  }, 100);
};

// Function to handle typing and storing words
inputBox.addEventListener('input', (e) => {
  const value = e.target.value.toLowerCase();
  const lastChar = value[value.length - 1];

  if (noteMap[lastChar]) {
    playNote(noteMap[lastChar]);
  }

  typedWords.textContent = value; // Display typed word in real-time
});

// Event listener for the Enter key to store the typed word
inputBox.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault(); // Prevent form submission
    const value = inputBox.value.trim();

    if (value) {
      currentWordList.push(value); // Add typed word to the list
      updateTypedWords(); // Update the displayed words
      inputBox.value = ''; // Clear the input field
    }
  }
});

// Function to update the list of typed words
const updateTypedWords = () => {
  typedWords.textContent = currentWordList.join(' / ');
};

// Event listener for the Play button
playButton.addEventListener('click', () => {
  if (currentWordList.length > 0) {
    playMelody();
  }
});

// Function to play the melody with stored words
const playMelody = () => {
  finalSentence.textContent = "";  // Reset the final sentence
  let delay = 0;  // Initial delay

  currentWordList.forEach((word, index) => {
    setTimeout(() => {
      finalSentence.textContent += word + " ";
      word.split("").forEach((char, i) => {
        setTimeout(() => {
          if (noteMap[char]) {
            playNote(noteMap[char]);
          }
        }, i * 300); // Delay for each character in the word
      });
    }, delay);
    delay += word.length * 300 + 500; // Increase delay for the next word
  });

  // Clear the words after melody plays
  setTimeout(() => {
    typedWords.textContent = "";
    currentWordList = [];
  }, delay);
};
