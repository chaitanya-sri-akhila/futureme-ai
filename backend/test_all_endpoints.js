const http = require('http');

const userProfile = {
  name: "Akhila",
  age: "22",
  goal: "secure a software engineer role, launch an ai startup",
  struggle: "lack of consistency, procrastination",
  oneYearVision: "working in an mnc in my core field ai",
  tone: "Calm Mentor (Stoic, reflective, high emotional intelligence)"
};

function makeRequest(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        try {
          resolve({
            path,
            statusCode: res.statusCode,
            body: JSON.parse(responseData)
          });
        } catch (e) {
          resolve({
            path,
            statusCode: res.statusCode,
            rawBody: responseData
          });
        }
      });
    });

    req.on('error', (error) => { reject(error); });
    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log("Starting validation on all remaining endpoints...");

  try {
    // 1. Test generate-dailyplan
    console.log("\nTesting /api/generate-dailyplan...");
    const dailyPlanRes = await makeRequest('/api/generate-dailyplan', {
      userProfile,
      focusArea: "Deep Work & Technical Consistency"
    });
    console.log(`Status: ${dailyPlanRes.statusCode}`);
    console.log(`Response:`, JSON.stringify(dailyPlanRes.body || dailyPlanRes.rawBody, null, 2));

    // 2. Test generate-weeklyreport
    console.log("\nTesting /api/generate-weeklyreport...");
    const weeklyReportRes = await makeRequest('/api/generate-weeklyreport', {
      userProfile,
      stats: {
        totalCompleted: 14,
        consistency: 85,
        currentStreak: 5,
        bestStreak: 7,
        reflectionsCount: 3
      },
      reflections: [
        {
          date: "Jun 10, 2026",
          accomplished: "Coded for 2 hours, set up server",
          distracted: "Spent 30 mins on phone",
          improve: "Keep phone in another room"
        }
      ]
    });
    console.log(`Status: ${weeklyReportRes.statusCode}`);
    console.log(`Response:`, JSON.stringify(weeklyReportRes.body || weeklyReportRes.rawBody, null, 2));

    // 3. Test chat-futureme
    console.log("\nTesting /api/chat-futureme...");
    const chatRes = await makeRequest('/api/chat-futureme', {
      userProfile,
      chatHistory: [
        { role: "user", message: "How do I deal with distraction when learning complex topics?" },
        { role: "model", message: "Break it down into 25-minute sprints and leave your phone outside." }
      ],
      question: "What should I do if I fail to meet my target tomorrow?"
    });
    console.log(`Status: ${chatRes.statusCode}`);
    console.log(`Response:`, JSON.stringify(chatRes.body || chatRes.rawBody, null, 2));

  } catch (error) {
    console.error("Test execution failed:", error);
  }
}

runTests();
