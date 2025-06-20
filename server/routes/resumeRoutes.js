const express = require("express");
const router = express.Router();
const fs = require("fs");
const pdfParse = require("pdf-parse");
const upload = require("../middleware/upload");

const EXPECTED_KEYWORDS = [
  "JavaScript", "React", "Node.js", "MongoDB", "REST API", "Express",
  "JWT", "Git", "DSA", "System Design"
];

router.post("/upload", upload.single("resume"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded. Please upload a PDF." });
  }

  try {
    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(dataBuffer);
    const text = pdfData.text.toLowerCase();

    const found = [];
    const missing = [];

    EXPECTED_KEYWORDS.forEach((keyword) => {
      if (text.includes(keyword.toLowerCase())) {
        found.push(keyword);
      } else {
        missing.push(keyword);
      }
    });

    const matchScore = Math.round((found.length / EXPECTED_KEYWORDS.length) * 100);

    // ✅ Clean up file if not needed
    fs.unlink(req.file.path, () => {});

    res.json({ matchScore, found, missing });
  } catch (err) {
    console.error("PDF Parse Error:", err);
    res.status(500).json({ error: "Error analyzing resume. Please try again." });
  }
});

module.exports = router;
