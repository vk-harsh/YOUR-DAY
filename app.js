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
let scheduleOpen = false;

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

function loadState() {
  const now = new Date();
  const today = toDateKey(now);
  const fallback = {
    month: today.slice(0, 7),
    selectedDate: today,
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
    pageIndex: 0
  };

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved ? { ...fallback, ...saved } : fallback;
  } catch {
    return fallback;
  }
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
  if (!state.selectedDate.startsWith(state.month)) {
    state.selectedDate = `${state.month}-01`;
  }
}

function renderAll() {
  ensureSelectedDateInMonth();
  els.monthInput.value = state.month;
  els.selectedDate.value = state.selectedDate;
  renderHabitTable();
  renderScoreGraph();
  renderDailyTasks();
  renderChat();
  renderStudyPage();
  syncEditControls();
  syncSchedulePanel();
  saveState();
}

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

function assistantReply(input) {
  const openPrimary = state.habits.filter((habit) => !habit.checks[state.selectedDate]).length;
  const openSecondary = getSecondaryTasks().filter((task) => !task.checked).length;
  const lower = input.toLowerCase();

  if (lower.includes("study") || lower.includes("learn") || lower.includes("topic")) {
    return "Add the topic in the Learning Desk. I will prepare 10 notebook-style pages with small visual diagrams for revision.";
  }

  if (lower.includes("today") || lower.includes("plan")) {
    return `For ${els.selectedDayLabel.textContent}, you have ${openPrimary} primary habit(s) and ${openSecondary} secondary task(s) open. Start with the smallest one to build momentum.`;
  }

  if (lower.includes("habit")) {
    return "Keep primary habits stable and repeatable. Use secondary tasks only for things that belong to this specific day.";
  }

  return "I can help organize tasks, suggest a daily order, or turn a learning topic into notebook pages.";
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
  state.month = event.target.value;
  ensureSelectedDateInMonth();
  renderAll();
});

els.prevMonth.addEventListener("click", () => {
  const [year, month] = state.month.split("-").map(Number);
  const date = new Date(year, month - 2, 1);
  state.month = toDateKey(date).slice(0, 7);
  ensureSelectedDateInMonth();
  renderAll();
});

els.nextMonth.addEventListener("click", () => {
  const [year, month] = state.month.split("-").map(Number);
  const date = new Date(year, month, 1);
  state.month = toDateKey(date).slice(0, 7);
  ensureSelectedDateInMonth();
  renderAll();
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

els.chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = els.chatInput.value.trim();
  if (!text) return;
  state.chat.push({ from: "user", text });
  state.chat.push({ from: "bot", text: assistantReply(text) });
  els.chatInput.value = "";
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
