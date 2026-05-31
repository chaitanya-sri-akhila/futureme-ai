# FutureMe — AI-Powered Personal Reflection Platform

FutureMe is a premium, Apple-inspired personal reflection web application created for **Nitish’s Founder Labs**. 

Users input parameters about their current life parameters, goals, struggles, and desired tone model (Motivational, Brutally Honest, Calm Mentor, or CEO Mode). Using the Gemini API, the platform projects a deep, emotionally intelligent transmission from their future self who has already achieved their goals, giving them structured steps, warnings, daily mantras, and an interactive temporal chat connection.

---

## Project Structure

```
futureme/
  frontend/
    index.html     # Premium glassmorphic structure
    style.css      # Core Apple dark theme & animations
    script.js      # Form submissions, clipboard, and interactive chat controller
  backend/
    server.js      # Express API server & Gemini integration
    package.json   # Node configurations
    .env           # Secret API key (local setup)
    .env.example   # Environment template
  README.md        # Technical execution manual
```

---

## Quick Start Installation

Follow these simple steps to run the application locally:

### 1. Setup the Environment
Go to the backend directory, copy the `.env` template, and configure your **Gemini API Key**:

```bash
cd backend
cp .env.example .env
```

Open `.env` in your editor and add your key:
```env
GEMINI_API_KEY=your_actual_gemini_api_key
PORT=5000
```

### 2. Install Dependencies
Install the required packages (`express`, `cors`, `dotenv`, and `@google/generative-ai`):

```bash
npm install
```
*(On Windows PowerShell, if you face execution policy issues, run `npm.cmd install` instead).*

### 3. Run the Development Server
Launch the server on port 5000:

```bash
npm run dev
```
*(Or use `npm start` to run with standard Node execution).*

### 4. Open the App
The backend is configured to host both the API routes and serve the static frontend files. Simply open your web browser and navigate to:

👉 **[http://localhost:5000](http://localhost:5000)**

---

## API Routes Documentation

The backend server exposes the following routes for frontend integration:

### 1. Generate FutureMe Result
* **Route**: `POST /api/generate-futureme`
* **Request Body**:
  ```json
  {
    "name": "Nitish",
    "age": "23",
    "goal": "Build a successful AI startup",
    "struggle": "Lack of consistency",
    "oneYearVision": "Running a profitable AI company",
    "tone": "Brutally Honest"
  }
  ```
* **Response**:
  ```json
  {
    "success": true,
    "data": {
      "message": "A powerful 120-180 word message from the future self...",
      "futureIdentity": "A concise description of who the user is becoming...",
      "nextMoves": [
        "Action item 1",
        "Action item 2",
        "Action item 3"
      ],
      "habit": "One small daily habit they should start today...",
      "warning": "One mistake their future self warns them about...",
      "mantra": "A short memorable line they can repeat daily..."
    }
  }
  ```

### 2. Temporal Dialogue Follow-up Chat
* **Route**: `POST /api/chat-futureme`
* **Request Body**:
  ```json
  {
    "userProfile": {
      "name": "Nitish",
      "age": "23",
      "goal": "Build a successful AI startup",
      "struggle": "Lack of consistency",
      "oneYearVision": "Running a profitable AI company",
      "tone": "Brutally Honest"
    },
    "chatHistory": [
      {
        "role": "user",
        "message": "Will I actually make it?"
      },
      {
        "role": "futureme",
        "message": "Only if your daily actions stop negotiating with your dreams."
      }
    ],
    "question": "What should I focus on this week?"
  }
  ```
* **Response**:
  ```json
  {
    "success": true,
    "reply": "Reply content from the future self adapting to profile and tone models..."
  }
  ```

---

## Technologies Used
- **Frontend**: HTML5, Vanilla CSS3 (Custom Glassmorphic Styling & Keyframe Transitions), Vanilla JS (Fetch Client, Intersection Observer, Clipboard API)
- **Backend**: Node.js, Express.js (Static files host, CORS configurations, body-parser)
- **AI Engine**: Google Gemini API (`@google/generative-ai` SDK using `gemini-1.5-flash`)
