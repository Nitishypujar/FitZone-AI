const supabase = require('../../supabase')
const { buildIntelligenceFeatures, buildCompletionFeatures } = require('../ai/featureBuilder')
const { scoreReadiness } = require('../ai/readinessScorer')
const { trainCompletionModel } = require('./personalizationClient')

// Pulls every recommendation_event across all users that has a known
// outcome (completed is true or false, not null), reconstructs the exact
// feature vector that was live at generation time from context_snapshot,
// and trains the completion model on it. Safe to re-run repeatedly as
// more real outcomes accumulate — the ML service trains from scratch on
// whatever full example set is sent each time.
async function trainCompletionModelFromHistory() {
  const { data, error } = await supabase
    .from('recommendation_events')
    .select('recommendation_action, completed, context_snapshot')
    .not('completed', 'is', null)
    .not('context_snapshot', 'is', null)

  if (error) {
    throw new Error(`Unable to load recommendation_events: ${error.message}`)
  }

  const examples = (data || [])
    .map((event) => {
      const snapshot = event.context_snapshot || {}
      if (!snapshot.profile) return null

      const features = buildIntelligenceFeatures(snapshot, {
        profile: snapshot.profile,
      })

      const readiness = scoreReadiness(features)

      return {
        features: buildCompletionFeatures(
          features,
          readiness.score,
          event.recommendation_action
        ),
        completed: Boolean(event.completed),
      }
    })
    .filter(Boolean)

  if (examples.length < 5) {
    return {
      trained: false,
      reason: `Only ${examples.length} usable historical examples found (need at least a handful). Keep using the app and try again once more workouts have real outcomes.`,
      example_count: examples.length,
    }
  }

  const model = await trainCompletionModel(examples)

  return {
    trained: true,
    example_count: examples.length,
    model,
  }
}

module.exports = {
  trainCompletionModelFromHistory,
}
