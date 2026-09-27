function calculateProgressTrend(
  progressLogs = []
) {
  if (
    !Array.isArray(progressLogs) ||
    progressLogs.length < 2
  ) {
    return {
      direction: "insufficient-data",
      change: 0,
      sample_size:
        Array.isArray(progressLogs)
          ? progressLogs.length
          : 0
    }
  }
  const sorted =
    [...progressLogs].sort(
      (a, b) =>
        new Date(a.created_at || a.date) -
        new Date(b.created_at || b.date)
    )
  const first =
    Number(
      sorted[0].weight_kg ??
      sorted[0].weight ??
      0
    )
  const last =
    Number(
      sorted[sorted.length - 1].weight_kg ??
      sorted[sorted.length - 1].weight ??
      0
    )
  const change = last - first
  let direction = "stable"
  if (change > 0.25) {
    direction = "increasing"
  } else if (change < -0.25) {
    direction = "decreasing"
  }
  return {
    direction,
    change,
    sample_size: sorted.length
  }
}
module.exports = {
  calculateProgressTrend
}
