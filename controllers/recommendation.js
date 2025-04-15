const users = require("../models/users");
const tokens = require("../models/tokens");
const questions = require("../models/questionBank");
const predict = require("../ml/load");
const { verifyToken } = require("../services/jwt");

// Initialize user stats only once
const initializeStats = async (user) => {
  try {
    const questionStats = await questions.aggregate([
      { $sort: { rating: 1 } },
      { $project: { title: 1, tags: 1, difficulty: 1, rating: 1 } }
    ]);

    if (!user.stats.tags) {
      user.stats.tags = {};
    }

    for (const { tags, title, rating, difficulty } of questionStats) {
      if (!user.stats.tags[tags]) {
        user.stats.tags[tags] = [[], [], 0, 0, []];
      }
      user.stats.tags[tags][1].push({ title, rating });

      const diffValue = difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3;
      user.stats.tags[tags][3] += diffValue;
    }
  } catch (err) {
    console.error("Stats init error:", err);
  }
};

// Get next question recommendation
const getRecommendation = async (user) => {
  if (!user.stats.initialised) {
    console.log("Initializing stats...");
    await initializeStats(user);
    user.stats.initialised = true;
    await users.updateOne({ email: user.email }, { $set: { stats: user.stats } });
  }

  const inputForModel = Object.values(user.stats.tags).map(
    ([, , solvedSum, totalWeight]) =>
      totalWeight !== 0 ? (solvedSum / totalWeight) * 100 : 0
  );

  console.log("Input for model:", inputForModel);
  const outputTopic = await predict(inputForModel);
  console.log("Model output:", outputTopic);

  const tagStats = user.stats.tags[outputTopic];
  if (!tagStats) return "topic complete";

  const [solvedList, unsolvedList, , , skippedList] = tagStats;

  if (unsolvedList.length > 0) return unsolvedList[0].title;
  if (skippedList.length > 0) return skippedList[0].title;
  
  return "topic complete";
};

// Recommend endpoint handler
const recommend = async (req, res) => {
  try {
    const token = req.cookies.userToken;
    if (!token) return res.json({ status: "user logged out" });

    const tokenExists = await tokens.exists({ token });
    if (!tokenExists) return res.json({ status: "invalid user" });

    const { email } = verifyToken(token);
    const user = await users.findOne({ email });
    if (!user) return res.json({ status: "user not found" });

    const recommendedTitle = await getRecommendation(user);
    if (!recommendedTitle) return res.json({ status: "no question found" });
    if (recommendedTitle === "topic complete") return res.json({ status: "topic complete" });
    const questionDetails = await questions.findOne({ title: recommendedTitle });
    return res.json({ status: "success", question: questionDetails });
  } catch (err) {
    console.log("Recommendation error:", err);
    return res.json({ status: "error" });
  }
};

module.exports = recommend;
