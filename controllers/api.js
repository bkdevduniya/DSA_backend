const { verifyToken } = require('../services/jwt');
const users = require('../models/users');
const tokens = require('../models/tokens');
const questionBank = require('../models/questionBank');

// Middleware: Check if user is an admin and logged in
const checkLoggedIn = async (req, res, next) => {
  try {
    const token = req.cookies.userToken;
    if (!token) return res.status(401).json({ msg: "user not logged in" });

    const tokenStatus = await tokens.exists({ token });
    if (!tokenStatus) return res.status(401).json({ msg: "user not logged in" });

    const { role } = verifyToken(token);
    if (role !== "admin") {
      return res.status(401).json({ admin: "false", msg: "unauthorized user" });
    }

    return res.status(200).json({ admin: "true", msg: "verification success" });
  } catch (err) {
    console.log(err);
    return res.status(401).json({ admin: "false", msg: "verification failed" });
  }
};

// Upload a new question
const postQuestion = async (req, res) => {
  try {
    await questionBank.create(req.body);
    return res.status(200).json({ msg: "question uploaded" });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ msg: "question url/title already exist" });
  }
};

// Logout a user
const logoutUser = async (req, res) => {
  try {
    const token = req.cookies.userToken;
    if (!token) return res.status(401).json({ msg: "user not logged in" });

    await tokens.deleteOne({ token });
    res.clearCookie('userToken');
    return res.status(200).json({ msg: "logout success" });
  } catch (err) {
    console.log(err);
    return res.status(401).json({ msg: "logout error" });
  }
};

// Helper function to authenticate and get user instance
const getUserFromToken = async (token) => {
  if (!token) throw new Error("Token not found");

  const tokenExists = await tokens.exists({ token });
  if (!tokenExists) throw new Error("Token invalid");

  const { email } = verifyToken(token);
  const user = await users.findOne({ email });
  if (!user) throw new Error("User not found");

  return user;
};

// Mark question as solved
const markSolved = async (req, res) => {
  try {
    const user = await getUserFromToken(req.cookies.userToken);
    const result = await user.solved(req.body);
    await user.save();
    return res.status(200).json({ status: result });
  } catch (err) {
    console.log(err);
    return res.status(401).json({ msg: err.message || "error" });
  }
};

// Mark question as unsolved
const unsolved = async (req, res) => {
  try {
    const user = await getUserFromToken(req.cookies.userToken);
    const result = await user.markUnsolved(req.body);
    await user.save();
    return res.status(200).json({ status: result });
  } catch (err) {
    console.log(err);
    return res.status(401).json({ msg: err.message || "error" });
  }
};

// Skip a question
const skip = async (req, res) => {
  try {
    const user = await getUserFromToken(req.cookies.userToken);
    const result = await user.skip(req.body);
    await user.save();
    return res.status(200).json({ status: result });
  } catch (err) {
    console.log(err);
    return res.status(401).json({ msg: err.message || "error" });
  }
};

// Handle search for questions based on filters
const searchHandler = async (req, res) => {
  try {
    const token = req.cookies.userToken;
    if (!token) return res.status(200).json({ msg: "user not logged in" });

    const tokenExists = await tokens.exists({ token });
    if (!tokenExists) return res.status(200).json({ msg: "user not logged in" });

    const { email } = verifyToken(token);
    const user = await users.findOne({ email });
    if (!user) return res.status(200).json({ msg: "user not found" });

    const { tag, difficultyMin = 800, difficultyMax = 2000 } = req.query;

    const matchQuery = {
      tags: tag ?? {
        $in: [
          'array', 'string', 'linked list', 'hash table', 'two pointers', 'sorting',
          'searching', 'binary search', 'sliding window', 'heap', 'tree', 'backtracking',
          'greedy', 'depth first search', 'breadth first search', 'bit manipulation',
          'prefix sum', 'graph', 'topological_sort', 'dynamic programming', 'trie',
          'segment tree', 'fenwick_tree', 'persistent segment tree', 'sparse table',
          'number theory', 'combinatorics', 'modular arithmetic', 'game theory',
          'bitmasking', 'memoization', 'geometry', 'recursion'
        ]
      },
      rating: {
        $gte: Number(difficultyMin),
        $lte: Number(difficultyMax)
      }
    };

    let result = await questionBank.aggregate([
      { $match: matchQuery },
      { $sort: { rating: 1 } }
    ]);

    result = result.map((question) => {
      const userTagStats = user.stats.tags[question.tags];
      const isSolved = userTagStats?.[0]?.some(q => q.title === question.title);
      return { ...question, status: isSolved ? "solved" : "unsolved" };
    });

    return res.status(200).json({ result });
  } catch (err) {
    console.log(err);
    return res.status(401).json({ msg: "error" });
  }
};

module.exports = {
  checkLoggedIn,
  logoutUser,
  postQuestion,
  markSolved,
  unsolved,
  skip,
  searchHandler
};
