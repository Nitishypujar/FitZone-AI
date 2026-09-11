const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "https://fitzone-ai-ml.onrender.com";

async function predictActivityProfile(features) {
  const response = await fetch(`${ML_SERVICE_URL}/predict/activity-profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(features)
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`ML service error (${response.status}): ${text}`);
  }

  return JSON.parse(text);
}

module.exports = {
  predictActivityProfile
};
