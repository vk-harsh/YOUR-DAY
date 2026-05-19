# Your Day 📝

A beautiful, zero-dependency daily planner inspired by physical paper notebooks. Track habits, time your study sessions, manage your gym routine, and generate study pages — all from a single browser tab.

## Features ✨

### 📋 Day Tracker
![Day Tracker](screenshot-day.jpeg)

- **Monthly Habit Grid** — rows for habits, columns for each day of the month; click to check off
- **Score Graph** — visual bar chart showing daily completion percentage
- **Primary Tasks** — recurring habits synced with the monthly grid
- **Secondary Tasks** — one-off tasks for any specific day
- **Edit Mode** — rename, add, or delete habits inline

### ⏱️ Study Time
![Study Time](screenshot-study.jpeg)

- **Flip Clock Timer** — stopwatch or countdown mode with a fullscreen option
- **Session Tracking** — saves study sessions with date, duration, and mode
- **Study Stats** — today/week hours with day and week bar charts
- **Session Tasks** — per-date to-do list for study goals

### 💪 GYM & Health
![GYM & Health](screenshot-gym.jpeg)

- **Profile Setup** — name, height, weight, age, gender, fitness target
- **Calorie Planner** — auto-calculates Maintenance / Cut / Bulk / Recommended calories (Mifflin-St Jeor)
- **Activity Tracker** — customizable daily activities with check-off tracking
- **Diet Table** — per-day meals with protein and calorie tracking, fixed meal templates
- **Weekly Health Graph** — composite score (activity + diet) over 7 days

### 📚 Learning Desk
![Learning Desk](screenshot-learning.jpeg)

- Enter any topic and generate **10 structured notebook pages** with SVG diagrams
- Covers definition, purpose, core parts, flow, key terms, common mistakes, examples, practice questions, and revision maps

### 🤖 AI Assistant
- Floating chatbot button with planning suggestions
- Keyword-based responses for task planning, habit advice, and study guidance

### 🌙 Dark Mode
- Full dark theme toggle via the menu (⋮) button
- Independent dark/light toggle in the fullscreen timer

### 💾 Data Management
- **Export** — download all data as a JSON backup file
- **Import** — restore data from a backup file
- **Offline Support** — PWA with service worker caching

## Day-Wise Navigation

The app is centered around **a single selected day**. The topbar date picker and `<` `>` buttons navigate one day at a time. The monthly habit grid, daily tasks, gym activities, and diet all sync to the selected date.

## Getting Started 🚀

1. Clone this repository:
   ```bash
   git clone https://github.com/vk-harsh/To-Do-List.git
   ```
2. Navigate to the project directory:
   ```bash
   cd To-Do-List
   ```
3. Serve it locally:
   ```bash
   npx serve .
   ```
   Or simply open `index.html` in any modern browser.

## Tech Stack 💻

| Technology | Usage |
|-----------|-------|
| **HTML5** | Semantic structure, single `<main>`, accessibility attributes |
| **CSS3** | Paper notebook aesthetic, CSS-only icons, dark mode, 4 responsive breakpoints |
| **JavaScript** | State management, localStorage persistence, service worker |

Zero frameworks. Zero build tools. Zero dependencies.

## Project Structure

```
Your Day/
├── index.html      # App shell — all tabs, overlays, templates
├── styles.css      # Design system — paper theme, dark mode, responsive
├── app.js          # All logic — state, rendering, events
├── manifest.json   # PWA manifest
├── sw.js           # Service worker for offline caching
└── screenshot.jpeg # Preview image
```

## License 📄

This project is open-source and available for anyone to use and modify.
