let playerName = "";
let currentMaxNumber = 5;
let missingNumber;
let currentStage = 1;
const totalStages = 5;

let timerInterval;
let initialTime = 30;
let timeLeft = 30;
let currentLevelKey = "beginner"; // 'beginner' | 'medium' | 'hard'

// هيكلية بيانات الإحصائيات
let playerStats = {
    beginner: { attempts: 0, bestTime: null },
    medium: { attempts: 0, bestTime: null },
    hard: { attempts: 0, bestTime: null }
};

// تحميل الإحصائيات المحفوظة عند فتح الصفحة
window.addEventListener('DOMContentLoaded', () => {
    const savedName = localStorage.getItem('missing_game_username');
    if (savedName) {
        playerName = savedName;
        document.getElementById('username-input').value = savedName;
        document.getElementById('sidebar-player-name').innerText = savedName;
    }

    const savedStats = localStorage.getItem('missing_game_stats');
    if (savedStats) {
        playerStats = JSON.parse(savedStats);
    }
    updateStatsUI();
});

// فتح وإغلاق السايدبار
function toggleSidebar() {
    const sidebar = document.getElementById('stats-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

// تحديث واجهة الإحصائيات
function updateStatsUI() {
    ['beginner', 'medium', 'hard'].forEach(lvl => {
        document.getElementById(`stat-attempts-${lvl}`).innerText = playerStats[lvl].attempts;
        const best = playerStats[lvl].bestTime;
        document.getElementById(`stat-best-${lvl}`).innerText = best !== null ? `${best}s` : '--';
    });
}

// تصفير الإحصائيات
function resetStats() {
    if (confirm("Are you sure you want to reset all your stats?")) {
        playerStats = {
            beginner: { attempts: 0, bestTime: null },
            medium: { attempts: 0, bestTime: null },
            hard: { attempts: 0, bestTime: null }
        };
        localStorage.setItem('missing_game_stats', JSON.stringify(playerStats));
        updateStatsUI();
    }
}

// تسجيل الدخول
function login() {
    const nameInput = document.getElementById('username-input').value.trim();
    if (nameInput === "") {
        alert("Please enter a username to start.");
        return;
    }
    playerName = nameInput;
    localStorage.setItem('missing_game_username', playerName);
    
    document.getElementById('player-name-display').innerText = playerName;
    document.getElementById('sidebar-player-name').innerText = playerName;
    
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('instructions-screen').style.display = 'block';
}

// بدء المستوى
function startGame(maxNumber, totalSeconds, levelKey) {
    currentMaxNumber = maxNumber;
    currentLevelKey = levelKey;
    initialTime = totalSeconds;
    timeLeft = totalSeconds;
    currentStage = 1;

    // تسجيل محاولة جديدة وحفظها
    playerStats[currentLevelKey].attempts += 1;
    localStorage.setItem('missing_game_stats', JSON.stringify(playerStats));
    updateStatsUI();
    
    document.getElementById('instructions-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    
    startTotalTimer();
    loadStage();
}

function backToMenu() {
    clearInterval(timerInterval);
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('instructions-screen').style.display = 'block';
}

function startTotalTimer() {
    clearInterval(timerInterval);
    document.getElementById('time-display').innerText = timeLeft;
    
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('time-display').innerText = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timeOutGameOver();
        }
    }, 1000);
}

function loadStage() {
    document.getElementById('result-message').innerText = '';
    document.getElementById('options-container').style.pointerEvents = 'auto';
    document.getElementById('current-stage-display').innerText = currentStage;

    let numbers = [];
    for (let i = 1; i <= currentMaxNumber; i++) {
        numbers.push(i);
    }

    const missingIndex = Math.floor(Math.random() * currentMaxNumber);
    missingNumber = numbers[missingIndex];
    numbers.splice(missingIndex, 1);

    numbers = numbers.sort(() => Math.random() - 0.5);

    const grid = document.getElementById('numbers-grid');
    grid.innerHTML = '';
    numbers.forEach(num => {
        const numDiv = document.createElement('div');
        numDiv.className = 'number-box';
        numDiv.innerText = num;
        grid.appendChild(numDiv);
    });

    generateOptions(missingNumber);
}

function generateOptions(correctAnswer) {
    let options = [correctAnswer];
    
    while (options.length < 3) {
        let randomWrong = Math.floor(Math.random() * currentMaxNumber) + 1;
        if (!options.includes(randomWrong)) {
            options.push(randomWrong);
        }
    }

    options = options.sort(() => Math.random() - 0.5);

    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => checkAnswer(opt, btn);
        optionsContainer.appendChild(btn);
    });
}

function checkAnswer(selected, buttonElement) {
    const messageDiv = document.getElementById('result-message');
    const optionsContainer = document.getElementById('options-container');

    optionsContainer.style.pointerEvents = 'none';

    if (selected === missingNumber) {
        messageDiv.innerText = 'Correct!';
        messageDiv.className = 'success';
        buttonElement.style.background = '#86efac';
        buttonElement.style.boxShadow = '0 4px 20px rgba(134, 239, 172, 0.4)';

        setTimeout(() => {
            if (currentStage < totalStages) {
                currentStage++;
                loadStage();
            } else {
                clearInterval(timerInterval);
                
                // حساب الوقت المستغرق
                const timeTaken = initialTime - timeLeft;
                const prevBest = playerStats[currentLevelKey].bestTime;

                // تحديث أفضل وقت إذا كان أول فوز أو حقق وقتاً أقل
                if (prevBest === null || timeTaken < prevBest) {
                    playerStats[currentLevelKey].bestTime = timeTaken;
                }

                localStorage.setItem('missing_game_stats', JSON.stringify(playerStats));
                updateStatsUI();

                messageDiv.innerText = `Level Completed in ${timeTaken}s! 🏆`;
                setTimeout(() => {
                    alert(`Awesome! You finished the level in ${timeTaken} seconds!`);
                    backToMenu();
                }, 800);
            }
        }, 400);

    } else {
        messageDiv.innerText = 'Wrong selection!';
        messageDiv.className = 'error';
        buttonElement.style.background = '#f87171';
        buttonElement.style.color = '#fff';
        
        setTimeout(() => {
            messageDiv.innerText = '';
            buttonElement.style.background = '#4ade80';
            buttonElement.style.color = '#052110';
            optionsContainer.style.pointerEvents = 'auto';
        }, 600);
    }
}

function timeOutGameOver() {
    document.getElementById('options-container').style.pointerEvents = 'none';
    const messageDiv = document.getElementById('result-message');
    messageDiv.innerText = 'Time expired!';
    messageDiv.className = 'warning';
    
    setTimeout(() => {
        alert("Time is up! You didn't finish all 5 stages in time. Try again!");
        backToMenu();
    }, 1000);
}