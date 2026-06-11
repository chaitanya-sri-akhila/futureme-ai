const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;
if (apiKey && apiKey !== 'replace_with_your_gemini_api_key' && apiKey !== 'your_api_key_here') {
  genAI = new GoogleGenerativeAI(apiKey);
}

// Helper to check Gemini Initialization
const getModel = () => {
  if (!genAI) {
    // Re-check in case the user updated it during runtime
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== 'replace_with_your_gemini_api_key' && key !== 'your_api_key_here') {
      genAI = new GoogleGenerativeAI(key);
    } else {
      throw new Error("Gemini API key is not configured. Please set GEMINI_API_KEY in your .env file.");
    }
  }
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
};

// Helper to clean JSON string from Gemini markdown wrapper
function cleanAndParseJSON(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  cleaned = cleaned.trim();
  return JSON.parse(cleaned);
}

// Robust wrapper with automatic retry and exponential backoff for temporary/overload errors (e.g. 503, 429)
async function generateContentWithRetry(model, prompt, retries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return result;
    } catch (err) {
      const errMsg = String(err.message || err);
      const isTemporary = errMsg.includes("503") || 
                          errMsg.includes("Service Unavailable") || 
                          errMsg.includes("429") || 
                          errMsg.includes("Too Many Requests") || 
                          errMsg.includes("fetch failed") ||
                          errMsg.includes("overloaded");

      if (isTemporary && attempt < retries) {
        console.warn(`[Gemini API] Temporary error on attempt ${attempt}/${retries}: ${errMsg}. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // exponential backoff
      } else {
        throw err;
      }
    }
  }
}

// Routes
app.post('/api/generate-futureme', async (req, res) => {
  try {
    const { name, age, goal, struggle, oneYearVision, tone } = req.body;

    if (!name || !age || !goal || !struggle || !oneYearVision || !tone) {
      return res.status(400).json({
        success: false,
        error: "Missing required profile parameters."
      });
    }

    const model = getModel();

    const systemPrompt = `You are FutureMe, the future successful version of the user. You are not a generic motivational coach. You speak with emotional intelligence, clarity, and deep personal understanding. Your job is to help the user see who they are becoming, what they must change, and what they should do next.

Write as if you are the user’s future self speaking directly to their current self.

Tone selected by user: ${tone}
(Make sure your response strictly reflects this tone:
 - Motivational: warm, inspiring, supportive
 - Brutally Honest: direct, sharp, no excuses, call out their laziness/struggles directly
 - Calm Mentor: peaceful, wise, grounded, stoic, understanding
 - CEO Mode: strategic, focused, execution-heavy, treating actions as resource allocation)

User details:
Name: ${name}
Age: ${age}
Goal: ${goal}
Current struggle: ${struggle}
One-year vision: ${oneYearVision}

Return only valid JSON in this exact format:
{
  "message": "A powerful 120-180 word message from the future self.",
  "futureIdentity": "A concise description of who the user is becoming.",
  "nextMoves": ["Action 1", "Action 2", "Action 3"],
  "habit": "One small daily habit they should start today.",
  "warning": "One mistake their future self warns them about.",
  "mantra": "A short memorable line they can repeat daily.",
  "dailyPlan": {
    "topPriority": "A singular critical task for today to progress towards the goal.",
    "dailyActions": ["Action 1", "Action 2", "Action 3"],
    "avoid": "One specific distraction or mistake to avoid based on current struggles.",
    "focusTime": "Estimated focus time required for today (e.g., '90 minutes')."
  }
}

Make it specific and deeply personal. Avoid generic motivation. Avoid clichés. Make it emotional but practical. Do not include any explanation or markdown formatting other than the JSON itself.`;

    const result = await generateContentWithRetry(model, systemPrompt);
    const responseText = result.response.text();
    
    try {
      const data = cleanAndParseJSON(responseText);
      res.json({
        success: true,
        data: data
      });
    } catch (parseErr) {
      console.error("JSON parsing error from text:", responseText, parseErr);
      res.status(500).json({
        success: false,
        error: "Failed to parse future self projection structure. Please try again.",
        rawText: responseText
      });
    }

  } catch (error) {
    console.error("Error in /api/generate-futureme:", error);
    res.status(500).json({
      success: false,
      error: error.message || "FutureMe could not respond right now. Try again."
    });
  }
});

app.post('/api/generate-dailyplan', async (req, res) => {
  try {
    const { userProfile, focusArea } = req.body;

    if (!userProfile || !focusArea) {
      return res.status(400).json({
        success: false,
        error: "Missing user profile or focus area."
      });
    }

    const { name, age, goal, struggle, oneYearVision, tone } = userProfile;
    const model = getModel();

    const planPrompt = `You are FutureMe, the future successful version of the user. Your job is to create a practical, highly motivational, and actionable 1-day alignment routine for the user, focusing specifically on this area: "${focusArea}".

Write as if you are the user’s future self directing them on how to construct their day tomorrow to overcome obstacles and lock in progress.

Tone: ${tone}
User profile:
Name: ${name}
Age: ${age}
Dream/Goal: ${goal}
Current Struggle: ${struggle}
One-year vision: ${oneYearVision}

Return only valid JSON in this exact format:
{
  "focus": "A short theme or quote for tomorrow's alignment (max 10 words).",
  "tasks": [
    {
      "time": "Morning (08:00 AM)",
      "task": "A small actionable morning step matching the focus and tone.",
      "motivation": "A brief personal motivational advice/reflection from your future self."
    },
    {
      "time": "Afternoon (02:00 PM)",
      "task": "A high-leverage block of work addressing the struggle and goal.",
      "motivation": "A brief execution cue."
    },
    {
      "time": "Evening (09:00 PM)",
      "task": "A reflection or review routine to close the day.",
      "motivation": "A brief calming closing thought."
    }
  ]
}

Make it extremely specific, action-oriented, and structured. Do not include any explanations or markdown.`;

    const result = await generateContentWithRetry(model, planPrompt);
    const responseText = result.response.text();

    try {
      const data = cleanAndParseJSON(responseText);
      res.json({
        success: true,
        dailyPlan: data
      });
    } catch (parseErr) {
      console.error("JSON parsing error from daily plan text:", responseText, parseErr);
      res.status(500).json({
        success: false,
        error: "Failed to parse future self daily plan structure.",
        rawText: responseText
      });
    }

  } catch (error) {
    console.error("Error in /api/generate-dailyplan:", error);
    res.status(500).json({
      success: false,
      error: error.message || "FutureMe could not generate a plan right now."
    });
  }
});

app.post('/api/generate-weeklyreport', async (req, res) => {
  try {
    const { userProfile, stats, reflections } = req.body;

    if (!userProfile || !stats) {
      return res.status(400).json({
        success: false,
        error: "Missing user profile or statistics."
      });
    }

    const { name, age, goal, struggle, oneYearVision, tone } = userProfile;
    const model = getModel();

    const reflectionsText = (reflections || []).slice(0, 7).map(r => {
      return `- Date: ${r.date || ''}\n  Accomplished: ${r.accomplished || 'N/A'}\n  Distractions: ${r.distracted || 'N/A'}\n  Improvements: ${r.improve || 'N/A'}`;
    }).join('\n');

    const reportPrompt = `You are FutureMe, the future successful version of the user who achieved our goal. Generate a concise, powerful weekly review coaching summary for the user based on their performance data this week.

Write as if you are the user's future self reviewing their progress. Speak directly to them.

Tone selected by user: ${tone}
User Details:
Name: ${name}
Goal: ${goal}
Struggle: ${struggle}
One-year vision: ${oneYearVision}

Performance Stats This Week:
- Total Habits Completed: ${stats.totalCompleted || 0}
- Consistency Score: ${stats.consistency || 0}%
- Current Streak: ${stats.currentStreak || 0} Days
- Best Streak: ${stats.bestStreak || 0} Days
- Daily Reflections Logged: ${stats.reflectionsCount || 0}

Recent Daily Reflections:
${reflectionsText || "(No reflections logged this week)"}

Generate a powerful AI-style summary analysis (around 100-130 words). Focus on:
1. Recognizing their consistency or calling them out on their struggles based on stats.
2. Isolating their main distractions this week.
3. Giving them one clear, actionable focus vector for the upcoming week.

Return ONLY the raw message text from the future self. Do not wrap in JSON, markdown codeblocks, or introductory text. Just start speaking.`;

    const result = await generateContentWithRetry(model, reportPrompt);
    const replyText = result.response.text();

    res.json({
      success: true,
      summary: replyText.trim()
    });

  } catch (error) {
    console.error("Error in /api/generate-weeklyreport:", error);
    res.status(500).json({
      success: false,
      error: error.message || "FutureMe could not analyze your weekly performance right now."
    });
  }
});

app.post('/api/chat-futureme', async (req, res) => {
  try {
    const { userProfile, chatHistory, question } = req.body;

    if (!userProfile || !question) {
      return res.status(400).json({
        success: false,
        error: "Missing user profile or question."
      });
    }

    const { name, age, goal, struggle, oneYearVision, tone } = userProfile;
    const model = getModel();

    const historyText = (chatHistory || []).map(msg => {
      const speaker = msg.role === 'user' ? 'Current Self' : 'FutureMe';
      return `${speaker}: ${msg.message}`;
    }).join('\n');

    const chatPrompt = `You are FutureMe, the future version of the user who already achieved their one-year vision. Reply directly to the user’s question. Be personal, sharp, honest, and useful. Do not sound like a normal AI assistant. Do not mention that you are Gemini or an AI model. Speak like the future self.

User profile:
Name: ${name}
Age: ${age}
Goal: ${goal}
Struggle: ${struggle}
One-year vision: ${oneYearVision}
Tone: ${tone}
(Adapt your reply to this tone:
 - Motivational: warm, inspiring, supportive
 - Brutally Honest: direct, sharp, no excuses
 - Calm Mentor: peaceful, wise, grounded
 - CEO Mode: strategic, focused, execution-heavy)

Recent chat history:
${historyText || "(No history yet)"}

Current question:
${question}

Reply in 2-5 short paragraphs. Give at least one clear action.`;

    const result = await generateContentWithRetry(model, chatPrompt);
    const replyText = result.response.text();

    res.json({
      success: true,
      reply: replyText.trim()
    });

  } catch (error) {
    console.error("Error in /api/chat-futureme:", error);
    res.status(500).json({
      success: false,
      error: error.message || "FutureMe could not respond right now. Try again."
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
