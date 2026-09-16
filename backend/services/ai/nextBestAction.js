const {
  buildIntelligenceFeatures
} = require("./featureBuilder");

const {
  scoreAdherence
} = require("./adherenceScorer");

const {
  scoreReadiness
} = require("./readinessScorer");

const {
  rankRecommendations,
  rankRecommendationsWithML
} = require("./recommendationRanker");

const {
  validateRecommendation
} = require("./safetyValidator");

const {
  predictCompletion
} = require("../ml/personalizationClient");

async function generateNextBestAction(
  userState = {},
  context = {}
) {
  const features =
    buildIntelligenceFeatures(
      userState,
      context
    );

  const adherence =
    scoreAdherence(features);

  const readiness =
    scoreReadiness(features);

  const ranking =
    rankRecommendations({
      features,
      adherence,
      readiness
    });

  let finalRanking = ranking;
  let mlPredictions = [];
  let mlEnabled = false;

  try {
    const candidates =
      ranking.candidates || [];

    mlPredictions =
      await Promise.all(
        candidates.map(
          async (candidate) => {
            try {
              const prediction =
                await predictCompletion({
                  age: Number(
                    features.age || 0
                  ),
                  weight_kg: Number(
                    features.weight_kg || 0
                  ),
                  height_cm: Number(
                    features.height_cm || 0
                  ),
                  workout_days_per_week:
                    Number(
                      features.workout_days_per_week ||
                        0
                    ),
                  preferred_workout_duration:
                    Number(
                      features.preferred_workout_duration ||
                        0
                    ),
                  fitness_level:
                    String(
                      features.fitness_level ||
                        "Beginner"
                    ),
                  primary_goal:
                    String(
                      features.primary_goal ||
                        "Maintain Fitness"
                    ),
                  adherence_percentage:
                    Number(
                      features.adherence_percentage ||
                        0
                    ),
                  weekly_workout_progress:
                    Number(
                      features.weekly_workout_progress ||
                        0
                    ),
                  weekly_minute_progress:
                    Number(
                      features.weekly_minute_progress ||
                        0
                    ),
                  recent_sessions:
                    Number(
                      features.recent_sessions ||
                        0
                    ),
                  recent_active_minutes:
                    Number(
                      features.recent_active_minutes ||
                        0
                    ),
                  nutrition_available:
                    Number(
                      features.nutrition_available
                        ? 1
                        : 0
                    ),
                  calorie_percentage:
                    Number(
                      features.calorie_percentage ||
                        0
                    ),
                  protein_percentage:
                    Number(
                      features.protein_percentage ||
                        0
                    ),
                  readiness_score:
                    Number(
                      readiness.score || 0
                    ),
                  difficulty_preference:
                    Number(
                      features.difficulty_preference ||
                        0
                    ),
                  recommendation_action:
                    candidate.action
                });

              return {
                recommendation_action:
                  candidate.action,
                completion_probability:
                  Number(
                    prediction.completion_probability ||
                      0
                  ),
                predicted_completion:
                  Boolean(
                    prediction.predicted_completion
                  )
              };
            } catch (error) {
              console.error(
                `ML prediction failed for ${candidate.action}:`,
                error.message
              );

              return null;
            }
          }
        )
      );

    mlPredictions =
      mlPredictions.filter(Boolean);

    if (mlPredictions.length > 0) {
      finalRanking =
        rankRecommendationsWithML({
          candidates:
            ranking.candidates,
          predictions:
            mlPredictions
        });

      mlEnabled = true;
    }
  } catch (error) {
    console.error(
      "Personalization ML ranking failed:",
      error.message
    );
  }

  const safety =
    validateRecommendation({
      action:
        finalRanking.selected.action,
      readiness,
      features
    });

  let selected =
    finalRanking.selected;

  if (
    !safety.safe &&
    readiness.score < 40
  ) {
    selected = {
      action: "recovery",
      score: 100,
      combined_score: 100,
      reason:
        "Recovery was selected by the safety layer.",
      ml_enabled: mlEnabled
    };
  }

  return {
    generated_at:
      new Date().toISOString(),

    action:
      selected.action,

    reason:
      selected.reason,

    score:
      selected.combined_score ??
      selected.score,

    ml_enabled:
      mlEnabled,

    completion_probability:
      selected.completion_probability ??
      null,

    predicted_completion:
      selected.predicted_completion ??
      null,

    readiness,

    adherence,

    safety,

    features,

    candidates:
      finalRanking.candidates,

    ml_predictions:
      mlPredictions
  };
}

module.exports = {
  generateNextBestAction
};