const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ✅ Signup route
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  // Edge case 1: Missing fields
  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Edge case 2: Duplicate email
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ error: "Email already registered" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: "User created!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Login route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // ✅ 1. Check for empty fields
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // ✅ 2. Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    // ✅ 3. Check password match
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid password" });

    // ✅ 4. Create token
    const token = jwt.sign(
  { userId: user._id },
  process.env.JWT_SECRET,
  { expiresIn: "2h" } // ⏰ Token valid for 2 hours
);


    res.json({ token, user: { name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
