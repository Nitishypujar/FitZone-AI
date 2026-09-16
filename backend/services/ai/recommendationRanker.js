function rankRecommendations({
  features,
  adherence,
  readiness
}) {
  const candidates = [];

  const readinessScore =
    Number(readiness?.score || 0);

  const adherenceScore =
    Number(adherence?.score || 0);

  if (readinessScore < 40) {
    candidates.push({
      action: "recovery",
      score: 100,
      reason:
        "Current readiness suggests recovery should take priority."
    });
  }

  if (adherenceScore < 40) {
    candidates.push({
      action: "short-easy-workout",
      score: 90,
      reason:
        "A shorter session reduces friction and helps rebuild consistency."
    });
  }

  if (
    Number(features?.weekly_workout_progress || 0) < 50
  ) {
    candidates.push({
      action: "complete-planned-workout",
      score: 85,
      reason:
        "Weekly workout progress is behind target."
    });
  }

  if (adherenceScore >= 70) {
    candidates.push({
      action: "progress-workout",
      score: 70,
      reason:
        "Strong consistency supports gradual progression."
    });
  }

  if (
    features?.nutrition_available &&
    Number(features?.protein_percentage || 0) < 70
  ) {
    candidates.push({
      action: "improve-protein-intake",
      score: 60,
      reason:
        "Logged protein intake is below target."
    });
  }

  candidates.push({
    action: "follow-planned-workout",
    score: 40,
    reason:
      "Continue following the current plan."
  });

  candidates.sort(
    (a, b) => b.score - a.score
  );

  return {
    selected: candidates[0],
    candidates
  };
}

function rankRecommendationsWithML({
  candidates,
  predictions
}) {
  const predictionMap = new Map(
    predictions.map((prediction) => [
      prediction.recommendation_action,
      prediction
    ])
  );

  const scoredCandidates = candidates.map(
    (candidate) => {
      const prediction =
        predictionMap.get(candidate.action);

      if (!prediction) {
        return {
          ...candidate,
          ml_enabled: false,
          completion_probability: null,
          combined_score: candidate.score
        };
      }

      const completionProbability =
        Number(
          prediction.completion_probability || 0
        );

      const ruleScore =
        Number(candidate.score || 0) / 100;

      const combinedScore =
        Math.round(
          (
            ruleScore * 0.45 +
            completionProbability * 0.55
          ) * 100
        );

      return {
        ...candidate,
        ml_enabled: true,
        completion_probability:
          Number(
            completionProbability.toFixed(4)
          ),
        predicted_completion:
          Boolean(
            prediction.predicted_completion
          ),
        combined_score: combinedScore
      };
    }
  );

  scoredCandidates.sort(
    (a, b) =>
      b.combined_score -
      a.combined_score
  );

  return {
    selected: scoredCandidates[0],
    candidates: scoredCandidates
  };
}

module.exports = {
  rankRecommendations,
  rankRecommendationsWithML
};