# 🎯 Day 38 : 45 Days Coding Challenge Cyber Aim - Neural Reflex Trainer

> **A high-performance reflex training simulation built to demonstrate complex state management and 60FPS animations in React.**

![Project Status](https://img.shields.io/badge/Status-Operational-00f3ff?style=for-the-badge)
![Deployment](https://img.shields.io/badge/Deployed_on-Vercel-black?style=for-the-badge&logo=vercel)
=

## 🌐 Live Demonstration
### [👉 Play Cyber Aim Now](https://day38-aim-shot.vercel.app/)

---

## 🚀 Project Overview

**Cyber Aim** is not just a game; it is a technical demonstration of **Gamified React Architecture**. 
Designed as part of the **45 Days Coding Challenge (Day 38)**, this project focuses on handling multiple dynamic intervals, complex state updates, and interactive DOM manipulation without compromising performance.

The application features an adaptive difficulty system, real-time audio feedback, and local persistence, mimicking the experience of professional FPS aim trainers (like Aim Lab) directly in the browser.

---

## ✨ Key Features

### 🎮 Gameplay Mechanics
* **Adaptive Progression System:** 5 distinct levels ranging from *Rookie* to *God Mode*. Spawn rates and target decay timers adjust dynamically based on player performance.
* **Strategic Targets:**
    * 🔵 **Standard Node:** Base points.
    * 🟡 **Golden Data:** High reward, faster decay (Risk/Reward).
    * 🔴 **Corrupt Node (Trap):** Penalty on interaction (-HP, Screen Glitch).
* **Combo Engine:** Multiplier logic that rewards consistency and penalizes misses.

### 🛠 Technical Highlights
* **Advanced State Management:** Handles concurrent target lifecycles, health decay, and score multipliers simultaneously using React Hooks (`useState`, `useEffect`, `useRef`).
* **60FPS Animations:** Powered by **Framer Motion** for smooth target spawning and **Canvas Confetti** for particle effects.
* **Performance Optimization:** Utilizes `requestAnimationFrame` for a non-blocking game loop, ensuring smooth rendering even during heavy visual loads.
* **Data Persistence:** Uses `LocalStorage` to retain high scores across sessions.
* **Audio & Settings System:** A fully functional settings panel allowing users to customize crosshair colors and control master volume.

---

## 🛠️ Tech Stack

| Category | Technologies |
| :--- | :--- |
| **Frontend Framework** | React.js (Vite) |
| **Styling** | Tailwind CSS (v3) |
| **Animations** | Framer Motion, CSS Keyframes |
| **Icons** | Lucide React |
| **Particles** | Canvas Confetti |
| **Logic** | ES6+ JavaScript |

---

## 🕹️ How to Play

1.  **Objective:** Click targets before they disappear to score points.
2.  **Scoring:**
    * **Blue:** +100 Points (Standard).
    * **Gold:** +300 Points (Bonus).
    * **Red Skull:** **DO NOT CLICK!** (-30 Health + Glitch Effect).
3.  **Survival:** Missing a target or hitting a skull reduces your **System Health**. If Health hits 0%, the simulation ends.
4.  **Controls:**
    * `Mouse Left Click`: Shoot.
    * `ESC`: Open Settings Menu.

=

# 4. Start the development server
npm run dev
