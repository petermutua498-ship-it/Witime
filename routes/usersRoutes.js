const express = require("express");
const router = express.Router();

const User = require("../models/Users");

const {
    disconnectUserByPhone,
    connectWiTimeUserToMikroTik
} = require("../services/mikrotikService");


// ======================================
// GET ALL USERS
// ======================================

router.get("/", async (req, res) => {

    try {

        const users = await User.find()
            .sort({ createdAt: -1 });

        res.json(users);

    } catch (err) {

        console.error("Get users error:", err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});


// ======================================
// GET SINGLE USER
// ======================================

router.get("/:id", async (req, res) => {

    try {

        const user = await User.findById(req.params.id);

        if (!user) {

            return res.status(404).json({
                success: false,
                message: "User not found"
            });

        }

        res.json({
            success: true,
            user
        });

    } catch (err) {

        console.error("Get user error:", err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});


// ======================================
// DISCONNECT USER
// ======================================

router.post("/:id/disconnect", async (req, res) => {

    try {

        const user = await User.findById(req.params.id);

        if (!user) {

            return res.status(404).json({
                success: false,
                message: "User not found"
            });

        }

        console.log(
            `🔴 Disconnecting MikroTik user: ${user.phone}`
        );


        // Remove active MikroTik session
        try {

            await disconnectUserByPhone(
                user.phone
            );

            console.log(
                `✅ MikroTik user disconnected: ${user.phone}`
            );

        } catch (mikrotikError) {

            console.error(
                "⚠️ MikroTik disconnect failed:",
                mikrotikError.message
            );

        }


        // Update WiTime
        user.status = "Offline";
        user.ipAddress = "";
        user.macAddress = "";
        user.mikrotikSessionId = "";
        user.lastSeen = null;

        await user.save();


        res.json({

            success: true,

            message:
                "User disconnected successfully."

        });

    } catch (err) {

        console.error(
            "Disconnect user error:",
            err
        );

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

});
// =======================================
// EXTEND USER TIME
// =======================================
router.post("/:id/extend", async (req, res) => {
    try {
        const { duration, durationUnit = "minutes" } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const extraMinutes = Number(duration);

        if (!extraMinutes || extraMinutes <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid extension duration"
            });
        }

        // ---------------------------------------
        // Convert extension to minutes
        // ---------------------------------------
        let minutesToAdd = extraMinutes;

        if (durationUnit.toLowerCase() === "hours") {
            minutesToAdd = extraMinutes * 60;
        }

        if (durationUnit.toLowerCase() === "days") {
            minutesToAdd = extraMinutes * 24 * 60;
        }

        // ---------------------------------------
        // Get current remaining time
        // ---------------------------------------
        let currentSeconds = Number(user.remainingSeconds || 0);

        // If remainingSeconds is empty but remainingTime exists,
        // try to recover the time from the text.
        if (currentSeconds <= 0 && user.remainingTime) {
            const match = user.remainingTime.match(
                /(?:(\d+)\s*Hours?)?\s*(?:(\d+)\s*Minutes?)?/i
            );

            if (match) {
                const hours = Number(match[1] || 0);
                const minutes = Number(match[2] || 0);

                currentSeconds = (hours * 60 + minutes) * 60;
            }
        }

        // ---------------------------------------
        // Add extension
        // ---------------------------------------
        const extensionSeconds = minutesToAdd * 60;

        const newRemainingSeconds =
            currentSeconds + extensionSeconds;

        // ---------------------------------------
        // Calculate new expiry
        // ---------------------------------------
        const now = new Date();

        user.remainingSeconds = newRemainingSeconds;

        user.expiryTime = new Date(
            now.getTime() + newRemainingSeconds * 1000
        );

        // ---------------------------------------
        // Format remaining time
        // ---------------------------------------
        const totalMinutes = Math.floor(
            newRemainingSeconds / 60
        );

        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        if (hours > 0) {
            user.remainingTime =
                `${hours} Hours ${minutes} Minutes`;
        } else {
            user.remainingTime =
                `${minutes} Minutes`;
        }

        user.status = "Online";

        await user.save();

        // ---------------------------------------
        // Update MikroTik with the NEW total time
        // ---------------------------------------
        try {
            await connectWiTimeUserToMikroTik({
                phone: user.phone,
                packageName: user.packageName,
                duration: newRemainingSeconds,
                durationUnit: "seconds"
            });
        } catch (mikrotikError) {
            console.error(
                "MikroTik extension update failed:",
                mikrotikError.message
            );

            return res.status(500).json({
                success: false,
                message: "Time updated in WiTime but MikroTik update failed",
                user
            });
        }

        res.json({
            success: true,
            message: "User time extended successfully",
            remainingSeconds: user.remainingSeconds,
            remainingTime: user.remainingTime,
            expiryTime: user.expiryTime
        });

    } catch (error) {
        console.error("Extend user error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to extend user time",
            error: error.message
        });
    }
});


// ======================================
// FORMAT REMAINING TIME
// ======================================

function formatRemaining(seconds) {

    seconds = Math.max(
        0,
        Number(seconds) || 0
    );

    const hours =
        Math.floor(seconds / 3600);

    const minutes =
        Math.floor(
            (seconds % 3600) / 60
        );

    const secs =
        seconds % 60;


    if (hours > 0) {

        return `${hours}h ${minutes}m ${secs}s`;

    }

    if (minutes > 0) {

        return `${minutes}m ${secs}s`;

    }

    return `${secs}s`;

}


module.exports = router;