# Sylva — Personal Carbon Calculator & Climate Dashboard

**Sylva** is a premium, ambient web application designed to help individuals calculate their carbon footprint, adopt sustainable climate habits, track achievements, and interact with **Gaia**, a smart AI climate coach.

Featuring responsive layouts, rich aesthetics, dynamic animations, and cloud synchronization, Sylva engages users to understand their environmental impact and actively lower emissions.

---

## 🌟 Key Features

### 1. Interactive Carbon Calculator (`index.html`)
- **Step-by-step Questionnaire**: Simple sliders and options across major emission sectors:
  - **Transport**: Annual driving distance, public transit usage, short-haul, and long-haul flight counts.
  - **Energy**: Household size, electricity usage, green renewable energy shares, and winter heating habits.
  - **Food**: Frequency of meat consumption and sourcing of organic or locally-farmed groceries.
- **Real-Time Score**: Instant net footprint update metrics dynamically calculated as you fill out the inputs.

### 2. Carbon Analytics & Habits Dashboard (`dashboard.html`)
- **Sector Breakdown Donut Chart**: Interactive SVG donut chart rendering emissions allocation. Clicking a chart category redirects you to Gaia Coach with a targeted query.
- **Global Comparisons Tracker**: Interactive benchmark bar tracking how your net score compares to the Paris Accord Target (2.0t), World Average (4.5t), EU Average (6.5t), and US Average (16.0t).
- **Sustainable Actions Checklist**: Adopt verified eco-challenges (e.g., carpooling, meatless days, gadget longevity) to reduce your net footprint and earn Experience Points (XP).

### 3. Gaia AI Climate Coach (`assistant.html`)
- **Context-Aware Coaching**: Gaia automatically analyzes your carbon footprint sector breakdown to deliver personalized advice.
- **Interactive Chat**: Ask questions or select quick inquiry chips (Transit, Energy, Diet, Offsets) with fluid message-bubble rendering and animated typing indicators.

### 4. Profile & Settings (`profile.html`)
- **Identity & Level progression**: Displays user level, carbon saving badges (e.g., Leaf Cadet, Gaia Guardian), and animated XP progress bars.
- **Google Sign-In**: Powered by Firebase Auth with a glassmorphic authentication status header.
- **Local Photo Upload Engine**: Crop, square-center, and compress any local image file to a lightweight data URL avatar that syncs to the cloud.
- **Data Export & Reset Actions**: Backup all details (questionnaire entries, habits, chat logs) as a JSON file or wipe data to start fresh.

---

## 🎨 Design & Aesthetic Elements

- **Live Ambient Forest Wallpaper**: Canvas-based background animation rendering a moving forest canopy with responsive glowing light orbs.
- **Glassmorphism Theme**: Translucent cards utilizing `backdrop-filter: blur()`, clean borders, and soft gradients.
- **Micro-Animations**: Elastic jiggles on interactive headers, spring buttons, and level progress shimmers.
- **Custom Trailing Cursor**: Ambient custom circular cursor trailing that shifts color and size reactively upon hovering over interactive components.

---

## 🛠️ Tech Stack & Architecture

- **Core**: HTML5, Vanilla CSS3 (custom CSS variables, CSS grid/flexbox), ES6 Modules Javascript.
- **Bundler & Dev Server**: [Vite](https://vitejs.dev/)
- **Database / Auth Layer**: Firebase Auth & Cloud Firestore.
- **Local Fallback (Demo Mode)**: If Firebase credentials are unconfigured, Sylva automatically executes in Local Demo Mode, simulating all cloud operations inside browser cache storage.

---

## 🚀 Setup & Installation

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed.

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
Open **http://localhost:3000** in your browser.

### 3. Run Math Unit Tests
Verify carbon footprint calculator models:
```bash
npm test
```

### 4. Build Production Bundle
Build and minify assets for deployment:
```bash
npm run build
```
Vite compiles all entry pages into the `/dist` output directory.

---

## 📈 Quality, Security & Optimization Audit Outcomes

Sylva has been audited to maintain a **98%+ rating** across Lighthouse metrics:

- **Security (XSS Mitigation)**: All user inputs (names, emails, chat fields) are programmatically sanitized through a secure HTML-escape utility (`escapeHTML`) before rendering in `.innerHTML` blocks.
- **SEO Optimization**: Unique titles, viewport metrics, and specific description tags are declared in all pages' headers to improve search engine discoverability.
- **Accessibility (a11y)**: Every decorative SVG uses `aria-hidden="true"`, and interactive elements use semantic labels to accommodate screen readers and keyboard navigation.
- **Clean Bundle Size**: Vite Rollup config splits assets cleanly, optimizing page loading speeds.
