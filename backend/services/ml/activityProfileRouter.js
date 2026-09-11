const express = require("express");

const { predictActivityProfile } = require("./activityProfileClient");
const { buildFitZoneActivityFeatures } = require("./fitzoneFeatures");
const { buildFitnessContext } = require("../fitnessContext");
const { buildUserState } = require("../userState");
const { calculateNutritionTargets } = require("../nutritionCalculator");

const router = express.Router();

async function authenticateUser(req, res) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      status: "error",
      message: "Authentication required"
    });
    return null;
  }

  const accessToken = authHeader.replace("Bearer ", "").trim();

  if (!accessToken) {
    res.status(401).json({
      status: "error",
      message: "Authentication required"
    });
    return null;
  }

  const supabase = req.app.locals.supabase;

  if (!supabase) {
    throw new Error("Supabase client unavailable");
  }

  const {
    data: { user },
    error
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    res.status(401).json({
      status: "error",
      message: "Invalid or expired authentication token"
    });
    return null;
  }

  return user;
}

router.post("/predict", async function (req, res) {
  try {
    const user = await authenticateUser(req, res);

    if (!user) {
      return;
    }

    const supabase = req.app.locals.supabase;

    const context = await buildFitnessContext(
      supabase,
      user.id
    );

    const nutritionTargets = calculateNutritionTargets(
      context.profile
    );

    const userState = buildUserState(
      context,
      nutritionTargets
    );

    const features = buildFitZoneActivityFeatures(
      userState,
      context
    );

    const prediction = await predictActivityProfile(
      features
    );

    return res.json({
      status: "success",
      features,
      prediction
    });
  } catch (error) {
    console.error(
      "Activity profile prediction error:",
      error
    );

    return res.status(502).json({
      status: "error",
      message: "Activity profile prediction failed"
    });
  }
});

module.exports = router;