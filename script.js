// Improved JS: Added timer extension, localStorage for high score, error handling, progress updates, and better UX (e.g., disable options after selection).
// All code is modular, commented, and uses const/let appropriately.
let quizData = [
    {
        question: "What does 'let' declare in JavaScript?",
        options: ["A constant value", "A changeable variable", "A function", "An array"],
        correct: 1
    },
    {
        question: "Which is the strict equality operator?",
        options: ["==", "=", "===", "!="],
        correct: 2
    },
    {
        question: "What is the purpose of a for loop?",
        options: ["To declare variables", "To repeat code a set number of times", "To handle events", "To style elements"],
        correct: 1
    },
    {
        question: "How do you select an element by ID in the DOM?",
        options: ["querySelector", "getElementById", "createElement", "appendChild"],
        correct: 1
    },
    {
        question: "What is the 'this' keyword in JavaScript?",
        options: ["A reference to the current function", "A reference to the current object", "A reference to the parent element", "A reference to the window object"],
        correct: 1
    },
    {
        question: "What is the purpose of 'async/await'?",
        options: ["To create loops", "To handle asynchronous operations", "To declare variables", "To style elements"],
        correct: 1
    },
    {
        question: "Which method adds an element to the end of an array?",
        options: ["unshift()", "pop()", "push()", "shift()"],
        correct: 2
    },
    {
        question: "What is closure in JavaScript?",
        options: ["A way to close browser windows", "A function with access to outer scope variables", "A method to end loops", "A type of array"],
        correct: 1
    },
    {
        question: "What is the purpose of JSON.stringify()?",
        options: ["To parse JSON", "To convert JavaScript to JSON string", "To create objects", "To validate JSON"],
        correct: 1
    },
    {
        question: "Which operator is used for type coercion?",
        options: ["===", "!==", "==", "="],
        correct: 2
    },
    {
        question: "What is event bubbling?",
        options: ["Creating new events", "Event propagation from child to parent", "Adding event listeners", "Removing events"],
        correct: 1
    },
    {
        question: "What is the purpose of preventDefault()?",
        options: ["Stop event bubbling", "Prevent default browser behavior", "Prevent JavaScript errors", "Stop event capturing"],
        correct: 1
    },
    {
        question: "What is a Promise in JavaScript?",
        options: ["A guarantee of future payment", "An object representing future completion of an async operation", "A type of function", "A variable declaration"],
        correct: 1
    },
    {
        question: "What does the map() method do?",
        options: ["Creates a new object", "Creates a new array with results of calling a function", "Modifies the original array", "Sorts array elements"],
        correct: 1
    },
    {
        question: "What is destructuring in JavaScript?",
        options: ["Breaking down code", "Unpack values from arrays or properties from objects", "Removing elements", "Creating objects"],
        correct: 1
    },
    {
        question: "What is the spread operator (...)?",
        options: ["Multiplication operator", "Expands elements", "Division operator", "Concatenation operator"],
        correct: 1
    },
    {
        question: "What is a callback function?",
        options: ["Main function", "Function passed as argument to another function", "Anonymous function", "Arrow function"],
        correct: 1
    },
    {
        question: "What is the purpose of setTimeout()?",
        options: ["Stop execution", "Execute code after a delay", "Clear timeout", "Create intervals"],
        correct: 1
    },
    {
        question: "What is the difference between null and undefined?",
        options: ["They are the same", "undefined is assigned, null is empty", "null is assigned, undefined is not assigned", "No difference"],
        correct: 2
    },
    {
        question: "What is the purpose of const?",
        options: ["Declare variable", "Declare constant", "Create function", "Create object"],
        correct: 1
    },
    

];



// let quizData = quizData_status;
let currentQuestion = 0;
let score = 0;
let totalQuestions = quizData.length;
let selectedAnswer = -1;
let timerInterval; // For per-question timer
let timeset = 10; // 10 seconds per question
let highScore = localStorage.getItem('jsQuizHighScore') || 0;
const docs = document.getElementById("quiz-container")
const bar = document.getElementById("timer-fill")
// WebAudio context: create once and resume on first user gesture (required on mobile)
let audioCtx = null;

function initAudioOnUserGesture() {
    if (audioCtx) return;
    // Do not create/resume until a user gesture occurs. Add short-lived listeners
    const resumeAudio = () => {
        try {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume().catch(() => {});
            }
        } catch (e) {
            // Some environments block audio - fail silently and log for debugging
            console.warn('WebAudio init failed:', e);
        }
        window.removeEventListener('touchstart', resumeAudio);
        window.removeEventListener('click', resumeAudio);
    };

    window.addEventListener('touchstart', resumeAudio, { once: true, passive: true });
    window.addEventListener('click', resumeAudio, { once: true, passive: true });
}

// Utility: Update progress bar
function updateProgress() {
    const progress = ((currentQuestion + 1) / totalQuestions) * 100;
    document.getElementById('progress-fill').style.width = progress + '%';
    document.getElementById('current-q').textContent = currentQuestion + 1;
    document.getElementById('total-q').textContent = totalQuestions;
}
// Extension: Start timer for each question
function startTimer() {
    let timeLeft = timeset;
    document.getElementById('timer-container').style.display = 'block';
    document.getElementById('timer-text').textContent = timeLeft;
    document.getElementById('timer-fill').style.width = '100%';
    // Add redshift only once at the start
    
    
    
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timer-text').textContent = timeLeft;
        document.getElementById('timer-fill').style.width = ((timeLeft / timeset * 100)) + '%';
        if (timeLeft === 3) {
            docs.classList.add("redshift");
            bar.classList.add("timer-fill-redshift");
        }
        if (timeLeft <= -1) {
            playSound(80, "sine");
            docs.classList.remove("redshift");
            bar.classList.remove("timer-fill-redshift");
            docs.classList.add("shaking");

            clearInterval(timerInterval);
            nextQuestion(); // Auto-advance on timeout
            
        }
    }, 1000);
}
// Extension: Clear timer
function clearTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        document.getElementById('timer-container').style.display = 'none';
        // Remove redshift if timer is cleared early
        docs.classList.remove("redshift");
        bar.classList.remove("timer-fill-redshift");
    }
}
function loadQuestion() {
try {
    const q = quizData[currentQuestion];
    if (!q) throw new Error('No question data');
    document.getElementById('question').textContent = q.question;
    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';

    q.options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.textContent = option;
        btn.classList.add('option');
        btn.setAttribute('aria-label', `Option: ${option}`);
        btn.onclick = () => selectOption(index);
        optionsDiv.appendChild(btn);
    });
    document.getElementById('next-btn').style.display = 'none';
    updateProgress();
    startTimer(); // Extension: Timer starts
} catch (error) {

    document.getElementById('question').innerHTML = '<p style="color: red;">Error loading question. Check console.</p>';
}

}
function selectOption(index) {
    if (selectedAnswer !== -1) return; // Prevent multiple selections

    selectedAnswer = index;
    clearTimer(); // Stop timer on answer

    // Remove any previous greenshift/redshift
    docs.classList.remove("greenshift", "redshift");
    bar.classList.remove("timer-fill-redshift");
    const options = document.querySelectorAll('.option');
    options.forEach((opt, i) => {
        opt.disabled = true; // Disable after selection
        opt.classList.remove('correct', 'incorrect');

        if (i === quizData[currentQuestion].correct) {
            playSound(350, "sine"); 
            docs.classList.remove("shaking");
            opt.classList.add('correct');
            if (index === i) {
                docs.classList.add("greenshift");
            }
        } else if (i === index && index !== quizData[currentQuestion].correct) {
            playSound(100, "sine");
            docs.classList.remove("shaking");
            opt.classList.add('incorrect');
        }
    });
    document.getElementById('next-btn').style.display = 'block';
}
function nextQuestion() {
    
    // Remove greenshift/redshift before moving to next question
    docs.classList.remove("greenshift", "redshift");
    if (selectedAnswer === quizData[currentQuestion].correct) {
        score++;
    }
    currentQuestion++;
    selectedAnswer = -1;
    if (currentQuestion < totalQuestions) {
        loadQuestion();
    } else {
        showScore();
    }
}
function showScore() {
clearTimer();
document.getElementById('question-container').style.display = 'none';
document.getElementById('score-container').style.display = 'block';
const percentage = Math.round((score / totalQuestions) * 100);
document.getElementById('score-circle-text').textContent = score;
document.getElementById('total-score').textContent = totalQuestions;
// document.getElementById('score').textContent = score;
// document.getElementById('total').textContent = totalQuestions;
let feedback = '';
if (percentage >= 80) feedback = "Outstanding! You're a JavaScript wizard. 🌟";
else if (percentage >= 60) feedback = "Well done! Keep practicing those concepts. 👍";
else feedback = "Good start—dive back into the lecture notes for a refresh. 📚";
document.getElementById('feedback').textContent = feedback;

// Always show high score
document.getElementById('high-score').style.display = 'block';
if (score > highScore) {

    highScore = score;
    localStorage.setItem('jsQuizHighScore', highScore);
}
document.getElementById('high-score-val').textContent = highScore;

}
function restartQuiz() {
    // Remove greenshift/redshift on restart
    playSound(440, "triangle");
    docs.classList.remove("greenshift", "redshift");
    currentQuestion = 0;
    score = 0;
    selectedAnswer = -1;
    quizData = [...quizData].sort(() => Math.random() - 0.5);

    document.getElementById('question-container').style.display = 'block';
    document.getElementById('score-container').style.display = 'none';
    document.getElementById('high-score').style.display = 'none';
    loadQuestion();
}
// Initialize on page load: set up audio unlock on first gesture and then load quiz
document.addEventListener('DOMContentLoaded', () => {
    initAudioOnUserGesture();
    loadQuestion();
});



function playSound(frequency, type, duration = 0.3) {
    try {
        // Ensure we have a shared AudioContext
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        // If context is suspended (mobile before user gesture), try to resume.
        if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }

        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = type || 'sine';
        oscillator.frequency.value = frequency;
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        const now = audioCtx.currentTime;
        gainNode.gain.setValueAtTime(1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

        oscillator.start(now);
        oscillator.stop(now + duration + 0.02);
    } catch (e) {
        // Fallback: log but don't throw — prevents breaking gameplay when audio can't start
        console.warn('playSound failed:', e);
    }

}

