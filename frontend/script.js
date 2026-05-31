/* --- Intersection Observer System for On-Scroll Reveal Effects --- */
const revealElements = document.querySelectorAll('.reveal');
const observerOptions = {
    root: null,
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px"
};

const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

revealElements.forEach(el => revealObserver.observe(el));

/* --- Global Application State --- */
let userProfile = null;
let chatHistory = [];
let isGenerating = false;
let isChatting = false;

/* --- Generate FutureMe Main Flow --- */
async function generateFutureMe(event) {
    event.preventDefault();
    if (isGenerating) return;

    // Element Extractions
    const name = document.getElementById('userName').value.trim();
    const age = document.getElementById('userAge').value.trim();
    const goal = document.getElementById('userGoal').value.trim();
    const struggle = document.getElementById('userStruggle').value.trim();
    const timeline = document.getElementById('userTimeline').value.trim();
    const tone = document.getElementById('futureTone').value;

    const errorBanner = document.getElementById('errorBanner');
    const errorText = document.getElementById('errorText');
    const formElement = document.getElementById('futureForm');
    const loadingState = document.getElementById('loadingState');
    const loadingPhrase = document.getElementById('loadingPhrase');
    const outputContainer = document.getElementById('outputContainer');
    const generateBtn = document.getElementById('generateBtn');

    // Validation Check
    if (!name || !age || !goal || !struggle || !timeline || !tone) {
        errorText.innerText = "Please complete all configuration parameters to align the connection.";
        errorBanner.style.display = 'flex';
        return;
    }
    errorBanner.style.display = 'none';

    // State lock & UI swap
    isGenerating = true;
    generateBtn.disabled = true;
    formElement.style.display = 'none';
    outputContainer.style.display = 'none';
    loadingState.style.display = 'block';

    // Premium Animated Loading Phrases Loop
    const loadingSequences = [
        "Isolating present temporal data nodes...",
        "Running heuristic behavioral projections...",
        "Constructing future identity parameters...",
        "Formulating temporal reply vectors...",
        "Synchronizing timelines... almost connected"
    ];
    
    let phraseIndex = 0;
    loadingPhrase.innerText = loadingSequences[0];
    const phraseInterval = setInterval(() => {
        phraseIndex++;
        if (phraseIndex < loadingSequences.length) {
            loadingPhrase.innerText = loadingSequences[phraseIndex];
        }
    }, 600);

    // Prepare Request Body
    const requestPayload = {
        name,
        age,
        goal,
        struggle,
        oneYearVision: timeline,
        tone
    };

    try {
        // Send Request to Backend Express Server (running on port 5000)
        const response = await fetch('/api/generate-futureme', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestPayload)
        });

        const result = await response.json();
        clearInterval(phraseInterval);

        if (!response.ok || !result.success) {
            throw new Error(result.error || "FutureMe could not respond right now. Try again.");
        }

        const data = result.data;

        // Render response data parameters to HTML fields
        document.getElementById('dynamicMessage').innerText = `“${data.message}”`;
        document.getElementById('identBlock').innerText = data.futureIdentity;
        document.getElementById('habitBlock').innerText = data.habit;
        document.getElementById('warningBlock').innerText = data.warning;
        document.getElementById('mantraBlock').innerText = data.mantra;

        // Clear and append list moves
        const movesElement = document.getElementById('movesBlock');
        movesElement.innerHTML = "";
        (data.nextMoves || []).forEach(move => {
            const li = document.createElement('li');
            li.innerText = move;
            movesElement.appendChild(li);
        });

        // Set state values for chat connection
        userProfile = requestPayload;
        chatHistory = []; // Reset chat history
        
        // Save session data to localStorage
        localStorage.setItem('futureme_profile', JSON.stringify(userProfile));
        localStorage.setItem('futureme_daily_plan', JSON.stringify(data.dailyPlan));
        localStorage.setItem('futureme_outputs', JSON.stringify({
            message: data.message,
            futureIdentity: data.futureIdentity,
            nextMoves: data.nextMoves,
            habit: data.habit,
            warning: data.warning,
            mantra: data.mantra
        }));

        // Setup timestamp signature
        const now = new Date();
        document.getElementById('outputTimestamp').innerText = `FutureMe Interface Sync • Active Stream ${now.toLocaleTimeString()}`;

        // Switch to Output state
        loadingState.style.display = 'none';
        outputContainer.style.display = 'block';

        // Render the new interactive daily plan
        renderDailyPlan(data.dailyPlan);

        // Render statistics
        renderStats();

        // Render reflections timeline if there are any existing reflections
        renderReflections();

        // Set up the dynamic chat terminal ready state
        initializeChatTerminal(data.message);

    } catch (err) {
        console.error("Fetch generate error:", err);
        clearInterval(phraseInterval);
        loadingState.style.display = 'none';
        formElement.style.display = 'block';
        
        errorText.innerText = err.message || "FutureMe could not respond right now. Try again.";
        errorBanner.style.display = 'flex';
        
        // Scroll back to error banner
        errorBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } finally {
        isGenerating = false;
        generateBtn.disabled = false;
    }
}

/* --- Initialize Chat Terminal with the future-self context --- */
function initializeChatTerminal(initialMessage) {
    const chatPlaceholder = document.getElementById('chatPlaceholder');
    const chatMessages = document.getElementById('chatMessages');
    const chatInputArea = document.getElementById('chatInputArea');
    const chatStatus = document.getElementById('chatStatus');
    const chatBadge = document.getElementById('chatBadge');

    // Wipe previous placeholder
    chatMessages.innerHTML = "";

    // Append future self greeting message
    const greeting = `Transmission successfully established. Hi ${userProfile.name}, I am your future self looking back from the baseline of our achievements. I'm ready to answer any questions you have about our journey.`;
    appendChatMessage('futureme', greeting);

    // Save initial system context message into chat history (optional but useful for prompts)
    chatHistory.push({
        role: "futureme",
        message: initialMessage
    });
    localStorage.setItem('futureme_chat', JSON.stringify(chatHistory));

    // Reveal input area and update connection banners
    chatInputArea.style.display = 'flex';
    chatStatus.innerText = "Temporal Connection Active • Low-Latency Sync Ready";
    chatBadge.innerText = "Connection Secure";
    chatBadge.classList.add('badge-glow');
}

/* --- Send Follow Up Chat Message --- */
async function sendChatMessage() {
    if (isChatting || !userProfile) return;

    const chatInput = document.getElementById('chatInput');
    const question = chatInput.value.trim();
    const chatMessages = document.getElementById('chatMessages');

    if (!question) return;

    // State lock and append user message bubble
    isChatting = true;
    chatInput.value = "";
    appendChatMessage('user', question);

    // Append Typing Indicator dot bubble
    const typingIndicator = document.createElement('div');
    typingIndicator.className = "typing-indicator";
    typingIndicator.id = "typingIndicator";
    typingIndicator.innerHTML = "<span></span><span></span><span></span>";
    chatMessages.appendChild(typingIndicator);
    scrollChatToBottom();

    try {
        // Send request payload to POST /api/chat-futureme
        const response = await fetch('/api/chat-futureme', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userProfile,
                chatHistory,
                question
            })
        });

        const result = await response.json();
        
        // Remove typing indicator bubble
        const indicator = document.getElementById('typingIndicator');
        if (indicator) indicator.remove();

        if (!response.ok || !result.success) {
            throw new Error(result.error || "Connection timed out. Please try sending your question again.");
        }

        // Append future self reply bubble
        appendChatMessage('futureme', result.reply);

        // Save conversation turn into frontend chat state history array
        chatHistory.push({ role: "user", message: question });
        chatHistory.push({ role: "futureme", message: result.reply });
        localStorage.setItem('futureme_chat', JSON.stringify(chatHistory));

    } catch (err) {
        console.error("Chat message error:", err);
        const indicator = document.getElementById('typingIndicator');
        if (indicator) indicator.remove();

        // Print error message directly in chat box as helper
        const errorBubble = document.createElement('div');
        errorBubble.className = "chat-bubble bubble-future";
        errorBubble.style.borderColor = "rgba(239, 68, 68, 0.4)";
        errorBubble.style.background = "rgba(239, 68, 68, 0.05)";
        errorBubble.style.color = "#f87171";
        errorBubble.innerText = err.message || "FutureMe could not respond right now. Try again.";
        chatMessages.appendChild(errorBubble);
        scrollChatToBottom();
    } finally {
        isChatting = false;
        chatInput.focus();
    }
}

/* --- Append Bubble to Message Stack --- */
function appendChatMessage(role, text) {
    const chatMessages = document.getElementById('chatMessages');
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble bubble-${role === 'user' ? 'user' : 'future'}`;
    bubble.innerText = text;
    chatMessages.appendChild(bubble);
    scrollChatToBottom();
}

/* --- Helper to scroll chat container view --- */
function scrollChatToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/* --- Copy result stats details to clipboard --- */
function copyResult() {
    const message = document.getElementById('dynamicMessage').innerText;
    const identity = document.getElementById('identBlock').innerText;
    const habit = document.getElementById('habitBlock').innerText;
    const warning = document.getElementById('warningBlock').innerText;
    const mantra = document.getElementById('mantraBlock').innerText;
    
    const movesList = document.querySelectorAll('#movesBlock li');
    let movesText = "";
    movesList.forEach((move, i) => {
        movesText += `${i + 1}. ${move.innerText}\n`;
    });

    const name = userProfile ? userProfile.name : "Friend";

    const copyText = `⚡ FutureMe Transmission for ${name} ⚡\n\n` +
                     `[THE MESSAGE]\n${message}\n\n` +
                     `[FUTURE IDENTITY]\n${identity}\n\n` +
                     `[NEXT MOVES]\n${movesText}\n` +
                     `[ONE DAILY HABIT]\n${habit}\n\n` +
                     `[WARNING FROM FUTURE]\n${warning}\n\n` +
                     `[DAILY MANTRA]\n${mantra}\n\n` +
                     `Generated by FutureMe • Nitish's Founder Labs`;

    navigator.clipboard.writeText(copyText)
        .then(() => {
            showToast("Your FutureMe moment has been copied to your clipboard!");
        })
        .catch(err => {
            console.error("Clipboard copy failure:", err);
            showToast("Failed to copy result automatically.");
        });
}

/* --- Trigger focus on the chat and smooth scroll down --- */
function startChatFocus(event) {
    event.preventDefault();
    const chatSection = document.getElementById('chat');
    if (chatSection) {
        chatSection.scrollIntoView({ behavior: 'smooth' });
    }
    setTimeout(() => {
        const chatInput = document.getElementById('chatInput');
        if (chatInput && userProfile) {
            chatInput.focus();
        }
    }, 800);
}

/* --- Reset output and present form configurations --- */
function resetForm() {
    const formElement = document.getElementById('futureForm');
    const outputContainer = document.getElementById('outputContainer');
    
    outputContainer.style.display = 'none';
    formElement.style.display = 'block';
    
    // Clear localStorage session items
    localStorage.removeItem('futureme_profile');
    localStorage.removeItem('futureme_daily_plan');
    localStorage.removeItem('futureme_outputs');
    localStorage.removeItem('futureme_chat');

    // Reset chat history state
    chatHistory = [];
    userProfile = null;
    
    // Clear chat UI
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.innerHTML = `<div class="chat-placeholder-text" id="chatPlaceholder">Configure your identity matrix above to initiate temporal connection.</div>`;
    }
    const chatInputArea = document.getElementById('chatInputArea');
    if (chatInputArea) chatInputArea.style.display = 'none';
    const chatStatus = document.getElementById('chatStatus');
    if (chatStatus) chatStatus.innerText = "Temporal Terminal Offline • Setup Required";
    const chatBadge = document.getElementById('chatBadge');
    if (chatBadge) {
        chatBadge.innerText = "Temporal Terminal";
        chatBadge.classList.remove('badge-glow');
    }
    
    // Hide weekly report card if any
    const reportCard = document.getElementById('weeklyReportTextCard');
    if (reportCard) reportCard.style.display = 'none';

    // Smooth scroll back to form
    formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/* --- Show Global Notification Toast --- */
function showToast(message) {
    const toast = document.getElementById('shareToast');
    const toastMessage = document.getElementById('toastMessage');
    if (!toast || !toastMessage) return;
    
    toastMessage.innerText = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/* --- FutureMe Daily Execution System & OS Engine --- */
const DEFAULT_HABITS = [
    { id: "habit-1", name: "Deep Work", completed: false, isCustom: false },
    { id: "habit-2", name: "Learning", completed: false, isCustom: false },
    { id: "habit-3", name: "Exercise", completed: false, isCustom: false },
    { id: "habit-4", name: "Reading", completed: false, isCustom: false },
    { id: "habit-5", name: "Sleep Before 11 PM", completed: false, isCustom: false }
];

let state = {
    currentStreak: 0,
    bestStreak: 0,
    lastActiveDate: "", // YYYY-MM-DD
    lastStreakIncrementDate: "", // YYYY-MM-DD to avoid double increments
    habits: [...DEFAULT_HABITS],
    habitHistory: {}, // YYYY-MM-DD -> { completed: X, total: Y }
    reflections: [], // Array of reflection objects: { date: "May 31, 2026 @ 10:11 PM", accomplished, distracted, improve }
    notificationsEnabled: false,
    reminderHour: 21,
    weeklyReport: null
};

// YYYY-MM-DD helper
function getLocalDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Yesterday helper
function getYesterdayDateString() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Save & load state
function saveState() {
    localStorage.setItem('futureme_execution_state', JSON.stringify(state));
}

function loadState() {
    const saved = localStorage.getItem('futureme_execution_state');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            state = { ...state, ...parsed };
            if (parsed.habits) state.habits = parsed.habits;
            if (parsed.habitHistory) state.habitHistory = parsed.habitHistory;
            if (parsed.reflections) state.reflections = parsed.reflections;
        } catch (e) {
            console.error("Error parsing saved execution state:", e);
        }
    }
    
    // Check for saved userProfile and dailyPlan to auto-restore session
    const savedProfile = localStorage.getItem('futureme_profile');
    const savedPlan = localStorage.getItem('futureme_daily_plan');
    const savedChat = localStorage.getItem('futureme_chat');
    const savedOutputs = localStorage.getItem('futureme_outputs');

    if (savedProfile && savedPlan && savedOutputs) {
        try {
            userProfile = JSON.parse(savedProfile);
            const plan = JSON.parse(savedPlan);
            const outputs = JSON.parse(savedOutputs);
            
            // Populating UI values
            document.getElementById('userName').value = userProfile.name || "";
            document.getElementById('userAge').value = userProfile.age || "";
            document.getElementById('userGoal').value = userProfile.goal || "";
            document.getElementById('userStruggle').value = userProfile.struggle || "";
            document.getElementById('userTimeline').value = userProfile.oneYearVision || "";
            document.getElementById('futureTone').value = userProfile.tone || "Brutally Honest";

            // Populate text blocks
            document.getElementById('dynamicMessage').innerText = `“${outputs.message}”`;
            document.getElementById('identBlock').innerText = outputs.futureIdentity;
            document.getElementById('habitBlock').innerText = outputs.habit;
            document.getElementById('warningBlock').innerText = outputs.warning;
            document.getElementById('mantraBlock').innerText = outputs.mantra;

            const movesElement = document.getElementById('movesBlock');
            movesElement.innerHTML = "";
            (outputs.nextMoves || []).forEach(move => {
                const li = document.createElement('li');
                li.innerText = move;
                movesElement.appendChild(li);
            });

            // Display outputs
            document.getElementById('futureForm').style.display = 'none';
            document.getElementById('outputContainer').style.display = 'block';

            const now = new Date();
            document.getElementById('outputTimestamp').innerText = `FutureMe Interface Sync • Active Stream ${now.toLocaleTimeString()}`;

            // Render plan
            renderDailyPlan(plan);

            // Restore reminder selectors
            const select = document.getElementById('reminderTimeSelect');
            if (select) select.value = state.reminderHour;

            // Chat Restore
            if (savedChat) {
                chatHistory = JSON.parse(savedChat);
                initializeChatTerminalRestored();
            } else {
                initializeChatTerminal(outputs.message);
            }

            // Restore weekly report
            if (state.weeklyReport) {
                const quoteBlock = document.getElementById('reportQuoteBlock');
                const reportCard = document.getElementById('weeklyReportTextCard');
                if (quoteBlock && reportCard) {
                    quoteBlock.innerText = `“${state.weeklyReport}”`;
                    reportCard.style.display = 'block';
                }
            }

        } catch (e) {
            console.error("Error restoring session:", e);
        }
    }
}

function initializeChatTerminalRestored() {
    const chatInputArea = document.getElementById('chatInputArea');
    const chatStatus = document.getElementById('chatStatus');
    const chatBadge = document.getElementById('chatBadge');
    const chatMessages = document.getElementById('chatMessages');

    chatMessages.innerHTML = "";
    
    chatHistory.forEach(msg => {
        appendChatMessage(msg.role, msg.message);
    });

    chatInputArea.style.display = 'flex';
    chatStatus.innerText = "Temporal Connection Active • Low-Latency Sync Ready";
    chatBadge.innerText = "Connection Secure";
    chatBadge.classList.add('badge-glow');
}

// Render Daily Plan
function renderDailyPlan(dailyPlan) {
    if (!dailyPlan) return;
    
    const focusTimeBlock = document.getElementById('focusTimeBlock');
    if (focusTimeBlock) focusTimeBlock.innerText = dailyPlan.focusTime || "90 mins focus";

    const topPriorityBlock = document.getElementById('topPriorityBlock');
    if (topPriorityBlock) topPriorityBlock.innerText = dailyPlan.topPriority || "";

    const avoidBlock = document.getElementById('avoidBlock');
    if (avoidBlock) avoidBlock.innerText = dailyPlan.avoid || "";

    const actions = dailyPlan.dailyActions || [];
    const actionBlock1 = document.getElementById('actionBlock1');
    if (actionBlock1) actionBlock1.innerText = actions[0] || "Execute key target action";

    const actionBlock2 = document.getElementById('actionBlock2');
    if (actionBlock2) actionBlock2.innerText = actions[1] || "Execute secondary target action";

    const actionBlock3 = document.getElementById('actionBlock3');
    if (actionBlock3) actionBlock3.innerText = actions[2] || "Execute tertiary target action";
}

// Streak Rollover Check
function checkStreakRollover() {
    const todayStr = getLocalDateString();
    const yesterdayStr = getYesterdayDateString();
    const lastActive = state.lastActiveDate;

    if (!lastActive) {
        state.lastActiveDate = todayStr;
        saveState();
        return;
    }

    if (lastActive === todayStr) {
        return;
    }

    // It's a new day! Log yesterday's completion data
    const completedCount = state.habits.filter(h => h.completed).length;
    const totalCount = state.habits.length;
    state.habitHistory[lastActive] = { completed: completedCount, total: totalCount };

    // Check if streak is preserved (did they complete 100% yesterday?)
    const completedAllYesterday = totalCount > 0 && completedCount === totalCount;

    if (lastActive === yesterdayStr) {
        if (!completedAllYesterday) {
            state.currentStreak = 0;
        }
    } else {
        // Gap is larger than 1 day
        state.currentStreak = 0;
    }

    // Reset daily habits completion
    state.habits.forEach(h => {
        h.completed = false;
    });

    state.lastActiveDate = todayStr;
    saveState();
}

// Render Habit Calibration Matrix UI
function renderHabits() {
    const container = document.getElementById('habitsListContainer');
    if (!container) return;
    container.innerHTML = "";

    state.habits.forEach(habit => {
        const row = document.createElement('div');
        row.className = `habit-row-item ${habit.completed ? 'checked' : ''}`;
        
        const left = document.createElement('div');
        left.className = "habit-left-flex";
        left.onclick = (e) => {
            if (e.target.closest('.habit-actions-btns')) return;
            toggleHabit(habit.id);
        };

        const checkbox = document.createElement('div');
        checkbox.className = "habit-checkbox";
        
        const label = document.createElement('span');
        label.className = "habit-name-lbl";
        label.innerText = habit.name;

        left.appendChild(checkbox);
        left.appendChild(label);
        row.appendChild(left);

        const actions = document.createElement('div');
        actions.className = "habit-actions-btns";

        const editBtn = document.createElement('button');
        editBtn.className = "habit-row-btn";
        editBtn.innerHTML = `✏️`;
        editBtn.title = "Edit habit";
        editBtn.onclick = (e) => {
            e.stopPropagation();
            editHabit(habit.id);
        };
        actions.appendChild(editBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = "habit-row-btn delete-btn";
        deleteBtn.innerHTML = `🗑️`;
        deleteBtn.title = "Delete habit";
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteHabit(habit.id);
        };
        actions.appendChild(deleteBtn);

        row.appendChild(actions);
        container.appendChild(row);
    });
}

// Toggle Habit Checklist
function toggleHabit(id) {
    const habit = state.habits.find(h => h.id === id);
    if (!habit) return;

    habit.completed = !habit.completed;

    const completedCount = state.habits.filter(h => h.completed).length;
    const totalCount = state.habits.length;

    // Check for 100% completion today to trigger streak
    if (totalCount > 0 && completedCount === totalCount) {
        const todayStr = getLocalDateString();
        if (state.lastStreakIncrementDate !== todayStr) {
            state.currentStreak += 1;
            if (state.currentStreak > state.bestStreak) {
                state.bestStreak = state.currentStreak;
            }
            state.lastStreakIncrementDate = todayStr;
            triggerStreakCelebration();
        }
    } else {
        // If they went below 100% on the same day they completed it
        const todayStr = getLocalDateString();
        if (state.lastStreakIncrementDate === todayStr) {
            state.currentStreak = Math.max(0, state.currentStreak - 1);
            state.lastStreakIncrementDate = "";
            const celebrateAlert = document.getElementById('streakCelebrationAlert');
            if (celebrateAlert) celebrateAlert.style.display = 'none';
        }
    }

    saveState();
    renderHabits();
    renderStats();
    checkBadges();
}

// Add Custom Habit
function addCustomHabit() {
    const input = document.getElementById('customHabitInput');
    if (!input) return;
    const name = input.value.trim();
    if (!name) return;

    const newHabit = {
        id: "custom-" + Date.now(),
        name: name,
        completed: false,
        isCustom: true
    };

    state.habits.push(newHabit);
    input.value = "";

    // Reset streak increment today if they were at 100% before adding this new habit
    const todayStr = getLocalDateString();
    if (state.lastStreakIncrementDate === todayStr) {
        state.currentStreak = Math.max(0, state.currentStreak - 1);
        state.lastStreakIncrementDate = "";
        const celebrateAlert = document.getElementById('streakCelebrationAlert');
        if (celebrateAlert) celebrateAlert.style.display = 'none';
    }

    saveState();
    renderHabits();
    renderStats();
    checkBadges();
}

// Edit Habit Name
function editHabit(id) {
    const habit = state.habits.find(h => h.id === id);
    if (!habit) return;

    const newName = prompt("Edit habit name:", habit.name);
    if (newName === null) return;
    
    const trimmed = newName.trim();
    if (!trimmed) {
        showToast("Habit name cannot be empty.");
        return;
    }

    habit.name = trimmed;
    saveState();
    renderHabits();
}

// Delete Habit
function deleteHabit(id) {
    state.habits = state.habits.filter(h => h.id !== id);

    // Deleting may push them to 100% completion
    const completedCount = state.habits.filter(h => h.completed).length;
    const totalCount = state.habits.length;
    if (totalCount > 0 && completedCount === totalCount) {
        const todayStr = getLocalDateString();
        if (state.lastStreakIncrementDate !== todayStr) {
            state.currentStreak += 1;
            if (state.currentStreak > state.bestStreak) {
                state.bestStreak = state.currentStreak;
            }
            state.lastStreakIncrementDate = todayStr;
            triggerStreakCelebration();
        }
    }

    saveState();
    renderHabits();
    renderStats();
    checkBadges();
}

// Calculate Consistency Score
function calculateConsistencyScore() {
    let totalDays = 0;
    let sumPercentage = 0;

    for (const date in state.habitHistory) {
        const log = state.habitHistory[date];
        if (log.total > 0) {
            sumPercentage += (log.completed / log.total);
            totalDays++;
        }
    }

    const todayCompleted = state.habits.filter(h => h.completed).length;
    const todayTotal = state.habits.length;
    if (todayTotal > 0) {
        sumPercentage += (todayCompleted / todayTotal);
        totalDays++;
    }

    if (totalDays === 0) return 0;
    return Math.round((sumPercentage / totalDays) * 100);
}

// Render Stats Panels
function renderStats() {
    const todayCompleted = state.habits.filter(h => h.completed).length;
    const todayTotal = state.habits.length;
    const percentageToday = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;

    const ratioEl = document.getElementById('habitsCompletedRatio');
    if (ratioEl) ratioEl.innerText = `${todayCompleted} / ${todayTotal} Complete`;

    const barEl = document.getElementById('habitsProgressBarFill');
    if (barEl) barEl.style.width = `${percentageToday}%`;

    const score = calculateConsistencyScore();
    const consistencyScoreEl = document.getElementById('consistencyScore');
    if (consistencyScoreEl) consistencyScoreEl.innerText = `${score}% Consistency Score`;

    const streakCountDisplay = document.getElementById('streakCountDisplay');
    if (streakCountDisplay) streakCountDisplay.innerText = `${state.currentStreak} Days`;

    const currentStreakVal = document.getElementById('currentStreakVal');
    if (currentStreakVal) currentStreakVal.innerText = `${state.currentStreak} Days`;

    const bestStreakVal = document.getElementById('bestStreakVal');
    if (bestStreakVal) bestStreakVal.innerText = `${state.bestStreak} Days`;

    // Weekly report counts
    const reportHabitsCount = document.getElementById('reportHabitsCount');
    if (reportHabitsCount) {
        let totalReps = 0;
        for (const date in state.habitHistory) {
            totalReps += state.habitHistory[date].completed;
        }
        totalReps += todayCompleted;
        reportHabitsCount.innerText = totalReps;
    }

    const reportReflectionsCount = document.getElementById('reportReflectionsCount');
    if (reportReflectionsCount) {
        reportReflectionsCount.innerText = state.reflections.length;
    }

    const reportConsistencyScore = document.getElementById('reportConsistencyScore');
    if (reportConsistencyScore) {
        reportConsistencyScore.innerText = `${score}%`;
    }
}

// Trigger Streak Celebration Alert
function triggerStreakCelebration() {
    const celebrateAlert = document.getElementById('streakCelebrationAlert');
    if (!celebrateAlert) return;
    
    celebrateAlert.style.display = 'flex';
    
    if (userProfile) {
        const name = userProfile.name || "friend";
        const tone = userProfile.tone || "";
        let quote = "";
        switch(tone) {
            case "Brutally Honest":
                quote = `"No excuses today, ${name}. You executed the blueprint exactly as I demanded. This is how we win."`;
                break;
            case "CEO Mode":
                quote = `"High resource efficiency achieved, ${name}. Today's temporal targets successfully locked. Scaling is inevitable."`;
                break;
            case "Calm Mentor":
                quote = `"You walked with peace and steady focus today, ${name}. Feel the gratitude of the future self you just created."`;
                break;
            default:
                quote = `"Outstanding progress, ${name}! You took the daily actions necessary to make me a reality. Keep building!"`;
        }
        const textContainer = celebrateAlert.querySelector('p');
        if (textContainer) {
            textContainer.innerText = quote;
        }
    }
}

// Gamification Unlocking Logic
function checkBadges() {
    const badge3day = document.getElementById('badge-3day');
    if (badge3day) {
        if (state.currentStreak >= 3) unlockBadge(badge3day);
        else lockBadge(badge3day);
    }

    const badge7day = document.getElementById('badge-7day');
    if (badge7day) {
        if (state.currentStreak >= 7) unlockBadge(badge7day);
        else lockBadge(badge7day);
    }

    const badge30 = document.getElementById('badge-30habits');
    if (badge30) {
        let totalReps = 0;
        for (const date in state.habitHistory) {
            totalReps += state.habitHistory[date].completed;
        }
        const todayCompleted = state.habits.filter(h => h.completed).length;
        totalReps += todayCompleted;

        if (totalReps >= 30) unlockBadge(badge30);
        else lockBadge(badge30);
    }

    const badgeMaster = document.getElementById('badge-master');
    if (badgeMaster) {
        const score = calculateConsistencyScore();
        const totalReps = Object.keys(state.habitHistory).length + (state.habits.length > 0 ? 1 : 0);
        if (score === 100 && totalReps > 0) unlockBadge(badgeMaster);
        else lockBadge(badgeMaster);
    }
}

function unlockBadge(el) {
    if (el.classList.contains('locked')) {
        el.classList.remove('locked');
        el.classList.add('unlocked');
        const badgeName = el.querySelector('.badge-name').innerText;
        showToast(`🎉 Achievement Unlocked: ${badgeName}!`);
    }
}

function lockBadge(el) {
    el.classList.remove('unlocked');
    el.classList.add('locked');
}

// Save Daily Reflection
function saveDailyReflection() {
    const accEl = document.getElementById('reflectAccomplish');
    const distEl = document.getElementById('reflectDistractions');
    const impEl = document.getElementById('reflectImprove');

    if (!accEl || !distEl || !impEl) return;

    const accomplished = accEl.value.trim();
    const distracted = distEl.value.trim();
    const improve = impEl.value.trim();

    if (!accomplished || !distracted || !improve) {
        showToast("Please fill in all reflection vectors to document alignment.");
        return;
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

    const newReflection = {
        date: `${dateStr} @ ${timeStr}`,
        accomplished,
        distracted,
        improve
    };

    state.reflections.unshift(newReflection);

    saveState();
    renderReflections();
    renderStats();

    accEl.value = "";
    distEl.value = "";
    impEl.value = "";

    showToast("Daily reflection locked into timeline.");
}

// Render reflections to vertical timeline
function renderReflections() {
    const container = document.getElementById('reflectionTimeline');
    if (!container) return;

    if (state.reflections.length === 0) {
        container.innerHTML = `<div class="chat-placeholder-text" style="padding: 1.5rem 0;">No reflection logs locked in yet.</div>`;
        return;
    }

    container.innerHTML = "";
    state.reflections.forEach((ref, idx) => {
        const node = document.createElement('div');
        node.className = `timeline-node ${idx === 0 ? 'active' : ''}`;

        node.innerHTML = `
            <div class="timeline-meta">${ref.date}</div>
            <div class="timeline-body">
                <p><strong>Wins / Accomplishments</strong>${ref.accomplished}</p>
                <p><strong>Distractions</strong>${ref.distracted}</p>
                <p><strong>Improvements</strong>${ref.improve}</p>
            </div>
        `;
        container.appendChild(node);
    });
}

// Smart Notifications Framework
async function enableBrowserNotifications() {
    if (!("Notification" in window)) {
        showToast("This browser does not support desktop notifications.");
        return;
    }

    if (Notification.permission === "granted") {
        state.notificationsEnabled = !state.notificationsEnabled;
        saveState();
        updateNotificationButtonUI();
        showToast(state.notificationsEnabled ? "FutureMe reminders enabled." : "FutureMe reminders disabled.");
        return;
    }

    if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            state.notificationsEnabled = true;
            saveState();
            updateNotificationButtonUI();
            showToast("Notifications enabled! FutureMe will nudge you daily.");
            
            new Notification("FutureMe Connection Established", {
                body: "I will remind you to stick to your habits and goals.",
                icon: "/favicon.ico"
            });
        } else {
            showToast("Notification permission denied.");
        }
    } else {
        showToast("Notification permission was previously denied. Please enable them in browser settings.");
    }
}

function updateNotificationButtonUI() {
    const btn = document.getElementById('enableNotificationsBtn');
    if (!btn) return;

    if (Notification.permission === "granted" && state.notificationsEnabled) {
        btn.innerText = "Disable FutureMe Reminders";
        btn.style.background = "rgba(16, 185, 129, 0.2)";
        btn.style.color = "#34d399";
        btn.style.borderColor = "rgba(16, 185, 129, 0.4)";
    } else {
        btn.innerText = "Enable FutureMe Reminders";
        btn.style.background = "";
        btn.style.color = "";
        btn.style.borderColor = "";
    }
}

function updateReminderTimePreference() {
    const select = document.getElementById('reminderTimeSelect');
    if (!select) return;

    state.reminderHour = parseInt(select.value, 10);
    saveState();
    showToast(`Reminders scheduled for ${select.options[select.selectedIndex].text}`);
}

function startNotificationScheduler() {
    setInterval(() => {
        if (!state.notificationsEnabled || Notification.permission !== "granted") return;

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        if (currentHour === state.reminderHour && currentMinute === 0) {
            const todayHourStr = `${getLocalDateString()}-${currentHour}`;
            if (state.lastNotificationTime !== todayHourStr) {
                state.lastNotificationTime = todayHourStr;
                saveState();

                const name = userProfile ? userProfile.name : "friend";
                new Notification(`FutureMe Alignment Nudge`, {
                    body: `Hi ${name}, have you checked off your habits and logged your reflection today? Let's stay aligned.`,
                    icon: "/favicon.ico"
                });
            }
        }
    }, 60000);
}

// Weekly Performance AI Auditor
async function generateWeeklyReport() {
    if (!userProfile) {
        showToast("Please generate your FutureMe profile first.");
        return;
    }

    const btn = document.getElementById('generateReportBtn');
    const quoteBlock = document.getElementById('reportQuoteBlock');
    const reportCard = document.getElementById('weeklyReportTextCard');

    if (!btn || !quoteBlock || !reportCard) return;

    btn.disabled = true;
    const originalText = btn.innerText;
    btn.innerText = "Analyzing alignment...";

    const todayCompleted = state.habits.filter(h => h.completed).length;
    let totalCompletedReps = 0;
    for (const date in state.habitHistory) {
        totalCompletedReps += state.habitHistory[date].completed;
    }
    totalCompletedReps += todayCompleted;

    const stats = {
        totalCompleted: totalCompletedReps,
        consistency: calculateConsistencyScore(),
        currentStreak: state.currentStreak,
        bestStreak: state.bestStreak,
        reflectionsCount: state.reflections.length
    };

    try {
        const response = await fetch('/api/generate-weeklyreport', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userProfile,
                stats,
                reflections: state.reflections
            })
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.error || "Failed to compile weekly report.");
        }

        quoteBlock.innerText = `“${result.summary}”`;
        reportCard.style.display = 'block';
        
        state.weeklyReport = result.summary;
        saveState();

        showToast("Weekly Performance Audit generated!");

    } catch (err) {
        console.error("Weekly report error:", err);
        showToast(err.message || "Failed to generate weekly report.");
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

// Window load trigger
document.addEventListener("DOMContentLoaded", () => {
    loadState();
    checkStreakRollover();
    renderHabits();
    renderReflections();
    renderStats();
    checkBadges();
    updateNotificationButtonUI();
    startNotificationScheduler();
});
