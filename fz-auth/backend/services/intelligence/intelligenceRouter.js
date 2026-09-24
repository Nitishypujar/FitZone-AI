const express = require("express")
const {
  buildIntelligenceSnapshot
} = require("./intelligenceService")
const router =
  express.Router()
async function authenticateUser(
  req,
  res
) {
  const authHeader =
    req.headers.authorization
  if (
    !authHeader ||
    !authHeader.startsWith("Bearer ")
  ) {
    res.status(401).json({
      status: "error",
      message:
        "Authentication required"
    })
    return null
  }
  const token =
    authHeader
      .replace("Bearer ", "")
      .trim()
  if (!token) {
    res.status(401).json({
      status: "error",
      message:
        "Authentication required"
    })
    return null
  }
  const supabase =
    req.app.locals.supabase
  if (!supabase) {
    throw new Error(
      "Supabase client unavailable"
    )
  }
  const {
    data: { user },
    error
  } =
    await supabase.auth.getUser(
      token
    )
  if (error || !user) {
    res.status(401).json({
      status: "error",
      message:
        "Invalid or expired authentication token"
    })
    return null
  }
  return user
}
router.get(
  "/snapshot",
  async (req, res) => {
    try {
      const user =
        await authenticateUser(
          req,
          res
        )
      if (!user) {
        return
      }
      const snapshot =
        await buildIntelligenceSnapshot(
          req.app.locals.supabase,
          user.id
        )
      return res.json({
        status: "success",
        data: snapshot
      })
    } catch (error) {
      console.error(
        "Intelligence snapshot error:",
        error
      )
      return res.status(500).json({
        status: "error",
        message:
          "Failed to build intelligence snapshot"
      })
    }
  }
)
router.get(
  "/learning",
  async (req, res) => {
    try {
      const user =
        await authenticateUser(
          req,
          res
        )
      if (!user) {
        return
      }
      const {
        getRecommendationLearning
      } =
        require("./learningService")
      const learning =
        await getRecommendationLearning(
          req.app.locals.supabase,
          user.id
        )
      return res.json({
        status: "success",
        data: learning
      })
    } catch (error) {
      console.error(
        "Recommendation learning error:",
        error
      )
      return res.status(500).json({
        status: "error",
        message:
          "Failed to load recommendation learning"
      })
    }
  }
)
module.exports = router
