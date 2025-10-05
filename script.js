// Pomodoro Timer
const timerDisplay = document.getElementById("timerDisplay");
const timerMode = document.getElementById("timerMode");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const progressCircle = document.getElementById("progressCircle");

// Timer settings
const WORK_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;

// Load saved timer state or use defaults
let savedState = null;
try {
    const saved = sessionStorage.getItem('timerState');
    if (saved) savedState = JSON.parse(saved);
} catch (e) {}

let timeLeft = savedState?.timeLeft ?? WORK_TIME;
let totalTime = savedState?.totalTime ?? WORK_TIME;
let timerInterval = null;
let isRunning = savedState?.isRunning ?? false;
let isWorkMode = savedState?.isWorkMode ?? true;

// Circle calculations
const radius = 85;
const circumference = 2 * Math.PI * radius;

// Create audio notifications - different sounds for work and break
function playWorkSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 880;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.log('Audio not supported');
    }
}

function playBreakSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        [523, 392].forEach((freq, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = freq;
            oscillator.type = 'sine';
            
            const startTime = audioContext.currentTime + (index * 0.3);
            gainNode.gain.setValueAtTime(0.3, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + 0.4);
        });
    } catch (e) {
        console.log('Audio not supported');
    }
}

// Set up circle
progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
progressCircle.style.strokeDashoffset = '0';

// Save timer state
function saveTimerState() {
    try {
        sessionStorage.setItem('timerState', JSON.stringify({
            timeLeft,
            totalTime,
            isWorkMode,
            isRunning
        }));
    } catch (e) {}
}

// Update display
function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Update progress
function updateProgress() {
    const progressPercent = timeLeft / totalTime;
    const offset = circumference * progressPercent;
    progressCircle.style.strokeDashoffset = offset;
}

// Update mode
function updateMode() {
    if (isWorkMode) {
        timerMode.textContent = "WORK TIME";
        timerMode.classList.remove("break-mode");
        progressCircle.style.stroke = "#5a5959ff";
    } else {
        timerMode.textContent = "BREAK TIME";
        timerMode.classList.add("break-mode");
        progressCircle.style.stroke = "#5a5959ff";
    }
}

// Manual mode switch (when user clicks the mode button)
function manualSwitchMode() {
    // Pause the timer if running
    if (isRunning) {
        clearInterval(timerInterval);
        isRunning = false;
    }
    
    // Switch mode
    isWorkMode = !isWorkMode;
    
    if (isWorkMode) {
        timeLeft = WORK_TIME;
        totalTime = WORK_TIME;
        playWorkSound();
    } else {
        timeLeft = BREAK_TIME;
        totalTime = BREAK_TIME;
        playBreakSound();
    }
    
    updateMode();
    updateDisplay();
    updateProgress();
    saveTimerState();
}

// Add click event to mode button
timerMode.addEventListener("click", manualSwitchMode);
timerMode.style.cursor = "pointer"; // Make it look clickable

// Switch mode
function switchMode() {
    isWorkMode = !isWorkMode;
    
    if (isWorkMode) {
        timeLeft = WORK_TIME;
        totalTime = WORK_TIME;
        playWorkSound();
    } else {
        timeLeft = BREAK_TIME;
        totalTime = BREAK_TIME;
        playBreakSound();
    }
    
    updateMode();
    updateDisplay();
    updateProgress();
    saveTimerState();
}

// Start button
startBtn.addEventListener("click", function() {
    if (!isRunning) {
        isRunning = true;
        timerInterval = setInterval(function() {
            if (timeLeft > 0) {
                timeLeft--;
                updateDisplay();
                updateProgress();
                saveTimerState();
            } else {
                switchMode();
            }
        }, 1000);
        saveTimerState();
    }
});

// Pause button
pauseBtn.addEventListener("click", function() {
    if (isRunning) {
        clearInterval(timerInterval);
        isRunning = false;
        saveTimerState();
    }
});

// Reset button
resetBtn.addEventListener("click", function() {
    clearInterval(timerInterval);
    isRunning = false;
    
    // Keep the current mode, just reset the time
    if (isWorkMode) {
        timeLeft = WORK_TIME;
        totalTime = WORK_TIME;
    } else {
        timeLeft = BREAK_TIME;
        totalTime = BREAK_TIME;
    }
    
    updateMode();
    updateDisplay();
    updateProgress();
    saveTimerState();
});

// Initialize
updateMode();
updateDisplay();
updateProgress();

// Resume timer if it was running
if (isRunning) {
    timerInterval = setInterval(function() {
        if (timeLeft > 0) {
            timeLeft--;
            updateDisplay();
            updateProgress();
            saveTimerState();
        } else {
            switchMode();
        }
    }, 1000);
}

// ==================== TASK LIST ====================

const inputFeild = document.getElementById("input");
let taskList = document.getElementById("tasker");

// Load tasks from session storage
function loadTasks() {
    try {
        const savedTasks = sessionStorage.getItem('tasks');
        if (savedTasks) {
            const tasks = JSON.parse(savedTasks);
            tasks.forEach(task => {
                addTaskToDOM(task.text, task.completed);
            });
        }
    } catch (e) {}
}

// Save tasks to session storage
function saveTasks() {
    try {
        const tasks = [];
        const taskItems = taskList.querySelectorAll('.task-item');
        taskItems.forEach(item => {
            const text = item.querySelector('.task-text').textContent;
            const completed = item.querySelector('.task-checkbox').checked;
            tasks.push({ text, completed });
        });
        sessionStorage.setItem('tasks', JSON.stringify(tasks));
    } catch (e) {}
}

inputFeild.addEventListener("keypress", function(event){
    if (event.key === "Enter"){
        event.preventDefault();

        const inputValue = inputFeild.value.trim();

        if (inputValue !== ""){
            addTaskToDOM(inputValue, false);
            saveTasks();
            inputFeild.value = "";
        }
    }
});

function addTaskToDOM(taskText, isCompleted = false) {
    const li = document.createElement("li");
    li.className = "task-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";
    checkbox.checked = isCompleted;

    const taskSpan = document.createElement("span");
    taskSpan.textContent = taskText;
    taskSpan.className = "task-text";
    if (isCompleted) {
        taskSpan.classList.add("completed");
    }

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "×";
    deleteBtn.className = "delete-btn";

    checkbox.addEventListener("change", function(){
        if (checkbox.checked) {
            taskSpan.classList.add("completed");
        } else {
            taskSpan.classList.remove("completed");
        }
        saveTasks();
    });

    deleteBtn.addEventListener("click", function(){
        li.remove();
        saveTasks();
    });

    li.appendChild(checkbox);
    li.appendChild(taskSpan);
    li.appendChild(deleteBtn);

    taskList.insertBefore(li, taskList.firstChild);
}

clearAllBtn.addEventListener("click", function(){
    taskList.innerHTML = "";
    saveTasks();
});

loadTasks();