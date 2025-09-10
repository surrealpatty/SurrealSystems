// routes/profile.js
const express = require("express");
const router = express.Router();

// PUT /api/profile/:id  → update a user's profile
router.put("/:id", async (req, res) => {
    try {
        const { username, description } = req.body;
        const { id } = req.params;

        if (!username) {
            return res.status(400).json({ error: "Username is required" });
        }

        // TODO: Update user in your DB. For now we’ll just echo back.
        res.json({
            success: true,
            message: "Profile updated successfully",
            user: { id, username, description }
        });
    } catch (err) {
        console.error("Profile update error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
