const app = require("../controllers/app");
const express = require("express");
const router = express.Router();

router.get("/", app);

module.exports = router;