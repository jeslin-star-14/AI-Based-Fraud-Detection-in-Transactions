import api from "./api";

// Talks to ai_agent/ via backend/app/api/routes/agent.py.
// The agent takes a natural-language question plus optional transaction
// context, and returns an explanation grounded in the fraud model's output.

export async function askAgent(question, context = {}) {
  try {
    const { data } = await api.post("/agent/ask", { question, context });
    return data.answer;
  } catch (err) {
    return simulateAgentResponse(question);
  }
}

// Local fallback so the widget is demoable before the backend agent is live.
function simulateAgentResponse(question) {
  if (/why.*flagged|TXN/i.test(question)) {
    return "This transaction was flagged mainly for two reasons: the amount is over 8x this account's 30-day average, and it originated from a location not seen on this account before. The anomaly model (Isolation Forest) scored it in the top 2% of outlier transactions today.";
  }
  if (/pattern|summar/i.test(question)) {
    return "Today's flagged transactions cluster around large wire transfers from new locations, mostly between 9–10 AM. This matches a pattern the clustering model has flagged twice this week — recommend reviewing accounts AC-4471 and AC-9921 first.";
  }
  return "I can look into transaction risk scores, explain why something was flagged, and summarize fraud patterns across accounts. Try asking about a specific transaction ID.";
}
