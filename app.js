document.addEventListener('DOMContentLoaded', () => {

    // --- 1. STATE ---
    const state = {
        duration: 0,
        timerState: "idle", // "idle" | "running" | "paused" | "completed"  
        elapsedTime: 0,
        intervalId: null,
        logs: JSON.parse(localStorage.getItem('focusLogs')) || [],
        isLogVisible: false,
    };





    // --- 2. DOM ELEMENTS ---
    const inputGroupDiv = document.getElementById('input-group');
    const timerDisplay = document.getElementById('timerDisplay');
    const statusText = document.getElementById('statusText');
    const toggleBtn = document.getElementById('toggleButton');
    const resetButton = document.getElementById('theResetButton');
    const taskTitleInput = document.getElementById('taskTitleInput');
    const taskDisplay = document.getElementById('taskTitleDisplay');
    const radioContainer = document.getElementById('radio-group');
    const output = document.getElementById('output');
    const notesInput = document.getElementById('notes');
    const logTable = document.getElementById('logTableBody');
    const saveBtn = document.getElementById('saveReport');
    const timeRemainingDisplay = document.getElementById('timerRemaining');

    const inputWarning = document.getElementById('warning-section');
    const sessionMsg = document.getElementById('session-comp-sec');
    const totalFocusDisplay = document.getElementById("totalFocus");
    const totalSessionsDisplay = document.getElementById("totalSessions");
    const saveRepMsg = document.getElementById('save-report-section');
    const sesstionWriteMsg = document.querySelector("#session-write-msg");
    const currentStreakDisplay = document.getElementById("currentStreak");
    const bestStreakDisplay = document.getElementById("bestStreak");
    const logSection = document.getElementById('log-section');
    const showLogBtn = document.getElementById("show-log-btn");

    const noLogMsg = document.getElementById('no-log-message');
    const hasLogs = state.logs.length > 0;



    updateSummary();
    updateStreaks();



    // --- 3. HELPER FUNCTIONS ---


    function formatDate(dateString) {
        return new Date(dateString).toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function getSelectedDuration() {
        const radios = document.getElementsByName('duration');
        for (let radio of radios) {
            if (radio.checked) return parseInt(radio.value);
        }
        return null;
    }

    function updateDurationState(newValue) {
        if (!newValue) return;
        state.duration = newValue;
        if (output) output.innerText = `Duration set to: ${state.duration / 60} minutes`;
        updateUI(); // Refresh timer display immediately
    }

    function syncTaskTitle() {
        const goal = taskTitleInput.value.trim() || "Untitled Task";
        taskDisplay.textContent = "Goal: " + goal;
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    function updateSummary() {

        const totalMinutes = state.logs.reduce((sum, item) => {
            return sum + item.duration;
        }, 0);

        const totalSessions = state.logs.length;

        totalFocusDisplay.textContent = `⏱ Total Focus: ${totalMinutes} mins`;
        totalSessionsDisplay.textContent = `📘 Sessions Completed: ${totalSessions}`;
    }

    function updateUI() {
        const timeRemaining = state.duration - state.elapsedTime;
        timerDisplay.textContent = `${formatTime(timeRemaining)}`;



        // Button and Status Logic
        switch (state.timerState) {
            case 'running':
                statusText.textContent = "Status: Running";
                toggleBtn.textContent = "Pause Session";
                resetButton.classList.remove("hidden");
                radioContainer.classList.add('hidden');
                inputGroupDiv.classList.add('hidden')
                notesInput.disabled = true;
                timeRemainingDisplay.classList.remove("hidden");
                timerDisplay.classList.add('green');
                inputWarning.classList.add('hidden');
                break;
            case 'paused':
                statusText.textContent = "Status: Paused";
                toggleBtn.textContent = "Resume Session";

                break;
            case 'completed':
                statusText.textContent = "Status: Completed";
                toggleBtn.textContent = "Start Again";
                notesInput.disabled = false;
                timerDisplay.classList.remove('green');
                timerDisplay.classList.add('completed');
                // logSection.classList.remove('hidden'); 
                state.isLogVisible = true;
                showLogBtn.textContent = "Hide Log ↑"; // Using Unicode arrow

                break;
            case 'idle':
                statusText.textContent = "Status: Ready";
                toggleBtn.textContent = "Start Now";
                resetButton.classList.add("hidden");
                radioContainer.classList.remove('hidden');
                inputGroupDiv.classList.remove('hidden')
                break;
        }
    }


    function updateStreaks() {
        if (state.logs.length === 0) {
            currentStreakDisplay.textContent = "🔥 Current Streak: 0 days";
            bestStreakDisplay.textContent = "🏆 Best Streak: 0 days";
            return;
        }

        // Convert log dates into unique sorted dates
        const dates = [...new Set(state.logs.map(log => log.date))]
            .map(d => new Date(d))
            .sort((a, b) => a - b);

        let currentStreak = 1;
        let bestStreak = 1;
        let streak = 1;

        for (let i = 1; i < dates.length; i++) {

            const diff = (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);

            if (diff === 1) {
                streak++;
            } else {
                streak = 1;
            }

            if (streak > bestStreak) {
                bestStreak = streak;
            }
        }

        // Calculate current streak (from latest date)
        const today = new Date().toDateString();
        const lastLogDate = dates[dates.length - 1].toDateString();

        if (today === lastLogDate) {
            currentStreak = streak;
        } else {
            currentStreak = 0;
        }

        currentStreakDisplay.textContent = `🔥 Current Streak: ${currentStreak} days`;
        bestStreakDisplay.textContent = `🏆 Best Streak: ${bestStreak} days`;
    }

    
    function showhidelog() {
        //console.log(state.isLogVisible);
        if (state.isLogVisible) {
            logSection.classList.add('hidden');
            state.isLogVisible = false;
            showLogBtn.innerHTML = "Show Log &darr;"

        }
        else {
            logSection.classList.remove('hidden');
            renderLogs();
            state.isLogVisible = true;
            showLogBtn.innerHTML = "Hide Log &uarr;"
        }
    }


    // --- 4. CORE TIMER LOGIC ---

    function startTimer() {
        if (state.timerState === "running") return;

        state.timerState = 'running';
        syncTaskTitle(); // Only update title when starting

        state.intervalId = setInterval(() => {
            if (state.elapsedTime < state.duration) {
                state.elapsedTime++;
                updateUI();
            } else {
                completeTimer();
            }
        }, 1000);
        updateUI();
    }

    function pauseTimer() {
        state.timerState = "paused";
        clearInterval(state.intervalId);
        updateUI();
    }

    function completeTimer() {
        state.timerState = "completed";
        clearInterval(state.intervalId);
        state.intervalId = null;
        sessionMsg.textContent = "Congrats! Session Complete.";
        saveBtn.disabled = false;
        setTimeout(() => {
            sessionMsg.classList.add("hidden");
        }, 3000);
        sesstionWriteMsg.textContent = "Write Session Notes Now!";
        sesstionWriteMsg.style.setProperty('--pseudo-color', 'red');
        notesInput.focus();



        updateUI();
    }

    function resetTimer() {

        if (state.intervalId !== null) {
            clearInterval(state.intervalId);
        }

        state.timerState = "idle";
        state.elapsedTime = 0;
        state.intervalId = null;

        updateUI();
    }


    // --- 5. LOGGING LOGIC ---


    function deleteLog(id) {

        state.logs = state.logs.filter(item => item.id !== id);

        localStorage.setItem('focusLogs', JSON.stringify(state.logs));

        renderLogs();
        updateSummary();
        updateStreaks();
    }

    function renderLogs() {

        // logSection.classList.remove('hidden');
        logTable.innerHTML = "";

        if (!hasLogs) {
            console.log("if"+state.logs);
            noLogMsg.innerHTML = "No sessions yet. Start your first Bliss Hour."
        }

        else {
        console.log("else"+state.logs);
        noLogMsg.innerHTML = "";
        // ✅ Step 1: Ensure all logs have createdAt
        state.logs.forEach(log => {
            if (!log.createdAt) {
                log.createdAt = new Date().toISOString();
            }
        });

        // ✅ Step 2: Sort logs
        const sortedLogs = [...state.logs].sort((a, b) => {

            const dateDiff = new Date(b.createdAt) - new Date(a.createdAt);

            if (dateDiff === 0) {
                return b.id - a.id;
            }

            return dateDiff;
        });

        // ✅ Step 3: Render
        sortedLogs.forEach(item => {

            const formattedDate = formatDate(item.createdAt);
            const newRow = document.createElement('tr');

            newRow.innerHTML = `
                <td>${formattedDate}</td>
                <td>${item.goal}</td>
                <td>${item.duration}</td>
                <td>${item.note}</td>
                <td>
                    <button class="delete-btn" data-id="${item.id}">Delete</button>
                </td>
            `;

            newRow.querySelector('.delete-btn').addEventListener('click', () => {
                const result = confirm("Really, Delete this record?");
                if (result) {
                    deleteLog(item.id);
                }
            });

            logTable.appendChild(newRow);
        });

        }
    }


    function saveToLog() {
        const sessionDuration = getSelectedDuration();
        const newEntry = {
            id: Date.now(),
            // date: new Date().toLocaleDateString(),
            goal: taskTitleInput.value || "Untitled Task",
            duration: sessionDuration,
            note: notesInput.value || "N/A",
            createdAt: new Date().toISOString(),
        };

        // Add to our list
        state.logs.push(newEntry);

        // Save to browser memory (Local Storage) as a JSON string
        localStorage.setItem('focusLogs', JSON.stringify(state.logs));

        // Update the screen
        renderLogs();
        notesInput.value = "";
        updateSummary();
        updateStreaks();
        // alert("Saved to browser memory!");
        saveRepMsg.textContent = "Saved to browser memory!";
    }

    // --- 6. EVENT LISTENERS ---

    toggleBtn.addEventListener('click', () => {
        if (state.timerState === 'running') {
            pauseTimer();
        } else {
            // Check validation before starting
            const selectedValue = getSelectedDuration();
            if (!taskTitleInput.value.trim() || !selectedValue) {

                inputWarning.classList.remove('hidden');

                inputWarning.textContent = "Please enter a valid task title and choose the Session Duration"
                return;
            }
            if (state.timerState === 'idle') updateDurationState(selectedValue);
            startTimer();
        }
    });

    resetButton.addEventListener('click', resetTimer);

    radioContainer.addEventListener('change', (e) => {
        if (e.target.name === 'duration') {
            updateDurationState(parseInt(e.target.value));
        }
    });


    saveBtn.addEventListener('click', saveToLog);

    showLogBtn.addEventListener('click', showhidelog);


});