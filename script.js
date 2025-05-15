// Grab elements from the DOM
const letterElement = document.getElementById('letter');
const wordInput = document.getElementById('word-input');
const submitBtn = document.getElementById('submit-btn');
const wordChainElement = document.getElementById('word-chain');
const scoreElement = document.getElementById('score');

// Game variables
let currentLetter = 'A';
let wordChain = [];
let score = 0;

// Function to generate a random letter
function getRandomLetter() {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWYZ";
    return letters[Math.floor(Math.random() * letters.length)];
}

// Update the prompt with a new random letter
function updatePrompt() {
    currentLetter = getRandomLetter();
    letterElement.textContent = currentLetter;
}

// Function to validate the word
function isValidWord(word) {
    // Simple validation: the word must start with the current letter
    return word.toUpperCase().startsWith(currentLetter);
}

// Handle word submission
submitBtn.addEventListener('click', () => {
    const word = wordInput.value.trim();

    if (word && isValidWord(word)) {
        wordChain.push(word);
        score++;
        updateGame();
    } else {
        alert("Invalid word! It must start with the letter: " + currentLetter);
    }

    wordInput.value = ''; // Clear input field
});

// Update the word chain and score
function updateGame() {
    // Update the word chain display
    wordChainElement.innerHTML = wordChain.map(word => `<li>${word}</li>`).join('');
   
    // Update the score
    scoreElement.textContent = score;

    // Update the starting letter for the next word
    currentLetter = wordChain[wordChain.length - 1].slice(-1).toUpperCase();
    letterElement.textContent = currentLetter;
}

// Start the game
updatePrompt();