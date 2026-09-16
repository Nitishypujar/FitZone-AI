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

function getCurrentContext({
  features = {},
  adherence = {},
  readiness = {}
}) {
  return {
    adherence_level:
      String(
        adherence?.level ||
        "unknown"
      ),

    readiness_level:
      String(
        readiness?.level ||
        "unknown"
      ),

    fitness_level:
      String(
        features?.fitness_level ||
        "unknown"
      ),

    primary_goal:
      String(
        features?.primary_goal ||
        "unknown"
      )
  };
}

function calculateContextSimilarity(
  currentContext = {},
  historicalContext = {}
) {
  const fields = [
    "adherence_level",
    "readiness_level",
    "fitness_level",
    "primary_goal"
  ];

  let matched = 0;
  let comparable = 0;

  for (const field of fields) {
    const current =
      String(
        currentContext[field] ||
        "unknown"
      );

    const historical =
      String(
        historicalContext[field] ||
        "unknown"
      );

    if (
      current === "unknown" ||
      historical === "unknown"
    ) {
      continue;
    }

    comparable += 1;

    if (current === historical) {
      matched += 1;
    }
  }

  if (comparable === 0) {
    return 0;
  }

  return matched / comparable;
}

function findHistoricalEvidence({
  action,
  currentContext,
  contextualAnalytics = []
}) {
  if (
    !Array.isArray(contextualAnalytics) ||
    contextualAnalytics.length === 0
  ) {
    return null;
  }

  const matchingGroups =
    contextualAnalytics
      .filter(item => {
        if (
          item.action !== action
        ) {
          return false;
        }

        return (
          Number(item.total || 0) >= 2
        );
      })
      .map(item => {
        const similarity =
          calculateContextSimilarity(
            currentContext,
            item.context || {}
          );

        return {
          ...item,
          similarity
        };
      })
      .filter(
        item =>
          item.similarity >= 0.5
      )
      .sort((a, b) => {
        if (
          b.similarity !==
          a.similarity
        ) {
          return (
            b.similarity -
            a.similarity
          );
        }

        return (
          Number(b.total || 0) -
          Number(a.total || 0)
        );
      });

  if (
    matchingGroups.length === 0
  ) {
    return null;
  }

  const best =
    matchingGroups[0];

  const total =
    Number(best.total || 0);

  const completed =
    Number(best.completed || 0);

  /*
   * Bayesian smoothing prevents tiny
   * historical samples from dominating.
   *
   * Prior:
   * 50% completion
   * 2 virtual observations
   */
  const historicalRate =
    (completed + 1) /
    (total + 2);

  const evidenceStrength =
    Math.min(
      1,
      total / 10
    ) *
    best.similarity;

  return {
    completion_rate:
      historicalRate,

    raw_completion_rate:
      Number(
        best.completion_rate || 0
      ),

    sample_size:
      total,

    similarity:
      best.similarity,

    evidence_strength:
      evidenceStrength,

    context:
      best.context
  };
}

function rankRecommendationsWithML({
  candidates = [],
  predictions = [],
  contextualAnalytics = [],
  features = {},
  adherence = {},
  readiness = {}
}) {
  const predictionMap =
    new Map(
      predictions.map(item => [
        item.recommendation_action,
        item
      ])
    );

  const currentContext =
    getCurrentContext({
      features,
      adherence,
      readiness
    });

  const ranked =
    candidates.map(candidate => {
      const prediction =
        predictionMap.get(
          candidate.action
        );

      const completionProbability =
        prediction
          ? Number(
              prediction.completion_probability ||
                0
            )
          : null;

      const historical =
        findHistoricalEvidence({
          action:
            candidate.action,
          currentContext,
          contextualAnalytics
        });

      const ruleScore =
        Number(
          candidate.score || 0
        );

      let combinedScore =
        ruleScore;

      let mlEnabled =
        Boolean(prediction);

      let historyEnabled =
        Boolean(historical);

      if (
        prediction &&
        historical
      ) {
        const mlScore =
          completionProbability * 100;

        const historicalScore =
          historical.completion_rate *
          100;

        const historicalWeight =
          0.20 *
          historical.evidence_strength;

        const mlWeight =
          0.45;

        const ruleWeight =
          1 -
          mlWeight -
          historicalWeight;

        combinedScore =
          ruleScore * ruleWeight +
          mlScore * mlWeight +
          historicalScore *
            historicalWeight;
      } else if (prediction) {
        combinedScore =
          ruleScore * 0.45 +
          completionProbability *
            100 *
            0.55;
      } else if (historical) {
        const historicalScore =
          historical.completion_rate *
          100;

        const historicalWeight =
          0.30 *
          historical.evidence_strength;

        combinedScore =
          ruleScore *
            (1 - historicalWeight) +
          historicalScore *
            historicalWeight;
      }

      return {
        ...candidate,

        ml_enabled:
          mlEnabled,

        completion_probability:
          completionProbability,

        predicted_completion:
          prediction
            ? Boolean(
                prediction.predicted_completion
              )
            : null,

        historical_learning:
          historyEnabled,

        historical_completion_rate:
          historical
            ? historical.completion_rate
            : null,

        historical_sample_size:
          historical
            ? historical.sample_size
            : 0,

        context_similarity:
          historical
            ? historical.similarity
            : 0,

        learning_evidence_strength:
          historical
            ? historical.evidence_strength
            : 0,

        combined_score:
          Math.round(
            combinedScore
          )
      };
    });

  ranked.sort(
    (a, b) =>
      b.combined_score -
      a.combined_score
  );

  return {
    selected:
      ranked[0] || null,

    candidates:
      ranked,

    current_context:
      currentContext
  };
}

module.exports = {
  rankRecommendations,
  rankRecommendationsWithML,
  getCurrentContext,
  calculateContextSimilarity,
  findHistoricalEvidence
};