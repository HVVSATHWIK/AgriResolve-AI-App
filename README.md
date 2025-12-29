<div align="center">
  <img src="https://github.com/user-attachments/assets/3e912edf-92bb-4903-8e44-fb6d545033b7" width="100%" alt="AgriResolve AI Banner">

  # AgriResolve AI
  ### Explainable AI for Early Crop Health Risk Assessment

  <p align="center">
    <img src="https://img.shields.io/badge/Status-Online-success?style=for-the-badge" alt="Status">
    <img src="https://img.shields.io/badge/AI-Gemini%201.5%20Flash-blue?style=for-the-badge" alt="AI Model">
    <img src="https://img.shields.io/badge/Stack-React%20%7C%20Vite%20%7C%20TypeScript-blueviolet?style=for-the-badge" alt="Tech Stack">
  </p>
</div>

---

## 🌾 Overview

**AgroResolve AI** is a next-generation diagnostic tool designed to empower farmers and agronomists with instant, explainable insights into crop health. Unlike standard "black box" classifiers, AgroResolve employs a **Multi-Agent Consensus System** where distinct AI personas debate and validate findings before presenting a verdict.

This system is wrapped in a high-performance, cinematic UI featuring 3D visualizations and a responsive "Field Assistant" for interactive guidance.

## ✨ Key Features

### 🧠 Multi-Agent Analysis Pipeline
Our unique architecture splits the diagnostic process across specialized agents:
1.  **👁️ Vision Systems Agent**: Scans for visual anomalies, textures, and patterns.
2.  **🛡️ Quality Control Agent**: Verifies image reliability and checks for artifacts.
3.  **🧬 Hypothesis Debate**: 
    -   *Defense Agent*: Argues for abiotic causes or healthy variations.
    -   *Pathology Agent*: Argues for disease or pest vectors.
4.  **⚖️ Arbitration Agent**: Weighs the arguments and issues a final, confidence-weighted verdict.
5.  **📝 Explanation Agent**: Generates farmer-friendly guidance and actionable steps.

### 🎮 Immersive Experience
-   **3D Bio-Network Background**: A dynamic, interactive particle system simulating neural/biological connections using `React Three Fiber`.
-   **Cinematic Animations**: Smooth, motion-designed transitions powered by `Framer Motion`.
-   **Floating HUD**: A modern, glassmorphic interface that floats above the living background.

### 🤖 Intelligent Field Assistant
-   **Context-Aware Chat**: integrated AI assistant that knows the current diagnosis context.
-   **Format-Rich Responses**: Supports bold text, lists, and clear highlighting for critical advice.

## 🛠️ Technology Stack

-   **Core**: [React 18](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
-   **Styling**: [Tailwind CSS v3](https://tailwindcss.com/)
-   **Animations**: [Framer Motion](https://www.framer.com/motion/)
-   **3D Graphics**: [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/), [Maath](https://github.com/pmndrs/maath)
-   **AI Engine**: [Google Gemini Pro Vision](https://deepmind.google/technologies/gemini/)

## 🚀 Getting Started

### Prerequisites
-   Node.js (v18+)
-   Gemini API Key

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/AgroResolve-AI.git
    cd AgriResolve-AI
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Setup Environment**
    Create a `.env` file in the root directory:
    ```env
    VITE_GEMINI_API_KEY=your_api_key_here
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

## 🔒 Security Note
This application runs entirely client-side for demonstration purposes. API keys are stored in local environment variables. For production deployment, a backend proxy is recommended to secure the API credentials.

---

<p align="center">
  Built with ❤️ for precision agriculture.
</p>
