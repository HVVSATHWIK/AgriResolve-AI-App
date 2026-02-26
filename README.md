<div align="center">
  <img src="https://github.com/user-attachments/assets/3e912edf-92bb-4903-8e44-fb6d545033b7" width="100%" alt="AgriResolve AI Banner">

  # AgriResolve AI
  ### Explainable AI for Early Crop Health Risk Assessment

  <p align="center">
    <img src="https://img.shields.io/badge/Status-Online-success?style=for-the-badge" alt="Status">
    <img src="https://img.shields.io/badge/AI-Gemini%202.5%20Flash--Lite-blue?style=for-the-badge" alt="AI Model">
    <img src="https://img.shields.io/badge/Stack-React%20%7C%20Vite%20%7C%20TypeScript-blueviolet?style=for-the-badge" alt="Tech Stack">
    <img src="https://img.shields.io/badge/Languages-10%2B-orange?style=for-the-badge" alt="Multilingual">
  </p>
</div>

---

## 🌾 Overview

**AgriResolve AI** is a diagnostic tool designed to empower farmers and agronomists with instant, explainable insights into crop health.

Built on the **Gemini 2.5** engine, it employs a unique **Multi-Agent Consensus System** where diverse AI personas (Defense, Pathology, Arbitration) debate the diagnosis in real-time before issuing a verdict. The application is fully multilingual, supporting **10 Indian languages** with instant, zero-cost switching.

Architecture note: the frontend never talks to Gemini directly. All AI calls go through a backend proxy (`/api/analysis`) so the API key stays server-side.

## ✨ Key Features

### 🌍 Universal Multilingual Support
-   **10 Supported Languages**: English, Hindi, Telugu, Tamil, Malayalam, Kannada, Marathi, Bengali, Gujarati, Punjabi.
-   **Instant Translation Cache**: Switch languages *after* a scan without re-running the heavy analysis.
-   **Zero-Cost Switching**: Results are cached locally, so flipping between languages costs 0 API credits.
-   **Dynamic Content**: Analysis is generated in a stable English base and then translated for display to keep UI + AI output consistent and avoid mixed-language responses.

### 🧠 Multi-Agent Analysis Pipeline
1.  **👁️ Vision Agent**: Scans textures and lesions (`Gemini 2.5 Vision`).
2.  **🛡️ Healthy Hypothesis Agent**: Argues for abiotic causes/healthy variations.
3.  **🦠 Disease Hypothesis Agent**: Argues for potential pathology risks.
4.  **⚖️ Arbitration Agent**: Weighs the debate and issues a final, confidence-weighted verdict.
5.  **📝 Explanation Agent**: Generates actionable guidance.

### 🎮 Immersive Experience
-   **3D Bio-Network Background**: Interactive neural particle system (`React Three Fiber`).
-   **Glassmorphism UI**: Premium "Gunmetal" aesthetic with frosted glass elements.
-   **Field Assistant Protocol**: Context-aware chat sidebar for follow-up questions.

### 📍 Location-Aware Assistant (Optional)
-   **Permission-Based**: The app asks for location access only when you open the Field Assistant (you can skip).
-   **Weather/Temperature Context**: If granted, the assistant fetches current local weather via Open-Meteo (no API key) and tailors guidance (seasonality, irrigation timing, disease risk factors).
-   **Privacy-Friendly**: Uses approximate coordinates only and does not claim exact locality names.

### 🎙️ Voice (Optional)
-   **STT (Speech-to-Text)**: Voice input using the browser Web Speech API.
-   **TTS (Text-to-Speech)**: The assistant can speak responses, aligned to the currently selected UI language.

### 🛡️ Safety Guardrails
-   Refuses potentially dangerous instructions (e.g., chemical dosing/mixing) and provides safer next-step guidance.

## 🛠️ Technology Stack

-   **Frontend**: React 19, Vite 6, TypeScript
-   **Backend**: Node.js, Express (`server/` → built to `dist/server/`)
-   **AI**: Google Gemini 2.5 Flash-Lite (`@google/genai`) via backend proxy
-   **State/Internationalization**: `i18next`, `react-i18next`
-   **Styling**: Tailwind CSS v4, Framer Motion
-   **3D Graphics**: React Three Fiber, Maath

## 🚀 Getting Started

### Prerequisites
-   Node.js (v18+)
-   Gemini API Key from [Google AI Studio](https://aistudio.google.com/)

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

3.  **Configure environment variables**

  **Frontend (Vite)** — create `.env.local` in the project root:
  ```env
  # In production set this to your Render backend URL
  # Example: https://agriresolve-backend.onrender.com
  VITE_API_URL=http://localhost:3001
  ```

  **Backend (Express)** — create `.env` in the project root (used by `server/index.ts`):
  ```env
  # Required (either variable name works)
  GEMINI_API_KEY=your_gemini_api_key_here
  # or: GEMINI_SERVICE_TOKEN=your_gemini_api_key_here

  # Required for session-based features
  SESSION_SECRET=change-this-secret-in-production-use-a-long-random-string

  # CORS
  CLIENT_URL=http://localhost:5173
  FRONTEND_URL=http://localhost:5173

  NODE_ENV=development
  PORT=3001
  ```

4.  **Run locally (two terminals)**

  **Terminal A — backend**
  ```bash
  npm run build:server
  npm run start:server
  ```

  **Terminal B — frontend**
  ```bash
  npm run dev
  ```

5.  **Health check**
  - `GET /api/health`
  - `GET /api/health/gemini`
  - `POST /api/analysis`

## 🌐 Deployment (Vercel + Render)

### Frontend (Vercel)
- Build command: `npm run build`
- Output directory: `dist`
- Env var: `VITE_API_URL=https://<your-render-service>.onrender.com`

### Backend (Render)
- Uses [render.yaml](render.yaml) (build: `npm run build && npm run build:server`, start: `npm run start:server`)
- Required env vars in Render dashboard:
  - `GEMINI_API_KEY` (or `GEMINI_SERVICE_TOKEN`)
  - `SESSION_SECRET`
  - `CLIENT_URL` (your Vercel URL, e.g. `https://agri-resolve-ai.vercel.app`)

## ⚠️ Quota & Billing
This app uses **Gemini 2.5**, which has a strict free tier (~20 requests/day).
-   If you see **"Quota Exceeded"**, please link a billing account to your Google Cloud Project.
-   The "Pay-As-You-Go" tier is extremely cheap (~$0.10/million tokens) and removes these limits.

## 🧯 Troubleshooting

### `503` from `/api/analysis` (Gemini unavailable)
- Check `GET /api/health/gemini` on your backend.
- If it returns `503`, verify Render env vars (`GEMINI_API_KEY`/`GEMINI_SERVICE_TOKEN`) and check Render logs for Gemini errors.

### Workbox `non-precached-url` / blank loads after deploy
- This can happen if an old service worker is still cached in the browser.
- Fix: DevTools → Application → Service Workers → **Unregister**, then **Clear site data**, then reload.

---

<p align="center">
  Built with ❤️ for precision agriculture.
</p>
