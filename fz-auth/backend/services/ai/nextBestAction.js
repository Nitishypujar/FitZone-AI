const {
  buildIntelligenceFeatures,
  buildCompletionFeatures
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
  context = {},
  learning = {}
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

  let finalRanking =
    ranking;

  let mlPredictions = [];

  let mlEnabled =
    false;

  try {
    mlPredictions =
      await Promise.all(
        ranking.candidates.map(
          async candidate => {
            try {
              const prediction =
                await predictCompletion(
                  buildCompletionFeatures(
                    features,
                    readiness.score,
                    candidate.action
                  )
                );

              return {
                recommendation_action:
                  candidate.action,

                completion_probability:
                  Number(
                    prediction.completion_probability ||
                      0
                  ),

                predicted_completion:
                  Boolean(prediction.predicted_completion),

                ml_enabled: prediction.ml_enabled === true,
                prediction_source: prediction.prediction_source || 'unknown',
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
            mlPredictions,

          contextualAnalytics:
            learning.contextual_analytics ||
            [],

          features,

          adherence,

          readiness
        });

      mlEnabled = mlPredictions.some((item) => item.ml_enabled === true);
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

      ml_enabled:
        mlEnabled,

      historical_learning:
        false,

      completion_probability:
        null,

      predicted_completion:
        null
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

    historical_learning:
      selected.historical_learning ??
      false,

    historical_completion_rate:
      selected.historical_completion_rate ??
      null,

    historical_sample_size:
      selected.historical_sample_size ??
      0,

    context_similarity:
      selected.context_similarity ??
      0,

    learning_evidence_strength:
      selected.learning_evidence_strength ??
      0,

    current_context:
      finalRanking.current_context ||
      null,

    readiness,

    adherence,

    safety,

    features,

    candidates:
      finalRanking.candidates,

    ml_predictions:
      mlPredictions,

    ml_source:
      mlEnabled ? 'trained_model' : (mlPredictions.length > 0 ? 'cold_start' : 'unavailable')
  };
}

module.exports = {
  generateNextBestAction
};