let trials = 0;
let maxTrials = 0;
const practiceMaxTrials = 2;
let phase = 'phase1';
let participantNumber = 0;
let resultsSingular = [];
let resultsMultiple = [];
let startTime;
let preActivationTime;
let trialActive = false;
let isPractice = false;
const phase1Rounds = 4; // Example value for phase 1
const phase2Rounds = 6; // Example value for phase 2
const phase1Element = document.getElementById('phase1-rounds');
const phase2Element = document.getElementById('phase2-rounds');

document.addEventListener('DOMContentLoaded', function () {
    if (phase1Element) {
        phase1Element.textContent = phase1Rounds;
    }

    if (phase2Element) {
        phase2Element.textContent = phase2Rounds;
    }
});

async function checkParticipant() {
    const participantNumber = document.getElementById('participantNumber').value;
    const password = document.getElementById('password').value;
    const response = await fetch('/RTT-check-participant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantNumber: participantNumber, password: password })
    });

    const data = await response.json();
    if (data.status === 'success') {
        localStorage.setItem('participantNumber', participantNumber);
        window.location.href = '/RTT_instructions_1';
    } else {
        document.getElementById('message').innerText = data.message;
    }
}

function proceedToPractice1() {
    isPractice = true;
    window.location.href = '/RTT_practice_1';
}

function proceedToPractice2() {
    phase = 'phase2'
    isPractice = true;
    window.location.href = '/RTT_practice_2';
}

function proceedToPhase1() {
    isPractice = false;
    window.location.href = '/RTT_phase_1';
}

function proceedToPhase2() {
    phase = 'phase2'
    isPractice = false;
    window.location.href = '/RTT_phase_2';
}

function proceedToInstructions2() {
    window.location.href = '/RTT_instructions_2';
}


document.addEventListener('DOMContentLoaded', (event) => {
    const currentPath = window.location.pathname;
    if (currentPath.includes('RTT_practice_1') || currentPath.includes('RTT_phase_1')) {
        phase = 'phase1';
        if (!isPractice) {
            resultsSingular = JSON.parse(localStorage.getItem('phase1Results')) || [];
        }
        startTrials();
    } else if (currentPath.includes('RTT_practice_2') || currentPath.includes('RTT_phase_2')) {
        phase = 'phase2';
        if (!isPractice) {
            resultsMultiple = JSON.parse(localStorage.getItem('phase2Results')) || [];
        }
        startTrials();
    }
});


function startTrials() {
    trials = 0; // Reset trials for each phase
    const currentPath = window.location.pathname; // Define currentPath here
    if (currentPath.includes('RTT_practice_1') || currentPath.includes('RTT_practice_2')) {
        isPractice = true;
    }
    maxTrials = isPractice ? practiceMaxTrials : (phase === 'phase2' ? phase2Rounds : phase1Rounds);
    trialActive = false;
    console.log(`Practice set to ${isPractice}`)

    startNextTrial(); // Start the first trial
}

function startNextTrial() {
    if (trials < maxTrials) {
        console.log(`Starting trial ${trials + 1}`);
        preActivationTime = new Date().getTime(); // Start the pre-activation timer
        document.addEventListener('keydown', detectKeyPress);
        setTimeout(changeColor, getRandomInt(3000, 5000));
    } else {
        endTrials();
    }
}

function changeColor() {
    console.log('changeColor function called'); // Debugging log
    let squareId;

    if (phase === 'phase1') {
        squareId = 'square';
    } else {
        const squareIndex = getRandomInt(1, 4);
        squareId = `square${squareIndex}`;
    }

    console.log(`Selected squareId: ${squareId}`); // Debugging log
    resetAllSquares();

    const square = document.getElementById(squareId);
    if (!square) {
        console.error(`Element with id "${squareId}" not found`);
        return;
    }

    square.classList.remove('red-square');
    square.classList.add('green-square');
    startTime = new Date().getTime();
    trialActive = true;
    preActivationTime = null; // Reset the pre-activation timer

    console.log('Square color changed to green'); // Debugging log

    // Store the squareId globally for use in other functions
    window.currentSquareId = squareId;

    // Display the message for practice mode
    if (isPractice) {
        let message = '';
        if (phase === 'phase1') {
            message = 'כדי לשנות את הריבוע חזרה לאדום לחצו על מקש הרווח';
        } else {
            const keyMap = { 'square1': 'A', 'square2': 'S', 'square3': 'K', 'square4': 'L' };
            message = `${keyMap[squareId]} 'כדי לשנות את הריבוע חזרה לאדום, לחץ על המקש `;
        }
        document.getElementById('message').innerText = message;
    }
}


function detectKeyPress(event) {
    if (phase === 'phase1') {
        if (event.code === 'Space') {
            if (trialActive) {
                handleReaction();
            } else {
                handleInactiveTrial();
            }
        }
    } else {
        const validKeys = { 'square1': 'a', 'square2': 's', 'square3': 'k', 'square4': 'l' };
        if (Object.values(validKeys).includes(event.key.toLowerCase())) {
            const squareId = window.currentSquareId; // Use the globally stored squareId
            if (trialActive) {
                handleReaction(squareId, event.key.toLowerCase());
            } else {
                handleInactiveTrial(squareId, event.key.toLowerCase());
                resetSquare(squareId);
            }
        }
    }
}


function handleReaction(squareId = 'square', pressedKey = 'space') {
    const reactionTime = new Date().getTime() - startTime;
    const correct = checkCorrectKey(squareId, pressedKey);

    // Clear the message for practice mode
    if (isPractice) {
        document.getElementById('message').innerText = '';
    }
    
    if (!isPractice && phase === 'phase1') {
        resultsSingular.push({ participantNumber, round: trials + 1, trialActive, reactionTime });
    } else if (!isPractice && phase === 'phase2') {
        resultsMultiple.push({ participantNumber, round: trials + 1, squareId, pressedKey, reactionTime, trialActive, correct });
    }

    console.log(`Reaction: squareId=${squareId}, pressedKey=${pressedKey}, correct=${correct}`);
    if (phase === 'phase2') {
        // document.getElementById('message').innerText = `Reaction time: ${reactionTime} ms, ${correct ? 'Correct' : 'Wrong'}`;
    }

    trials++;
    resetSquare(squareId);
    trialActive = false;
    document.removeEventListener('keydown', detectKeyPress);

    setTimeout(startNextTrial, 2000);
}


function handleInactiveTrial(squareId = 'square', pressedKey = 'space') {
    const reactionTime = new Date().getTime() - preActivationTime;
    const correct = false;

    if (!isPractice && phase === 'phase1') {
        resultsSingular.push({ participantNumber, round: trials + 1, trialActive, reactionTime });
    } else if (!isPractice && phase === 'phase2') {
        resultsMultiple.push({ participantNumber, round: trials + 1, squareId, pressedKey, reactionTime, trialActive, correct });
    }

    console.log(`Inactive Trial: squareId=${squareId}, pressedKey=${pressedKey}, correct=${correct}`);
    // if (phase === 'phase2') {
    //     document.getElementById('message').innerText = `Reaction time: ${reactionTime} ms, Wrong`;
    // }

    trials++;
    trialActive = false;
    document.removeEventListener('keydown', detectKeyPress);

    setTimeout(startNextTrial, 2000);
}


function endTrials() {
    localStorage.setItem(`${phase}Results`, JSON.stringify(isPractice ? resultsSingular : resultsMultiple));

    if (phase === 'phase1' && !isPractice) {
        localStorage.setItem('phase1Results', JSON.stringify(resultsSingular));
    } else if (phase === 'phase2' && !isPractice) {
        localStorage.setItem('phase2Results', JSON.stringify(resultsMultiple));
    }

    const proceedButton = document.getElementById('proceedButton');
    const finishButton = document.getElementById('finishButton');
    const messageElement = document.getElementById('message');

    if (isPractice && phase === 'phase1' && proceedButton) {
        proceedButton.style.display = 'block';
        messageElement.innerText = `אימון שלב 1 הושלם. לחץ על "המשך לשלב 1" כאשר אתה מוכן.`;
    } else if (phase === 'phase1' && proceedButton) {
        proceedButton.style.display = 'block';
        messageElement.innerText = `שלב 1 הושלם. לחץ על "המשך להוראות שלב 2" כאשר אתה מוכן.`;
    } else if (isPractice && phase === 'phase2' && proceedButton) {
        proceedButton.style.display = 'block';
        messageElement.innerText = `אימון שלב 2 הושלם. לחץ על "המשך לשלב 2" כאשר אתה מוכן.`;
    } else if (phase === 'phase2' && finishButton) {
        finishButton.style.display = 'block';
        messageElement.innerText = `שלב 2 הושלם. לחץ על "סיום הניסוי" כדי לשמור את התוצאות.`;
    } else {
        console.error('כפתור "המשך" או "סיום" לא נמצא');
    }
}


function resetAllSquares() {
    for (let i = 1; i <= 4; i++) {
        const square = document.getElementById(`square${i}`);
        if (square) {
            square.classList.remove('green-square');
            square.classList.add('red-square');
        }
    }
    const square = document.getElementById('square');
    if (square) {
        square.classList.remove('green-square');
        square.classList.add('red-square');
    }
}

function resetSquare(squareId = 'square') {
    const square = document.getElementById(squareId);
    if (!square) {
        console.error(`Element with id "${squareId}" not found`);
        return;
    }
    square.classList.remove('green-square');
    square.classList.add('red-square');
}

function checkCorrectKey(squareId, pressedKey) {
    if (phase === 'phase1') {
        return pressedKey === 'space';
    } else {
        const validKeys = { 'square1': 'a', 'square2': 's', 'square3': 'k', 'square4': 'l' };
        // console.log(`Checking key: squareId=${squareId}, pressedKey=${pressedKey}, validKey=${validKeys[squareId]}`);
        return validKeys[squareId] === pressedKey;
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function finishExperiment() {
    saveResults().then(() => {
        markExperimentAsFinished().then(() => {
            window.location.href = '/RTT_success';
        }).catch((error) => {
            console.error('Failed to finish experiment', error);
        });
    }).catch((error) => {
        console.error('Failed to save results', error);
    });
}

async function markExperimentAsFinished() {
    const participantNumber = localStorage.getItem('participantNumber');
    try {
        const response = await fetch('/RTT_finish_experiment', {
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
        throw error;  // Ensure the error is caught in the finishExperiment function
    }
}


async function saveResults() {
    const participantNumber = localStorage.getItem('participantNumber');
    const phase1Results = JSON.parse(localStorage.getItem('phase1Results')) || [];
    const phase2Results = JSON.parse(localStorage.getItem('phase2Results')) || [];

    try {
        const response = await fetch('/RTT_save_results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                participantNumber: participantNumber,
                phase1Results: phase1Results,
                phase2Results: phase2Results
            })
        });

        const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const data = await response.json();
                    if (data.status !== 'success') {
                        console.error('Failed to save results');
                        throw new Error('Failed to save results');
                    }
                } else {
                    console.error('Unexpected response format:', contentType);
                    throw new Error('Server returned non-JSON response');
                }
    } catch (error) {
        console.error('Error saving results:', error);
        alert('Failed to save results. Please try again.');
        throw error;
    }
}