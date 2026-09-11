function selectPreferredAction(
  actionAnalytics = []
) {
  if (
    !Array.isArray(actionAnalytics) ||
    actionAnalytics.length === 0
  ) {
    return null
  }
  const candidates =
    actionAnalytics
      .filter(
        item =>
          Number(item.total || 0) >= 2
      )
      .sort((a, b) => {
        const scoreA =
          Number(a.completion_rate || 0) * 0.7 +
          Number(a.acceptance_rate || 0) * 0.3
        const scoreB =
          Number(b.completion_rate || 0) * 0.7 +
          Number(b.acceptance_rate || 0) * 0.3
        return scoreB - scoreA
      })
  if (candidates.length === 0) {
    return null
  }
  return {
    action: candidates[0].action,
    completion_rate:
      candidates[0].completion_rate,
    acceptance_rate:
      candidates[0].acceptance_rate,
    sample_size:
      candidates[0].total
  }
}
module.exports = {
  selectPreferredAction
}
