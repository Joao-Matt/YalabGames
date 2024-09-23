let playerInputDigits = ''; // Variable to store the player's entered digits
const maxRounds = 3; // Define the maximum number of rounds, in the future will be 20
let currentDigitLength = 2;  // Start with 2 digits
let generatedSequence = ''; // Global variable to store the generated sequence
let isTraining = true; // Flag to indicate if we're in the training phase
let trainingVar = 2; // Variable to control the number of training trials
let currentTrainingRound = 0; // Track the current training round
let startTime; // Timer start time for responses
let currentRound = 0; // Initialize the current round counter
let gameData = []; // Array to hold each round's data
let generatedNumbers = []; // Array to hold the random info from the game
let timeData = []; // Array to hold timing 
let stringLength = []; // Length of strings
let correctCount = 0;        // Counter for consecutive correct answers
let isGameEnded = false; // Flag to track if the game has ended
let results = []; // List to store the results


document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('startButton').addEventListener('click', function () {
        document.getElementById('welcomeScreen').style.display = 'none';
        document.getElementById('inputScreen').style.display = 'flex';
    });

    document.getElementById('checkButton').addEventListener('click', checkDSParticipant);
});

function showInputScreen() {
    document.getElementById('welcomeScreen').style.display = 'none';
    document.getElementById('inputScreen').style.display = 'block';
}

function showInstructions() {
    document.getElementById('inputScreen').style.display = 'none';
    document.getElementById('instructionsScreen').style.display = 'block';
}

async function checkDSParticipant() {
    const participantNumber = document.getElementById('participantNumber').value;
    const password = document.getElementById('password').value;
    const response = await fetch('/DS-check-participant', {
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

function startGame() {
    if (isGameEnded) return; // Prevent starting a new game if the game has ended

    // Hide the instructions screen
    const instructionsScreen = document.getElementById('instructionsScreen');
    if (instructionsScreen) {
        instructionsScreen.style.display = 'none';
    }

    // Show the game area and start the first round
    document.getElementById('gameArea').style.display = 'block';
    nextRound();  // Start the first round
}

function generateNumber() {
    let maxNumber = Math.pow(10, currentDigitLength) - 1;  // Max number for current digit length
    let minNumber = Math.pow(10, currentDigitLength - 1);  // Min number for current digit length
    return Math.floor(Math.random() * (maxNumber - minNumber + 1) + minNumber).toString();
}


function endTrainingMsg() {
    // Hide any previous screens
    document.getElementById('gameArea').style.display = 'none';

    // Show the "End of Training" message
    document.getElementById('endTrainingMessage').style.display = 'block';

    setTimeout(function () {
        // After 3 seconds, hide the "End of Training" message
        document.getElementById('endTrainingMessage').style.display = 'none';

        // Now we switch to game mode and start the game
        currentDigitLength = 2;  // Reset digit length for the actual game
        isTraining = false;  // Switch to game mode

        nextRound();  // Start the game after the training phase
    }, 3000);  // Show message for 3 seconds
}



function nextRound() {
    if (isGameEnded) return;

    if (isTraining && currentTrainingRound === trainingVar) {
        // End of training, show end training message
        endTrainingMsg();
    }
    
    // Training mode
    if (isTraining) {
        if (currentTrainingRound < trainingVar) {
            generatedSequence = generateNumber();
            if (generatedSequence === null) return;  // If we reached the end of training

            document.getElementById('digitDisplay').textContent = generatedSequence;
            document.getElementById('randomDigits').style.display = 'block';
            document.getElementById('gameArea').style.display = 'none';  // Hide keypad during number display

            currentTrainingRound++;
         
            // Show the random number for 2 seconds, then switch to keypad for input
            setTimeout(function () {
                document.getElementById('randomDigits').style.display = 'none';  // Hide the number
                document.getElementById('gameArea').style.display = 'flex';  // Show the keypad
                startTime = performance.now();  // Start timing input
            }, 2000);
        }
    } else {
        // Game mode
        if (currentRound <= maxRounds) {
            generatedSequence = generateNumber();
            document.getElementById('digitDisplay').textContent = generatedSequence;
            document.getElementById('randomDigits').style.display = 'block';
            document.getElementById('gameArea').style.display = 'none';  // Hide keypad during number display

            generatedNumbers.push(generatedSequence);
            stringLength.push(currentDigitLength);

            // Show the random number for 2 seconds, then switch to keypad for input
            setTimeout(function () {
                document.getElementById('randomDigits').style.display = 'none';  // Hide the number
                document.getElementById('gameArea').style.display = 'flex';  // Show the keypad
                startTime = performance.now();  // Start timing input
            }, 2000);

            currentRound++;
        } else {
            endGame();  // End game if max rounds are completed
        }
    }
}

    function enterPressed() {
        const endTime = performance.now();
        const elapsedTime = endTime - startTime;
        const displayArea = document.getElementById('displayArea');
        const enteredSequence = displayArea.textContent;
        const messageArea = document.getElementById('messageArea');
        const result = enteredSequence === generatedSequence ? 'Correct' : 'Incorrect';

        // Logic to handle correct and incorrect answers
        if (result === 'Correct') {
            messageArea.textContent = '!נכון';
            correctCount++;
            if (correctCount % 2 === 0) {
                currentDigitLength++;  // Increase the digit length after every 2 consecutive correct answers
            }
        } else {
            messageArea.textContent = '!טעות';
            correctCount = 0;  // Reset the correct count on incorrect answer
        }

        displayArea.textContent = '';  // Clear the display for the next round

        if (!isTraining) {
            // Store the entered sequence and elapsed time only if not in training mode
            gameData.push(enteredSequence);
            timeData.push(elapsedTime);

            // Store results
            results.push({
                playerInputDigits,
                round: currentRound,
                generatedSequence,
                sequenceLength: currentDigitLength,
                enteredSequence,
                elapsedTime,
                result
            });
        } 
        
        if (currentRound < maxRounds || (isTraining && currentTrainingRound < trainingVar)) {
            setTimeout(function () {
                messageArea.textContent = '';
                nextRound();
            }, 1000);
        } else {
            endGame();  // End the game when rounds are completed
        }
    }

function keyPressed(key) {
    const displayArea = document.getElementById('displayArea');
    displayArea.textContent += key;
}

function clearDisplay() {
    document.getElementById('displayArea').textContent = '';
}

function deleteLast() {
    const displayArea = document.getElementById('displayArea');
    displayArea.textContent = displayArea.textContent.slice(0, -1);
}

function endGame() {
    isGameEnded = true; 
    document.getElementById('messageArea').textContent = 'המשחק הושלם';
    console.log('המשחק הושלם');

    // Log the results for verification & Actions for ending the game
    console.log('Storing results:', results);
    localStorage.setItem('results', JSON.stringify(results));

    finishDSExperiment();
}

function finishDSExperiment() {
    saveDSResults().then(() => {
        markDSExperimentAsFinished()
        window.location.href = '/RTT_success';});
}

async function markDSExperimentAsFinished() {
    const participantNumber = localStorage.getItem('participantNumber');
    try {
        const response = await fetch('/DS_finish_experiment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participantNumber: participantNumber })
        });

        const data = await response.json();
        if (data.status !== 'success') {
            console.error('Failed to finish experiment');
            throw new Error('Failed to finish experiment');
        }
    } catch (error) {
        console.error('Error finishing experiment:', error);
        throw error;  // Ensure the error is caught in the finishDSExperiment function
    }
}

async function saveDSResults() {
    const participantNumber = localStorage.getItem('participantNumber');
    const dsResults = JSON.parse(localStorage.getItem('results')) || [];
    console.log('dsResults:', dsResults);
    
    const payload = {
        participantNumber: participantNumber,
        dsResults: dsResults
    };
    console.log('Request payload:', payload);

    try {
        const response = await fetch('/DS_save_results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

    console.log('Fetch response:', response);

    const data = await response.json();
    console.log('Response data:', data);

        if (data.status !== 'success') {
            console.error('Failed to save results');
            throw new Error('Failed to save results');
        }
    } catch (error) {
        console.error('Error saving results:', error);  // Added for error handling
        alert('Failed to save results. Please try again.');  // Added for error handling
        throw error;  // Re-throw the error to be caught in the finishDSExperiment function
    }
}
