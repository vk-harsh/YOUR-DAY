const STORAGE_KEY = "paper-self-assistant-v1";

const defaultHabits = [
  "Morning planning",
  "Exercise",
  "Study session",
  "Deep work",
  "Read notes"
];

const state = loadState();
let taskEditMode = false;
let scheduleOpen = true;
let timerTicker = null;
let lastClockText = "";

const els = {
  monthInput: document.querySelector("#monthInput"),
  prevMonth: document.querySelector("#prevMonth"),
  nextMonth: document.querySelector("#nextMonth"),
  selectedDate: document.querySelector("#selectedDate"),
  selectedDayLabel: document.querySelector("#selectedDayLabel"),
  primaryTable: document.querySelector("#primaryTable"),
  scoreChart: document.querySelector("#scoreChart"),
  taskEditToggle: document.querySelector("#taskEditToggle"),
  addPrimary: document.querySelector("#addPrimary"),
  primaryDayTasks: document.querySelector("#primaryDayTasks"),
  secondaryTasks: document.querySelector("#secondaryTasks"),
  addSecondary: document.querySelector("#addSecondary"),
  taskTemplate: document.querySelector("#taskTemplate"),
  chatLog: document.querySelector("#chatLog"),
  chatForm: document.querySelector("#chatForm"),
  chatInput: document.querySelector("#chatInput"),
  assistantOpen: document.querySelector("#assistantOpen"),
  assistantClose: document.querySelector("#assistantClose"),
  assistantOverlay: document.querySelector("#assistantOverlay"),
  topicForm: document.querySelector("#topicForm"),
  topicInput: document.querySelector("#topicInput"),
  studyPage: document.querySelector("#studyPage"),
  pageNumber: document.querySelector("#pageNumber"),
  pageVisual: document.querySelector("#pageVisual"),
  pageTitle: document.querySelector("#pageTitle"),
  pageBody: document.querySelector("#pageBody"),
  prevPage: document.querySelector("#prevPage"),
  nextPage: document.querySelector("#nextPage")
};

els.tabs = document.querySelectorAll("[data-tab]");
els.panels = document.querySelectorAll("[data-panel]");
els.appTabs = document.querySelector("#appTabs");
els.studyDate = document.querySelector("#studyDate");
els.addStudyTask = document.querySelector("#addStudyTask");
els.studyTasks = document.querySelector("#studyTasks");
els.modeTimer = document.querySelector("#modeTimer");
els.modeStopwatch = document.querySelector("#modeStopwatch");
els.durationRow = document.querySelector("#durationRow");
els.timerHours = document.querySelector("#timerHours");
els.timerMinutes = document.querySelector("#timerMinutes");
els.flipClock = document.querySelector("#flipClock");
els.timerTitle = document.querySelector("#timerTitle");
els.timerActionGroups = document.querySelectorAll("[data-timer-actions]");
els.clockFullscreen = document.querySelector("#clockFullscreen");
els.clockFullscreenClose = document.querySelector("#clockFullscreenClose");
els.clockFullscreenMode = document.querySelector("#clockFullscreenMode");
els.fullscreenClock = document.querySelector("#fullscreenClock");
els.studyTodayTotal = document.querySelector("#studyTodayTotal");
els.studyTodayHours = document.querySelector("#studyTodayHours");
els.studyWeekHours = document.querySelector("#studyWeekHours");
els.studyDayGraph = document.querySelector("#studyDayGraph");
els.studyWeekGraph = document.querySelector("#studyWeekGraph");
els.gymDashboard = document.querySelector("#gymDashboard");
els.gymProfileCard = document.querySelector("#gymProfileCard");
els.gymProfileForm = document.querySelector("#gymProfileForm");
els.gymProfileCancel = document.querySelector("#gymProfileCancel");
els.gymUserTitle = document.querySelector("#gymUserTitle");
els.gymCaloriesIn = document.querySelector("#gymCaloriesIn");
els.gymCaloriesTarget = document.querySelector("#gymCaloriesTarget");
els.gymWeekGraph = document.querySelector("#gymWeekGraph");
els.gymActivityList = document.querySelector("#gymActivityList");
els.gymActivityEdit = document.querySelector("#gymActivityEdit");
els.gymActivityEditor = document.querySelector("#gymActivityEditor");
els.gymActivityEditList = document.querySelector("#gymActivityEditList");
els.gymNewActivity = document.querySelector("#gymNewActivity");

els.gymAddActivity = document.querySelector("#gymAddActivity");
els.gymSaveActivity = document.querySelector("#gymSaveActivity");
els.gymAddMeal = document.querySelector("#gymAddMeal");
els.gymAddFixedMeal = document.querySelector("#gymAddFixedMeal");
els.gymMealRows = document.querySelector("#gymMealRows");
els.gymName = document.querySelector("#gymName");
els.gymHeight = document.querySelector("#gymHeight");
els.gymWeight = document.querySelector("#gymWeight");
els.gymAge = document.querySelector("#gymAge");
els.gymGender = document.querySelector("#gymGender");
els.gymTarget = document.querySelector("#gymTarget");
els.gymCalorieChoice = document.querySelector("#gymCalorieChoice");
els.gymCustomCalories = document.querySelector("#gymCustomCalories");
els.gymMaintenanceCalories = document.querySelector("#gymMaintenanceCalories");
els.gymCutCalories = document.querySelector("#gymCutCalories");
els.gymBulkCalories = document.querySelector("#gymBulkCalories");
els.gymRecommendedCalories = document.querySelector("#gymRecommendedCalories");
els.themeToggle = document.querySelector("#themeToggle");
els.exportData = document.querySelector("#exportData");
els.importData = document.querySelector("#importData");
els.clockThemeToggle = document.querySelector("#clockThemeToggle");
els.kebabToggle = document.querySelector("#kebabToggle");
els.kebabDropdown = document.querySelector("#kebabDropdown");
els.kebabMenu = document.querySelector("#kebabMenu");

function loadState() {
  const now = new Date();
  const today = toDateKey(now);
  const fallback = {
    month: today.slice(0, 7),
    selectedDate: today,
    activeTab: "day",
    habits: defaultHabits.map((name, index) => ({
      id: uid(),
      name,
      order: index,
      checks: {}
    })),
    secondary: {},
    chat: [
      {
        from: "bot",
        text: "I can help you plan the day, break tasks into steps, and prepare quick study cards from any topic."
      }
    ],
    pages: [],
    pageIndex: 0,
    darkMode: false,
    study: createDefaultStudyState(today),
    gym: createDefaultGymState()
  };

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return normalizeState(saved ? { ...fallback, ...saved } : fallback, fallback);
  } catch {
    return fallback;
  }
}

function createDefaultStudyState(today) {
  return {
    selectedDate: today,
    tasks: {},
    sessions: [],
    timer: {
      mode: "stopwatch",
      targetMs: 25 * 60 * 1000,
      accumulatedMs: 0,
      startedAt: null,
      running: false,
      sessionDate: today
    }
  };
}

function createDefaultGymState() {
  return {
    profileView: "dashboard",
    profile: {
      name: "",
      height: "",
      weight: "",
      age: "",
      gender: "",
      target: "",
      calorieChoice: "recommended",
      customCalories: ""
    },
    targetSteps: 10000,
    activityEditorOpen: false,
    activities: createDefaultGymActivities(),
    meals: {},
    fixedMeals: []
  };
}

function createDefaultGymActivities() {
  return [
    { id: "hit-gym", text: "Hit GYM", checks: {} },
    { id: "steps", text: "Complete 10K steps", checks: {} }
  ];
}

function normalizeState(nextState, fallback) {
  nextState.activeTab = nextState.activeTab || "day";
  nextState.study = {
    ...fallback.study,
    ...(nextState.study || {})
  };
  nextState.study.timer = {
    ...fallback.study.timer,
    ...(nextState.study.timer || {})
  };
  nextState.study.tasks = nextState.study.tasks || {};
  nextState.study.sessions = nextState.study.sessions || [];
  nextState.study.selectedDate = nextState.study.selectedDate || nextState.selectedDate || fallback.selectedDate;
  nextState.gym = {
    ...fallback.gym,
    ...(nextState.gym || {})
  };
  nextState.gym.profile = {
    ...fallback.gym.profile,
    ...(nextState.gym.profile || {})
  };
  nextState.gym.profileView = nextState.gym.profileView || "dashboard";
  nextState.gym.targetSteps = Number(nextState.gym.targetSteps) || fallback.gym.targetSteps;
  nextState.gym.activityEditorOpen = Boolean(nextState.gym.activityEditorOpen);
  if (!nextState.gym.activityV2Migrated) {
    nextState.gym.activities = fallback.gym.activities.map((activity) => ({ ...activity, checks: {} }));
    nextState.gym.activityV2Migrated = true;
  }
  nextState.gym.activities = normalizeGymActivities(nextState.gym.activities, fallback.gym.activities);
  nextState.gym.meals = nextState.gym.meals || {};
  nextState.gym.fixedMeals = Array.isArray(nextState.gym.fixedMeals) ? nextState.gym.fixedMeals : [];
  if (!nextState.gym.emptyDietMigrated) {
    nextState.gym.meals = {};
    nextState.gym.emptyDietMigrated = true;
  }
  return nextState;
}

function normalizeGymActivities(activities, fallbackActivities) {
  const incoming = Array.isArray(activities) ? activities : [];
  const byId = new Map(incoming.map((activity) => [activity.id, activity]));
  const defaults = fallbackActivities.map((activity) => ({
    ...activity,
    ...(byId.get(activity.id) || {}),
    text: byId.get(activity.id)?.text || activity.text,
    checks: byId.get(activity.id)?.checks || {}
  }));
  const extras = incoming.filter((activity) => !["hit-gym", "steps"].includes(activity.id));
  return [...defaults, ...extras];
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthParts(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  const days = new Date(year, month, 0).getDate();
  const name = new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric"
  });
  return { year, month, days, name };
}

function dateForDay(day) {
  return `${state.month}-${String(day).padStart(2, "0")}`;
}

function selectedDayNumber() {
  return Number(state.selectedDate.slice(8, 10));
}

function ensureSelectedDateInMonth() {
  state.month = state.selectedDate.slice(0, 7);
}

function renderAll() {
  ensureSelectedDateInMonth();
  els.monthInput.value = state.selectedDate;
  els.selectedDate.value = state.selectedDate;
  applyTheme();
  syncTabs();
  renderHabitTable();
  renderScoreGraph();
  renderDailyTasks();
  renderStudyTime();
  renderGym();
  renderChat();
  renderStudyPage();
  syncEditControls();
  syncSchedulePanel();
  saveState();
}

function syncTabs() {
  els.tabs.forEach((tab) => {
    const isActive = tab.dataset.tab === state.activeTab;
    tab.classList.toggle("is-active", isActive);
    if (isActive) {
      tab.setAttribute("aria-current", "page");
    } else {
      tab.removeAttribute("aria-current");
    }
  });

  els.panels.forEach((panel) => {
    const isActive = panel.dataset.panel === state.activeTab;
    panel.hidden = !isActive;
    panel.classList.toggle("is-active", isActive);
    panel.style.display = isActive ? "" : "none";
  });
}

function setActiveTab(tabName) {
  const panel = document.querySelector(`[data-panel="${tabName}"]`);
  if (!panel) return;
  state.activeTab = tabName;
  renderAll();
}

window.setActiveTab = setActiveTab;

function renderHabitTable() {
  const { days } = getMonthParts(state.month);
  const selectedDay = selectedDayNumber();
  const headerDays = Array.from({ length: days }, (_, index) => `<th>${index + 1}</th>`).join("");
  const rows = state.habits
    .sort((a, b) => a.order - b.order)
    .map((habit, index) => {
      const cells = Array.from({ length: days }, (_, dayIndex) => {
        const day = dayIndex + 1;
        const key = dateForDay(day);
        const selected = selectedDay === day ? " is-selected" : "";
        const done = habit.checks[key] ? " is-done" : "";
        return `<td><button class="day-check${done}${selected}" data-habit="${habit.id}" data-date="${key}" aria-label="${escapeHtml(habit.name)} on day ${day}"></button></td>`;
      }).join("");

      return `
        <tr>
          <td>
            <div class="habit-name">
              <strong>${index + 1}.</strong>
              <span contenteditable="${taskEditMode}" data-habit-name="${habit.id}">${escapeHtml(habit.name)}</span>
              <button type="button" data-delete-habit="${habit.id}" aria-label="Delete habit" ${taskEditMode ? "" : "hidden"}>x</button>
            </div>
          </td>
          ${cells}
        </tr>
      `;
    })
    .join("");

  els.primaryTable.innerHTML = `
    <thead>
      <tr><th>Habits / Protocols</th>${headerDays}</tr>
    </thead>
    <tbody>${rows}</tbody>
  `;
}

function renderDailyTasks() {
  const label = new Date(`${state.selectedDate}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric"
  });
  els.selectedDayLabel.textContent = label;
  els.primaryDayTasks.innerHTML = "";
  els.secondaryTasks.innerHTML = "";

  state.habits
    .sort((a, b) => a.order - b.order)
    .forEach((habit) => {
      const row = createTaskRow({
        text: habit.name,
        checked: Boolean(habit.checks[state.selectedDate]),
        removable: false,
        editable: taskEditMode
      });
      row.querySelector("input").addEventListener("change", (event) => {
        habit.checks[state.selectedDate] = event.target.checked;
        renderAll();
      });
      if (taskEditMode) {
        row.querySelector("span").addEventListener("input", (event) => {
          habit.name = event.target.textContent.trim() || "Untitled habit";
          saveState();
          renderHabitTable();
        });
      }
      els.primaryDayTasks.append(row);
    });

  getSecondaryTasks().forEach((task) => {
    const row = createTaskRow({ ...task, editable: true, removable: true });
    row.querySelector("input").addEventListener("change", (event) => {
      task.checked = event.target.checked;
      saveState();
      renderHabitTable();
    });
    row.querySelector("span").addEventListener("input", (event) => {
      task.text = event.target.textContent.trim();
      saveState();
    });
    row.querySelector("button").addEventListener("click", () => {
      if (!confirm("Delete this task?")) return;
      state.secondary[state.selectedDate] = getSecondaryTasks().filter((item) => item.id !== task.id);
      renderAll();
    });
    els.secondaryTasks.append(row);
  });
}

function getSecondaryTasks() {
  if (!state.secondary[state.selectedDate]) {
    state.secondary[state.selectedDate] = [];
  }
  return state.secondary[state.selectedDate];
}

function getStudyTasks() {
  if (!state.study.tasks[state.study.selectedDate]) {
    state.study.tasks[state.study.selectedDate] = [];
  }
  return state.study.tasks[state.study.selectedDate];
}

function renderStudyTime() {
  if (!els.studyDate) return;

  els.studyDate.value = state.study.selectedDate;
  renderStudyTasks();
  renderTimerControls();
  renderStudyStats();
}

function renderGym() {
  if (!els.gymDashboard) return;

  const profile = state.gym.profile;
  const hasName = Boolean(profile.name);
  const caloriePlan = calculateCaloriePlan(profile);
  const targetCalories = getGymTargetCalories(caloriePlan);
  const caloriesIn = getGymCaloriesIn(gymDateKey());

  els.gymDashboard.hidden = state.gym.profileView !== "dashboard";
  els.gymProfileForm.hidden = state.gym.profileView !== "form";
  els.gymUserTitle.textContent = hasName ? profile.name : "User Name";
  els.gymCaloriesIn.textContent = caloriesIn;
  els.gymCaloriesTarget.textContent = targetCalories || 2000;
  els.gymActivityEditor.hidden = !state.gym.activityEditorOpen;


  els.gymName.value = profile.name || "";
  els.gymHeight.value = profile.height || "";
  els.gymWeight.value = profile.weight || "";
  els.gymAge.value = profile.age || "";
  els.gymGender.value = profile.gender || "";
  els.gymTarget.value = profile.target || "";
  els.gymCalorieChoice.value = profile.calorieChoice || "recommended";
  els.gymCustomCalories.value = profile.customCalories || "";
  els.gymMaintenanceCalories.textContent = caloriePlan.maintenance ? `${caloriePlan.maintenance} kcal` : "-- kcal";
  els.gymCutCalories.textContent = caloriePlan.cut ? `${caloriePlan.cut} kcal` : "-- kcal";
  els.gymBulkCalories.textContent = caloriePlan.bulk ? `${caloriePlan.bulk} kcal` : "-- kcal";
  els.gymRecommendedCalories.textContent = caloriePlan.recommended ? `${caloriePlan.recommended} kcal` : "-- kcal";

  renderGymActivities();
  renderGymActivityEditor();
  renderGymMeals();
  renderGymWeekGraph();
}

function updateGymCalorieHeader() {
  const caloriesIn = getGymCaloriesIn(gymDateKey());
  els.gymCaloriesIn.textContent = caloriesIn;
  els.gymCaloriesTarget.textContent = getGymTargetCalories() || 2000;
  renderGymWeekGraph();
}

function showGymProfileForm() {
  state.gym.profileView = "form";
  renderGym();
  saveState();
  els.gymName.focus();
}

function showGymDashboard() {
  state.gym.profileView = "dashboard";
  renderGym();
  saveState();
}

function gymDateKey() {
  return state.selectedDate || toDateKey(new Date());
}

function getGymMeals() {
  const key = gymDateKey();
  if (!state.gym.meals[key]) {
    state.gym.meals[key] = state.gym.fixedMeals.map((meal) => ({
      id: uid(),
      fixedId: meal.fixedId || meal.id,
      name: meal.name,
      protein: Number(meal.protein) || 0,
      calories: Number(meal.calories) || 0,
      fixed: true,
      enabled: false
    }));
  }
  return state.gym.meals[key];
}

function getActivityText(activity) {
  return activity.text;
}

function renderGymActivities() {
  const key = gymDateKey();
  els.gymActivityList.innerHTML = state.gym.activities.map((activity) => {
    const checked = Boolean(activity.checks?.[key]);
    return `
      <button class="activity-check${checked ? " is-checked" : ""}" type="button" data-activity="${activity.id}">
        <span class="tick-circle" aria-hidden="true"></span>
        <span>${escapeHtml(getActivityText(activity))}</span>
      </button>
    `;
  }).join("");
}

function renderGymActivityEditor() {
  els.gymActivityEditList.innerHTML = state.gym.activities.map((activity) => `
    <label class="activity-edit-row">
      <span>Task</span>
      <input type="text" value="${escapeHtml(getActivityText(activity))}" data-edit-activity="${activity.id}">
    </label>
  `).join("");
}

function renderGymMeals() {
  els.gymMealRows.innerHTML = getGymMeals().map((meal) => `
    <tr data-meal="${meal.id}">
      <td><input type="text" value="${escapeHtml(meal.name)}" data-meal-field="name" aria-label="Meal name"></td>
      <td><input type="number" min="0" value="${Number(meal.protein) || 0}" data-meal-field="protein" aria-label="Protein grams"></td>
      <td><input type="number" min="0" value="${Number(meal.calories) || 0}" data-meal-field="calories" aria-label="Calories"></td>
      <td><button class="meal-toggle${meal.enabled !== false ? " is-enabled" : ""}" type="button" data-toggle-meal="${meal.id}" aria-label="Enable meal"></button></td>
      <td><button type="button" data-delete-meal="${meal.id}" aria-label="Delete meal">x</button></td>
    </tr>
  `).join("");
}

function getGymCaloriesIn(dateKey) {
  const meals = state.gym.meals[dateKey] || [];
  return meals
    .filter((meal) => meal.enabled !== false)
    .reduce((total, meal) => total + (Number(meal.calories) || 0), 0);
}

function getGymActivityScore(dateKey) {
  if (!state.gym.activities.length) return 0;
  const completed = state.gym.activities.filter((activity) => activity.checks?.[dateKey]).length;
  return completed / state.gym.activities.length;
}

function getGymDietScore(dateKey) {
  const target = getGymTargetCalories();
  const eaten = getGymCaloriesIn(dateKey);
  if (!target || !eaten) return 0;
  const goal = state.gym.profile.calorieChoice;
  if (goal === "cut" || state.gym.profile.target === "Lose fat") {
    return eaten <= target ? Math.min(1, eaten / target) : Math.max(0, 1 - ((eaten - target) / target));
  }
  if (goal === "bulk" || state.gym.profile.target === "Build muscle" || state.gym.profile.target === "Gain strength") {
    return eaten >= target ? 1 : eaten / target;
  }
  return Math.max(0, 1 - (Math.abs(eaten - target) / target));
}

function renderGymWeekGraph() {
  const weekKeys = getWeekKeys(gymDateKey());
  els.gymWeekGraph.innerHTML = weekKeys.map((key) => {
    const activityScore = getGymActivityScore(key);
    const dietScore = getGymDietScore(key);
    const score = Math.round(((activityScore + dietScore) / 2) * 100);
    const label = startOfDay(key).toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2);
    return `
      <div class="health-day" title="${label}: ${score}%">
        <span class="health-bar" style="height: ${Math.max(4, score)}%"></span>
        <span class="health-label">${label}</span>
      </div>
    `;
  }).join("");
}

function syncFixedMealFromDaily(meal) {
  const fixedId = meal.fixedId || meal.id;
  meal.fixed = true;
  meal.fixedId = fixedId;
  const existing = state.gym.fixedMeals.find((item) => item.fixedId === fixedId);
  const nextMeal = {
    id: existing?.id || uid(),
    fixedId,
    name: meal.name,
    protein: Number(meal.protein) || 0,
    calories: Number(meal.calories) || 0
  };
  if (existing) {
    Object.assign(existing, nextMeal);
  } else {
    state.gym.fixedMeals.push(nextMeal);
  }
}

function calculateCaloriePlan(profile) {
  const height = Number(profile.height);
  const weight = Number(profile.weight);
  const age = Number(profile.age);
  if (!height || !weight || !age) {
    return { maintenance: 0, cut: 0, bulk: 0, recommended: 0 };
  }

  const genderFactor = profile.gender === "Female" ? -161 : 5;
  const bmr = (10 * weight) + (6.25 * height) - (5 * age) + genderFactor;
  const maintenance = Math.round(bmr * 1.45);
  const cut = Math.max(1200, maintenance - 400);
  const bulk = maintenance + 300;
  let recommended = maintenance;
  if (profile.target === "Lose fat") recommended = cut;
  if (profile.target === "Build muscle" || profile.target === "Gain strength") recommended = bulk;
  return { maintenance, cut, bulk, recommended };
}

function getGymTargetCalories(plan = calculateCaloriePlan(state.gym.profile)) {
  const profile = state.gym.profile;
  if (profile.calorieChoice === "custom") {
    return Number(profile.customCalories) || plan.recommended || 2000;
  }
  return plan[profile.calorieChoice] || plan.recommended || Number(profile.customCalories) || 2000;
}

function renderStudyTasks() {
  els.studyTasks.innerHTML = "";
  getStudyTasks().forEach((task) => {
    const row = createTaskRow({ ...task, editable: true, removable: true });
    row.querySelector("input").addEventListener("change", (event) => {
      task.checked = event.target.checked;
      saveState();
    });
    row.querySelector("span").addEventListener("input", (event) => {
      task.text = event.target.textContent.trim();
      saveState();
    });
    row.querySelector("button").addEventListener("click", () => {
      if (!confirm("Delete this study task?")) return;
      state.study.tasks[state.study.selectedDate] = getStudyTasks().filter((item) => item.id !== task.id);
      renderAll();
    });
    els.studyTasks.append(row);
  });
}

function renderTimerControls() {
  const timer = state.study.timer;
  const targetParts = msToParts(timer.targetMs);
  els.timerTitle.textContent = timer.mode === "timer" ? "Timer" : "Stopwatch";
  els.timerHours.value = targetParts.hours;
  els.timerMinutes.value = timer.targetMs <= 0 ? 25 : targetParts.minutes;
  els.durationRow.hidden = timer.mode !== "timer";
  els.modeTimer.classList.toggle("is-active", timer.mode === "timer");
  els.modeStopwatch.classList.toggle("is-active", timer.mode === "stopwatch");
  syncTimerActionButtons();
  updateFlipClock();
}

function syncTimerActionButtons() {
  document.querySelectorAll("[data-timer-action='start']").forEach((button) => {
    button.disabled = state.study.timer.running;
  });
  document.querySelectorAll("[data-timer-action='pause']").forEach((button) => {
    button.disabled = !state.study.timer.running && state.study.timer.accumulatedMs === 0;
  });
  document.querySelectorAll("[data-timer-action='save']").forEach((button) => {
    button.disabled = state.study.timer.running || state.study.timer.accumulatedMs === 0;
  });
}

function getTimerElapsedMs() {
  const timer = state.study.timer;
  const liveMs = timer.running && timer.startedAt ? Date.now() - timer.startedAt : 0;
  return Math.max(0, timer.accumulatedMs + liveMs);
}

function getTimerDisplayMs() {
  const elapsedMs = getTimerElapsedMs();
  if (state.study.timer.mode === "timer") {
    return Math.max(0, state.study.timer.targetMs - elapsedMs);
  }
  return elapsedMs;
}

function updateFlipClock() {
  const displayMs = getTimerDisplayMs();
  const parts = msToParts(displayMs);
  const clockText = `${String(parts.hours).padStart(2, "0")}:${String(parts.minutes).padStart(2, "0")}:${String(parts.seconds).padStart(2, "0")}`;
  const changed = clockText !== lastClockText && lastClockText !== "";
  lastClockText = clockText;
  const markup = makeClockMarkup(parts, changed);
  els.flipClock.innerHTML = markup;
  els.fullscreenClock.innerHTML = markup;
  els.clockFullscreenMode.textContent = state.study.timer.mode === "timer" ? "Timer" : "Stopwatch";

  if (state.study.timer.running && state.study.timer.mode === "timer" && displayMs <= 0) {
    pauseStudyTimer();
  }
}

function makeClockMarkup(parts, animate) {
  const flipClass = animate ? " is-ticking" : "";
  return `
    <span class="flip-card${flipClass}">${String(parts.hours).padStart(2, "0")}</span>
    <span class="flip-separator">:</span>
    <span class="flip-card${flipClass}">${String(parts.minutes).padStart(2, "0")}</span>
    <span class="flip-separator">:</span>
    <span class="flip-card${flipClass}">${String(parts.seconds).padStart(2, "0")}</span>
  `;
}

function msToParts(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds };
}

function formatStudyDuration(ms) {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

function startOfDay(dateKey) {
  return new Date(`${dateKey}T00:00:00`);
}

function dateKeyFromOffset(dateKey, offset) {
  const date = startOfDay(dateKey);
  date.setDate(date.getDate() + offset);
  return toDateKey(date);
}

function getStudyTotalForDate(dateKey, includeActive = true) {
  const savedMs = state.study.sessions
    .filter((session) => session.date === dateKey)
    .reduce((total, session) => total + session.durationMs, 0);
  const timer = state.study.timer;
  const activeMs = includeActive && timer.sessionDate === dateKey ? getTimerElapsedMs() : 0;
  return savedMs + activeMs;
}

function getWeekKeys(dateKey) {
  const date = startOfDay(dateKey);
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return Array.from({ length: 7 }, (_, index) => dateKeyFromOffset(dateKey, mondayOffset + index));
}

function renderStudyStats() {
  const todayTotal = getStudyTotalForDate(state.study.selectedDate);
  const weekKeys = getWeekKeys(state.study.selectedDate);
  const weekTotal = weekKeys.reduce((total, key) => total + getStudyTotalForDate(key), 0);

  els.studyTodayTotal.textContent = `${formatStudyDuration(todayTotal)} today`;
  els.studyTodayHours.textContent = formatStudyDuration(todayTotal);
  els.studyWeekHours.textContent = formatStudyDuration(weekTotal);
  renderStudyDayGraph(todayTotal);
  renderStudyWeekGraph(weekKeys);
}

function renderStudyDayGraph(totalMs) {
  const maxHours = 6;
  const studiedHours = totalMs / 3600000;
  els.studyDayGraph.innerHTML = Array.from({ length: maxHours }, (_, index) => {
    const hour = index + 1;
    const height = Math.min(100, Math.max(3, (studiedHours / hour) * 100));
    const filled = studiedHours >= hour ? 100 : height;
    return `
      <div class="study-bar-item" title="${hour} hour target">
        <span class="study-bar" style="height: ${filled}%"></span>
        <span class="study-bar-label">${hour}h</span>
      </div>
    `;
  }).join("");
}

function renderStudyWeekGraph(weekKeys) {
  const totals = weekKeys.map((key) => getStudyTotalForDate(key));
  const maxTotal = Math.max(...totals, 60 * 60 * 1000);
  els.studyWeekGraph.innerHTML = weekKeys.map((key, index) => {
    const height = Math.max(3, Math.round((totals[index] / maxTotal) * 100));
    const label = startOfDay(key).toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2);
    return `
      <div class="study-bar-item" title="${label}: ${formatStudyDuration(totals[index])}">
        <span class="study-bar" style="height: ${height}%"></span>
        <span class="study-bar-label">${label}</span>
      </div>
    `;
  }).join("");
}

function updateTimerTargetFromInputs() {
  const hours = Math.max(0, Number(els.timerHours.value) || 0);
  const minutes = Math.max(0, Number(els.timerMinutes.value) || 0);
  const totalMinutes = Math.max(1, (hours * 60) + minutes);
  state.study.timer.targetMs = totalMinutes * 60 * 1000;
}

function startStudyTimer() {
  const timer = state.study.timer;
  if (timer.running) return;
  if (timer.mode === "timer") {
    updateTimerTargetFromInputs();
  }
  timer.startedAt = Date.now();
  timer.running = true;
  timer.sessionDate = state.study.selectedDate;
  saveState();
  renderStudyTime();
  startTimerTicker();
}

function pauseStudyTimer() {
  const timer = state.study.timer;
  if (timer.running) {
    timer.accumulatedMs = getTimerElapsedMs();
    timer.startedAt = null;
    timer.running = false;
    saveState();
  }
  renderStudyTime();
}

function resetStudyTimer() {
  state.study.timer.accumulatedMs = 0;
  state.study.timer.startedAt = null;
  state.study.timer.running = false;
  state.study.timer.sessionDate = state.study.selectedDate;
  saveState();
  renderStudyTime();
}

function saveStudySession() {
  pauseStudyTimer();
  const durationMs = state.study.timer.accumulatedMs;
  if (durationMs <= 0) return;
  state.study.sessions.push({
    id: uid(),
    date: state.study.timer.sessionDate || state.study.selectedDate,
    durationMs,
    mode: state.study.timer.mode,
    savedAt: new Date().toISOString()
  });
  state.study.timer.accumulatedMs = 0;
  state.study.timer.sessionDate = state.study.selectedDate;
  saveState();
  renderStudyTime();
}

function startTimerTicker() {
  if (timerTicker) return;
  timerTicker = window.setInterval(() => {
    if (!state.study.timer.running) {
      window.clearInterval(timerTicker);
      timerTicker = null;
      return;
    }
    updateFlipClock();
    renderStudyStats();
    saveState();
  }, 1000);
}

function renderScoreGraph() {
  const { days } = getMonthParts(state.month);
  const total = Math.max(state.habits.length, 1);
  els.scoreChart.style.setProperty("--days", days);
  els.scoreChart.innerHTML = Array.from({ length: days }, (_, index) => {
    const day = index + 1;
    const key = dateForDay(day);
    const done = state.habits.filter((habit) => habit.checks[key]).length;
    const height = Math.max(4, Math.round((done / total) * 100));
    return `
      <button class="score-day" type="button" data-score-date="${key}" title="Day ${day}: ${done} of ${state.habits.length} habit(s) done">
        <span class="score-bar" style="height: ${height}%"></span>
        <span class="score-label">${day}</span>
      </button>
    `;
  }).join("");
}

function createTaskRow({ text, checked, removable = true, editable = false }) {
  const row = els.taskTemplate.content.firstElementChild.cloneNode(true);
  row.querySelector("input").checked = checked;
  const label = row.querySelector("span");
  label.textContent = text;
  label.contentEditable = editable ? "true" : "false";
  label.classList.toggle("is-editable", editable);
  row.querySelector("button").hidden = !removable || !editable;
  return row;
}

function renderChat() {
  els.chatLog.innerHTML = state.chat
    .map((message) => `<div class="message ${message.from}">${escapeHtml(message.text)}</div>`)
    .join("");
  els.chatLog.scrollTop = els.chatLog.scrollHeight;
}

function setAssistantOpen(isOpen) {
  els.assistantOverlay.hidden = !isOpen;
  els.assistantOpen.classList.toggle("is-open", isOpen);
  els.assistantOpen.setAttribute("aria-expanded", String(isOpen));
  if (isOpen) {
    els.chatInput.focus();
  }
}

function makePages(topic) {
  const cleanTopic = topic.trim();
  if (!cleanTopic) return;

  state.pages = [
    {
      title: `What is ${cleanTopic}?`,
      body: `${cleanTopic} is the main subject of this notebook. Start with a short definition, then write the one problem it helps you understand or solve.`,
      notes: [
        ["Main idea", `${cleanTopic} should first be reduced to one clear sentence. This gives your brain a handle before the details arrive.`],
        ["Why it matters", `Once the definition is clear, connect it to a real need: a problem, a skill, an exam question, or a project use.`],
        ["Mini task", `Write: "${cleanTopic} means..." and then add one example from your own life or studies.`]
      ],
      visual: "idea"
    },
    {
      title: `Why do we need ${cleanTopic}?`,
      body: `A topic becomes easier when you know its purpose. Note where ${cleanTopic} is useful, what confusion it removes, and what skill improves after learning it.`,
      notes: [
        ["Purpose", `Most topics exist because they solve confusion, save effort, organize information, or help people make better decisions.`],
        ["Use cases", `List three situations where ${cleanTopic} appears. If you cannot list them yet, search your textbook, class notes, or project examples.`],
        ["Remember", `A useful topic can be explained as: before learning it, this was hard; after learning it, this becomes easier.`]
      ],
      visual: "warning"
    },
    {
      title: `Core parts of ${cleanTopic}`,
      body: `Break ${cleanTopic} into small blocks. Learn the names first, then connect each block with a simple arrow or cause-effect line.`,
      notes: [
        ["Chunking", `Split the topic into 3 to 5 parts. Too many parts will feel noisy; too few parts will hide the structure.`],
        ["Connection", `Draw arrows between the parts and label the arrows with words like causes, uses, stores, changes, checks, or depends on.`],
        ["Study move", `Learn one block at a time, then explain how that block connects to the next one.`]
      ],
      visual: "blocks"
    },
    {
      title: `${cleanTopic} in simple words`,
      body: `Explain ${cleanTopic} like you are teaching a friend. Use plain language, one example, and avoid memorizing heavy sentences first.`,
      notes: [
        ["Plain version", `Use daily words before technical words. Technical accuracy is easier after the simple model is stable.`],
        ["Teaching test", `If you can explain ${cleanTopic} to a beginner in under one minute, you probably understand the foundation.`],
        ["Improve it", `After the simple explanation, add one correct term from your notes so the answer becomes exam-ready.`]
      ],
      visual: "speech"
    },
    {
      title: `Step-by-step flow`,
      body: `Write the usual order: first idea, next action, result, and final check. Flow pages are useful when a topic has a process.`,
      notes: [
        ["Flow line", `Start with input or starting condition, then action, change, output, and check. This works for processes, code, science, and systems.`],
        ["Signal words", `Use first, next, because, therefore, finally. These words make your answer feel organized.`],
        ["Practice", `Close the page and redraw the flow from memory. Then compare missing steps.`]
      ],
      visual: "flow"
    },
    {
      title: `Key terms`,
      body: `List important words from ${cleanTopic}. Beside every word, write a tiny meaning and one clue that helps you remember it.`,
      notes: [
        ["Term list", `Collect important vocabulary, symbols, rules, tools, or formulas. Keep definitions short at first.`],
        ["Memory clue", `Attach each term to a clue: a picture, contrast, example, abbreviation, or common use.`],
        ["Revision", `Cover the meaning column and try recalling the definition only from the term.`]
      ],
      visual: "terms"
    },
    {
      title: `Common mistakes`,
      body: `Mistakes show what to revise. Write 2 or 3 traps people face in ${cleanTopic}, then add the correct way beside each one.`,
      notes: [
        ["Trap", `A mistake is often a mixed definition, skipped step, wrong assumption, or using the topic in the wrong situation.`],
        ["Correction", `For each mistake, write the correction in a positive form: do this, check this, compare this.`],
        ["Exam use", `Common mistakes make strong revision questions because they show where marks are usually lost.`]
      ],
      visual: "mistakes"
    },
    {
      title: `Example page`,
      body: `Take one real example of ${cleanTopic}. Mark what is happening, why it works, and which part of the topic it proves.`,
      notes: [
        ["Example", `Choose an example small enough to fit on one page. Large examples hide the lesson inside too much detail.`],
        ["Marking", `Underline the part where ${cleanTopic} is actually being used. Label the reason it works.`],
        ["Transfer", `Now change one detail in the example and predict what changes. This tests real understanding.`]
      ],
      visual: "example"
    },
    {
      title: `Practice question`,
      body: `Create one small question about ${cleanTopic}. Try answering without notes, then compare and improve the answer in one line.`,
      notes: [
        ["Question type", `Use one definition question, one why question, and one apply question. Together they test memory and understanding.`],
        ["Answer frame", `Start with a direct answer, add a reason, then add a small example. This creates a complete response.`],
        ["Score check", `Mark your answer out of 3: clarity, correctness, and example. Revise the lowest score first.`]
      ],
      visual: "practice"
    },
    {
      title: `Revision map`,
      body: `Before closing ${cleanTopic}, revise definition, purpose, key parts, mistakes, and one example. Mark the weakest page to study again.`,
      notes: [
        ["Map", `Your final map should show definition, purpose, core parts, flow, mistakes, and example in one connected view.`],
        ["Weak point", `Pick the page that felt slowest or most confusing. That page becomes tomorrow's first revision target.`],
        ["Finish", `Say the topic aloud in five sentences. If one sentence breaks, return to the matching page.`]
      ],
      visual: "revision"
    }
  ];
  state.pageIndex = 0;
  saveState();
  renderStudyPage();
}

function renderStudyPage() {
  const pages = state.pages?.length ? state.pages : [];
  const page = pages[state.pageIndex];
  if (!page) {
    els.pageNumber.textContent = "Page 1 of 10";
    els.pageTitle.textContent = "Enter a topic to prepare study pages.";
    els.pageBody.textContent = "Your notebook-style pages will appear here with simple diagrams, key points, examples, and revision notes.";
    els.pageVisual.innerHTML = makeVisual("idea", "Topic");
    return;
  }

  els.pageNumber.textContent = `Page ${state.pageIndex + 1} of ${pages.length}`;
  els.pageTitle.textContent = page.title;
  els.pageBody.innerHTML = renderPageNotes(page);
  els.pageVisual.innerHTML = makeVisual(page.visual, page.title);
}

function renderPageNotes(page) {
  const notes = page.notes?.length
    ? page.notes
    : [
        ["Main idea", page.body || "Add more information for this page."],
        ["Add detail", "Connect this page to a definition, one key reason, and one small example so the topic becomes easier to revise."],
        ["Quick check", "Close the note and explain this page in your own words. If the answer feels weak, rewrite the simplest sentence first."]
      ];

  return notes.map(([label, text]) => `
    <div class="note-block">
      <span class="note-label">${escapeHtml(label)}</span>
      <p class="note-text">${escapeHtml(text)}</p>
    </div>
  `).join("");
}

function makeVisual(type, title) {
  const safeTitle = escapeHtml(title.split(" ").slice(0, 3).join(" "));
  const visuals = {
    idea: `<svg viewBox="0 0 220 110" role="img"><circle cx="42" cy="42" r="25" fill="#ffe28a" stroke="#1f2523" stroke-width="3"/><path d="M42 25v20l13 10" fill="none" stroke="#1f2523" stroke-width="4" stroke-linecap="round"/><path d="M86 38h92M86 65h68M86 88h104" stroke="#1f2523" stroke-width="4" stroke-linecap="round"/><text x="28" y="98" class="svg-label">idea</text></svg>`,
    warning: `<svg viewBox="0 0 220 110" role="img"><path d="M36 84 72 20l36 64z" fill="#ff8b72" stroke="#1f2523" stroke-width="4"/><path d="M72 42v20M72 72v3" stroke="#1f2523" stroke-width="5" stroke-linecap="round"/><path d="M130 32c22 0 36 14 36 32s-14 32-36 32" fill="none" stroke="#1f2523" stroke-width="4"/><path d="M130 50h55M130 70h42" stroke="#3d75b8" stroke-width="4" stroke-linecap="round"/></svg>`,
    blocks: `<svg viewBox="0 0 220 110" role="img"><rect x="18" y="24" width="48" height="40" fill="#eaf2ff" stroke="#1f2523" stroke-width="3"/><rect x="86" y="24" width="48" height="40" fill="#d9eee4" stroke="#1f2523" stroke-width="3"/><rect x="154" y="24" width="48" height="40" fill="#ffe9f1" stroke="#1f2523" stroke-width="3"/><path d="M66 44h20M134 44h20M42 76h136" stroke="#1f2523" stroke-width="4" stroke-linecap="round"/><text x="52" y="98" class="svg-label">${safeTitle}</text></svg>`,
    speech: `<svg viewBox="0 0 220 110" role="img"><path d="M28 26h120a16 16 0 0 1 16 16v22a16 16 0 0 1-16 16H78l-30 20 8-20H28a16 16 0 0 1-16-16V42a16 16 0 0 1 16-16z" fill="#fff7d6" stroke="#1f2523" stroke-width="3"/><path d="M40 48h86M40 64h62" stroke="#1f2523" stroke-width="4" stroke-linecap="round"/><circle cx="188" cy="42" r="18" fill="#d9eee4" stroke="#1f2523" stroke-width="3"/></svg>`,
    flow: `<svg viewBox="0 0 220 110" role="img"><circle cx="38" cy="55" r="20" fill="#d9eee4" stroke="#1f2523" stroke-width="3"/><rect x="86" y="35" width="50" height="40" fill="#fff7d6" stroke="#1f2523" stroke-width="3"/><circle cx="182" cy="55" r="20" fill="#eaf2ff" stroke="#1f2523" stroke-width="3"/><path d="M58 55h28M136 55h26" stroke="#1f2523" stroke-width="4" stroke-linecap="round"/><path d="m78 47 8 8-8 8M154 47l8 8-8 8" fill="none" stroke="#1f2523" stroke-width="4" stroke-linecap="round"/></svg>`,
    terms: `<svg viewBox="0 0 220 110" role="img"><rect x="24" y="20" width="172" height="70" rx="0" fill="#fffefa" stroke="#1f2523" stroke-width="3"/><path d="M48 38h52M48 56h78M48 74h60M142 38h30M142 56h20M142 74h38" stroke="#1f2523" stroke-width="4" stroke-linecap="round"/><path d="M128 24v62" stroke="#d45d8a" stroke-width="3"/></svg>`,
    mistakes: `<svg viewBox="0 0 220 110" role="img"><path d="m42 34 34 34M76 34 42 68" stroke="#d45d8a" stroke-width="7" stroke-linecap="round"/><path d="m128 64 20 18 38-48" fill="none" stroke="#1f7a65" stroke-width="7" stroke-linecap="round"/><path d="M28 88h168" stroke="#1f2523" stroke-width="3" stroke-dasharray="7 7"/></svg>`,
    example: `<svg viewBox="0 0 220 110" role="img"><rect x="26" y="24" width="70" height="56" fill="#eaf2ff" stroke="#1f2523" stroke-width="3"/><path d="M116 36h70M116 54h48M116 72h62" stroke="#1f2523" stroke-width="4" stroke-linecap="round"/><path d="M46 52h30M61 37v30" stroke="#3d75b8" stroke-width="5" stroke-linecap="round"/></svg>`,
    practice: `<svg viewBox="0 0 220 110" role="img"><circle cx="54" cy="50" r="24" fill="#ffe28a" stroke="#1f2523" stroke-width="3"/><text x="47" y="60" class="svg-big">?</text><path d="M100 38h82M100 58h64M100 78h88" stroke="#1f2523" stroke-width="4" stroke-linecap="round"/></svg>`,
    revision: `<svg viewBox="0 0 220 110" role="img"><path d="M54 32h110a16 16 0 0 1 16 16v20a16 16 0 0 1-16 16H54a16 16 0 0 1-16-16V48a16 16 0 0 1 16-16z" fill="#d9eee4" stroke="#1f2523" stroke-width="3"/><path d="m72 58 16 14 34-36" fill="none" stroke="#1f7a65" stroke-width="6" stroke-linecap="round"/><path d="M132 50h30M132 66h20" stroke="#1f2523" stroke-width="4" stroke-linecap="round"/></svg>`
  };
  return visuals[type] || visuals.idea;
}

function syncEditControls() {
  els.taskEditToggle.textContent = taskEditMode ? "Done editing" : "Edit tasks";
  els.taskEditToggle.classList.toggle("is-active", taskEditMode);
  els.addPrimary.hidden = !taskEditMode;
  els.addSecondary.hidden = false;
}

function syncSchedulePanel() {
  document.querySelector(".daily-area").classList.toggle("is-open", scheduleOpen);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

els.monthInput.addEventListener("change", (event) => {
  state.selectedDate = event.target.value;
  state.month = state.selectedDate.slice(0, 7);
  scheduleOpen = true;
  renderAll();
});

els.prevMonth.addEventListener("click", () => {
  const date = new Date(`${state.selectedDate}T12:00:00`);
  date.setDate(date.getDate() - 1);
  state.selectedDate = toDateKey(date);
  state.month = state.selectedDate.slice(0, 7);
  scheduleOpen = true;
  renderAll();
});

els.nextMonth.addEventListener("click", () => {
  const date = new Date(`${state.selectedDate}T12:00:00`);
  date.setDate(date.getDate() + 1);
  state.selectedDate = toDateKey(date);
  state.month = state.selectedDate.slice(0, 7);
  scheduleOpen = true;
  renderAll();
});

els.appTabs.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-tab]");
  if (!tab) return;
  setActiveTab(tab.dataset.tab);
});

els.selectedDate.addEventListener("change", (event) => {
  state.selectedDate = event.target.value;
  state.month = state.selectedDate.slice(0, 7);
  scheduleOpen = true;
  renderAll();
});

els.primaryTable.addEventListener("click", (event) => {
  const check = event.target.closest("[data-habit]");
  const deleteButton = event.target.closest("[data-delete-habit]");

  if (check) {
    const habit = state.habits.find((item) => item.id === check.dataset.habit);
    habit.checks[check.dataset.date] = !habit.checks[check.dataset.date];
    state.selectedDate = check.dataset.date;
    scheduleOpen = true;
    renderAll();
  }

  if (deleteButton && taskEditMode) {
    if (!confirm("Delete this habit? This cannot be undone.")) return;
    state.habits = state.habits.filter((habit) => habit.id !== deleteButton.dataset.deleteHabit);
    renderAll();
  }
});

els.scoreChart.addEventListener("click", (event) => {
  const button = event.target.closest("[data-score-date]");
  if (!button) return;
  state.selectedDate = button.dataset.scoreDate;
  scheduleOpen = true;
  renderAll();
});

els.primaryTable.addEventListener("input", (event) => {
  if (!taskEditMode) return;
  const editable = event.target.closest("[data-habit-name]");
  if (!editable) return;
  const habit = state.habits.find((item) => item.id === editable.dataset.habitName);
  habit.name = editable.textContent.trim() || "Untitled habit";
  saveState();
  renderDailyTasks();
});

els.taskEditToggle.addEventListener("click", () => {
  taskEditMode = !taskEditMode;
  renderAll();
});

els.addPrimary.addEventListener("click", () => {
  if (!taskEditMode) return;
    state.habits.push({
    id: uid(),
    name: "New habit",
    order: state.habits.length,
    checks: {}
  });
  renderAll();
});

els.addSecondary.addEventListener("click", () => {
  getSecondaryTasks().push({
    id: uid(),
    text: "New daily task",
    checked: false
  });
  renderAll();
});

els.studyDate.addEventListener("change", (event) => {
  state.study.selectedDate = event.target.value;
  renderAll();
});

els.addStudyTask.addEventListener("click", () => {
  getStudyTasks().push({
    id: uid(),
    text: "New study task",
    checked: false
  });
  renderAll();
});

els.modeTimer.addEventListener("click", () => {
  if (state.study.timer.running) return;
  state.study.timer.mode = "timer";
  updateTimerTargetFromInputs();
  saveState();
  renderStudyTime();
});

els.modeStopwatch.addEventListener("click", () => {
  if (state.study.timer.running) return;
  state.study.timer.mode = "stopwatch";
  saveState();
  renderStudyTime();
});

[els.timerHours, els.timerMinutes].forEach((input) => {
  input.addEventListener("change", () => {
    if (state.study.timer.running) return;
    updateTimerTargetFromInputs();
    saveState();
    renderStudyTime();
  });
});

els.timerActionGroups.forEach((group) => {
  group.addEventListener("click", (event) => {
    const button = event.target.closest("[data-timer-action]");
    if (!button) return;
    const action = button.dataset.timerAction;
    if (action === "start") startStudyTimer();
    if (action === "pause") pauseStudyTimer();
    if (action === "reset") resetStudyTimer();
    if (action === "save") saveStudySession();
    if (action === "fullscreen") {
      els.clockFullscreen.hidden = false;
      updateFlipClock();
    }
  });
});

els.clockFullscreenClose.addEventListener("click", () => {
  els.clockFullscreen.hidden = true;
});

els.gymProfileCard.addEventListener("click", showGymProfileForm);

els.gymProfileCancel.addEventListener("click", showGymDashboard);

els.gymActivityList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-activity]");
  if (!button) return;
  const activity = state.gym.activities.find((item) => item.id === button.dataset.activity);
  if (!activity) return;
  if (!activity.checks) activity.checks = {};
  const key = gymDateKey();
  activity.checks[key] = !activity.checks[key];
  renderGym();
  saveState();
});

els.gymActivityEdit.addEventListener("click", () => {
  state.gym.activityEditorOpen = !state.gym.activityEditorOpen;
  renderGym();
  saveState();
});

els.gymAddActivity.addEventListener("click", () => {
  const text = els.gymNewActivity.value.trim();
  if (!text) return;
  state.gym.activities.push({
    id: uid(),
    text,
    locked: false,
    checks: {}
  });
  els.gymNewActivity.value = "";
  renderGym();
  saveState();
});

els.gymSaveActivity.addEventListener("click", () => {

  state.gym.activityEditorOpen = false;
  renderGym();
  saveState();
});

els.gymActivityEditList.addEventListener("input", (event) => {
  const activityId = event.target.dataset.editActivity;
  if (!activityId) return;
  const activity = state.gym.activities.find((item) => item.id === activityId);
  if (!activity) return;
  activity.text = event.target.value.trim() || "New activity";
  renderGymActivities();
  saveState();
});

els.gymAddMeal.addEventListener("click", () => {
  getGymMeals().push({
    id: uid(),
    name: "<New Meal Name>",
    protein: 0,
    calories: 0
  });
  renderGym();
  saveState();
});

els.gymAddFixedMeal.addEventListener("click", () => {
  const meals = getGymMeals();
  if (!meals.length) {
    meals.push({
      id: uid(),
      name: "<Fixed Meal Name>",
      protein: 0,
      calories: 0,
      fixed: true,
      enabled: false
    });
  } else {
    state.gym.fixedMeals = meals.map((meal) => ({
      id: uid(),
      fixedId: meal.fixedId || uid(),
      name: meal.name,
      protein: Number(meal.protein) || 0,
      calories: Number(meal.calories) || 0
    }));
  }
  renderGym();
  saveState();
});

els.gymMealRows.addEventListener("input", (event) => {
  const field = event.target.dataset.mealField;
  if (!field) return;
  const row = event.target.closest("[data-meal]");
  const meal = getGymMeals().find((item) => item.id === row.dataset.meal);
  if (!meal) return;
  meal[field] = field === "name" ? event.target.value : Math.max(0, Number(event.target.value) || 0);
  if (meal.fixed || meal.fixedId) {
    syncFixedMealFromDaily(meal);
  }
  updateGymCalorieHeader();
  saveState();
});

els.gymMealRows.addEventListener("click", (event) => {
  const toggleButton = event.target.closest("[data-toggle-meal]");
  if (toggleButton) {
    const meal = getGymMeals().find((item) => item.id === toggleButton.dataset.toggleMeal);
    if (!meal) return;
    meal.enabled = meal.enabled === false;
    updateGymCalorieHeader();
    renderGymMeals();
    saveState();
    return;
  }

  const deleteButton = event.target.closest("[data-delete-meal]");
  if (!deleteButton) return;
  if (!confirm("Delete this meal?")) return;
  const key = gymDateKey();
  state.gym.meals[key] = getGymMeals().filter((meal) => meal.id !== deleteButton.dataset.deleteMeal);
  renderGym();
  saveState();
});

[els.gymHeight, els.gymWeight, els.gymAge, els.gymGender, els.gymTarget, els.gymCalorieChoice, els.gymCustomCalories].forEach((input) => {
  input.addEventListener("input", () => {
    const draftProfile = {
      name: els.gymName.value.trim(),
      height: els.gymHeight.value.trim(),
      weight: els.gymWeight.value.trim(),
      age: els.gymAge.value.trim(),
      gender: els.gymGender.value,
      target: els.gymTarget.value,
      calorieChoice: els.gymCalorieChoice.value,
      customCalories: els.gymCustomCalories.value.trim()
    };
    const plan = calculateCaloriePlan(draftProfile);
    els.gymMaintenanceCalories.textContent = plan.maintenance ? `${plan.maintenance} kcal` : "-- kcal";
    els.gymCutCalories.textContent = plan.cut ? `${plan.cut} kcal` : "-- kcal";
    els.gymBulkCalories.textContent = plan.bulk ? `${plan.bulk} kcal` : "-- kcal";
    els.gymRecommendedCalories.textContent = plan.recommended ? `${plan.recommended} kcal` : "-- kcal";
  });
});

els.gymProfileForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.gym.profile = {
    name: els.gymName.value.trim(),
    height: els.gymHeight.value.trim(),
    weight: els.gymWeight.value.trim(),
    age: els.gymAge.value.trim(),
    gender: els.gymGender.value,
    target: els.gymTarget.value,
    calorieChoice: els.gymCalorieChoice.value,
    customCalories: els.gymCustomCalories.value.trim()
  };
  state.gym.profileView = "dashboard";
  saveState();
  renderGym();
});

els.chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = els.chatInput.value.trim();
  if (!text) return;
  
  // Add user message immediately
  state.chat.push({ from: "user", text });
  els.chatInput.value = "";
  renderAll();

  // Add temporary typing indicator (optional but good for UX)
  state.chat.push({ from: "bot", text: "..." });
  renderAll();

  try {
    const openPrimary = state.habits.filter((habit) => !habit.checks[state.selectedDate]).length;
    const openSecondary = getSecondaryTasks().filter((task) => !task.checked).length;

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: text,
        context: {
          date: els.selectedDayLabel.textContent,
          openPrimary,
          openSecondary
        }
      })
    });

    // Remove typing indicator
    state.chat.pop();

    if (response.ok) {
      const data = await response.json();
      state.chat.push({ from: "bot", text: data.reply });
    } else {
      // If API fails (e.g. not hosted on Vercel yet, or missing keys)
      state.chat.push({ from: "bot", text: "⚠️ API Error: Please ensure you are hosted on Vercel and your .env AI keys are configured." });
    }
  } catch (error) {
    state.chat.pop();
    state.chat.push({ from: "bot", text: "⚠️ Offline or network error. Please check your connection." });
  }
  
  renderAll();
});

els.assistantOpen.addEventListener("click", () => {
  setAssistantOpen(els.assistantOverlay.hidden);
});

els.assistantClose.addEventListener("click", () => {
  setAssistantOpen(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !els.assistantOverlay.hidden) {
    setAssistantOpen(false);
  }
});

els.topicForm.addEventListener("submit", (event) => {
  event.preventDefault();
  makePages(els.topicInput.value);
});

els.prevPage.addEventListener("click", () => {
  if (!state.pages?.length) return;
  state.pageIndex = (state.pageIndex - 1 + state.pages.length) % state.pages.length;
  renderStudyPage();
  saveState();
});

els.nextPage.addEventListener("click", () => {
  if (!state.pages?.length) return;
  state.pageIndex = (state.pageIndex + 1) % state.pages.length;
  renderStudyPage();
  saveState();
});

renderAll();
startTimerTicker();

// Auto-resume timer if it was running when page closed
if (state.study.timer.running && state.study.timer.startedAt) {
  startTimerTicker();
}

// ── Kebab Menu ────────────────────────────────────────

els.kebabToggle.addEventListener("click", () => {
  const isOpen = els.kebabDropdown.hidden;
  els.kebabDropdown.hidden = !isOpen;
});

document.addEventListener("click", (event) => {
  if (!els.kebabMenu.contains(event.target)) {
    els.kebabDropdown.hidden = true;
  }
});

// ── Dark Mode ──────────────────────────────────────────

function applyTheme() {
  document.documentElement.setAttribute("data-theme", state.darkMode ? "dark" : "light");
  const label = els.themeToggle.querySelector("span:last-child");
  if (label) label.textContent = state.darkMode ? "Light mode" : "Dark mode";
}

els.themeToggle.addEventListener("click", () => {
  state.darkMode = !state.darkMode;
  applyTheme();
  saveState();
});

// ── Fullscreen Dark/Light Toggle ──────────────────────

els.clockThemeToggle.addEventListener("click", () => {
  const fs = els.clockFullscreen;
  const isDark = fs.classList.toggle("is-dark");
  els.clockThemeToggle.textContent = isDark ? "Light" : "Dark";
});

// ── Data Export ───────────────────────────────────────

els.exportData.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `your-day-backup-${toDateKey(new Date())}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

// ── Data Import ───────────────────────────────────────

els.importData.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!confirm("This will replace all your current data. Continue?")) return;
      const today = toDateKey(new Date());
      const fallback = { ...state };
      Object.assign(state, normalizeState({ ...fallback, ...imported }, fallback));
      renderAll();
    } catch {
      alert("Invalid backup file.");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
});

// ── Service Worker ────────────────────────────────────

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
