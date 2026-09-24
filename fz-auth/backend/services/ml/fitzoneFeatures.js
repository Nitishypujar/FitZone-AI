function buildFitZoneActivityFeatures(userState = {}, context = {}) {
  const profile = context.profile || {}

  return {
    age: Number(profile.age || 0),

    sex: Number(profile.sex || 0),

    race_ethnicity:
      Number(profile.race_ethnicity || 0),

    education:
      Number(profile.education || 0),

    marital_status:
      Number(profile.marital_status || 0),

    income_poverty_ratio:
      Number(profile.income_poverty_ratio || 0),

    vigorous_activity_days:
      Number(profile.vigorous_activity_days || 0),

    moderate_activity_days:
      Number(profile.moderate_activity_days || 0),

    vigorous_minutes_week:
      Number(profile.vigorous_minutes_week || 0),

    moderate_minutes_week:
      Number(profile.moderate_minutes_week || 0),

    sedentary_minutes_day:
      Number(profile.sedentary_minutes_day || 0),
  }
}

module.exports = {
  buildFitZoneActivityFeatures,
}