const express = require("express");
const router = express.Router();
const Job = require("../models/job");
const jwt = require("jsonwebtoken");
const validateObjectId = require("../middleware/validateObjectId");

// ✅ Middleware to check JWT and extract userId
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

// ✅ Apply auth middleware globally to all job routes
router.use(authMiddleware);

// 🟢 Create job
router.post("/", async (req, res) => {
  const { title, company, status, notes } = req.body;

  if (!title || !company) {
    return res.status(400).json({ error: "Title and company are required" });
  }

  try {
    const newJob = new Job({
      title,
      company,
      status,
      notes,
      userId: req.userId
    });
    await newJob.save();
    res.status(201).json(newJob);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📥 Get all jobs (user-specific)
router.get("/", async (req, res) => {
  try {
    const jobs = await Job.find({ userId: req.userId }).sort({ date: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✏️ Update job
router.put("/:id", validateObjectId, async (req, res) => {
  try {
    const updated = await Job.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ❌ Delete job
router.delete("/:id", validateObjectId, async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json({ message: "Job deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
