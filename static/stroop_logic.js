let trainingTrials = 2;
let rounds = 3;  // Set how many rounds you want for the test phase
let stroopResults = [];
let currentRound = 1;
let currentWord = '';
let currentColor = '';
let startTime;

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('startButton').addEventListener('click', function () {
        document.getElementById('welcomeScreen').style.display = 'none';
        document.getElementById('inputScreen').style.display = 'flex';
    });

    document.getElementById('checkButton').addEventListener('click', checkStroopParticipant);
});

function showInputScreen() {
    document.getElementById('welcomeScreen').style.display = 'none';
    document.getElementById('inputScreen').style.display = 'block';
}

// Retrieve participant number from the hidden input field
async function checkStroopParticipant() {
    const participantNumber = document.getElementById('participantNumber').value;
    const password = document.getElementById('password').value;
    const response = await fetch('/stroop-check-participant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantNumber: participantNumber, password: password })
    });

    const data = await response.json();
    if (data.status === 'success') {
        localStorage.setItem('participantNumber', participantNumber);
        playerInputDigits = participantNumber
        console.log('1st Participant Number:', playerInputDigits);
        showInstructions();  // Show the instructions screen
    } else {
        document.getElementById('message').innerText = data.message;
    }
}

// Start training phase
function startTraining() {
    document.getElementById('instructionsScreen').style.display = 'none'; // Hide instructions
    document.getElementById('trainingScreen').style.display = 'block';    // Show training screen
    nextTrainingWord();  // Start with the first word
}

const colorMap = {
    'אדום': 'red',
    'ירוק': 'green',
    'כחול': 'blue',
    'צהוב': 'yellow',
    'שחור': 'black'
};

function getRandomWordAndColor() {
    const words = ['אדום', 'ירוק', 'כחול', 'צהוב', 'שחור'];
    const word = words[Math.floor(Math.random() * words.length)];
    const isCongruent = Math.random() < 0.5;
    const color = isCongruent ? word : words[Math.floor(Math.random() * words.length)];

    // Return both Hebrew and CSS color
    return { word, hebrewColor: color, cssColor: colorMap[color] };
}

// Training Phase: Show the next word
function nextTrainingWord() {
    if (trainingTrials > 0) {
        const { word, hebrewColor, cssColor } = getRandomWordAndColor();  // Get random word and both color types
        currentWord = word;
        currentColor = hebrewColor;

        document.getElementById('wordDisplay').textContent = word;  // Set word
        document.getElementById('wordDisplay').style.color = cssColor;  // Set color (in English)

        // Show Hebrew color name in the message
        document.getElementById('trainingMessage').textContent = `הצבע הוא ${hebrewColor}. לחץ על מקש ${hebrewColor} המתאים.`;
        trainingTrials--;
    } else {
        startTest();  // Move to the test phase
    }
}

// Test Phase: Start the Stroop test
function startTest() {
    document.getElementById('trainingScreen').style.display = 'none';
    document.getElementById('testScreen').style.display = 'block';
    nextTestWord();
}

// Show the next test word
function nextTestWord() {
    if (currentRound <= rounds) {
        const { word, hebrewColor, cssColor } = getRandomWordAndColor();  // Get random word and both color types
        currentWord = word;
        currentColor = hebrewColor;
        document.getElementById('wordDisplayTest').textContent = word;
        document.getElementById('wordDisplayTest').style.color = cssColor;
        startTime = performance.now();  // Start timer for reaction time
        currentRound++;
    } else {
        saveResults();  // Save the results when rounds are finished
    }
}

// Capture key press and calculate response time
document.addEventListener('keydown', function(event) {
    const pressedKey = event.key.toLowerCase();
    const validKeys = ['א', 'י', 'כ', 'צ', 'ש'];  // Example valid keys for colors

    if (validKeys.includes(pressedKey)) {
        const endTime = performance.now();
        const reactionTime = endTime - startTime;
        const correct = (pressedKey === currentColor[0]);  // Compare first character of current color

        stroopResults.push({
            participantNumber: participantNumber,  // Use dynamic participant number
            round: currentRound,
            wordWritten: currentWord,
            wordColor: currentColor,
            keyPressed: pressedKey,
            correct: correct ? 'yes' : 'no',
            reactionTime: reactionTime  // Save reaction time
        });

        nextTestWord();  // Move to the next word after keypress
    }
});


// Save results
function saveResults() {
    fetch('/stroop-save-results', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            participantNumber: participantNumber,  // Use dynamic participant number
            stroopResults: stroopResults
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            alert('Results saved successfully!');
        } else {
            alert('Error saving results.');
        }
    });
}
