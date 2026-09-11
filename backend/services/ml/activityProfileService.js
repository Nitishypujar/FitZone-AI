const fs = require("fs");
const path = require("path");

const MODEL_PATH = path.join(
  __dirname,
  "../../../models/activity_level_model.onnx"
);

const FEATURES = [
  "age",
  "sex",
  "race_ethnicity",
  "education",
  "marital_status",
  "income_poverty_ratio",
  "vigorous_activity_days",
  "moderate_activity_days",
  "vigorous_minutes_week",
  "moderate_minutes_week",
  "sedentary_minutes_day"
];

function validateModelFile() {
  if (!fs.existsSync(MODEL_PATH)) {
    throw new Error(`Activity model not found: ${MODEL_PATH}`);
  }

  return {
    available: true,
    path: MODEL_PATH,
    size_bytes: fs.statSync(MODEL_PATH).size
  };
}

function prepareFeatures(input = {}) {
  const values = {};

  for (const feature of FEATURES) {
    const value = Number(input[feature]);

    values[feature] = Number.isFinite(value) ? value : 0;
  }

  return values;
}

module.exports = {
  MODEL_PATH,
  FEATURES,
  validateModelFile,
  prepareFeatures
};