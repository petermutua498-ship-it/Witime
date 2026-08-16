const express = require("express");
const router = express.Router();

const User = require("../models/Users");

// ======================================
// MIKROTIK → WITIME USER SYNC
// POST /api/mikrotik/sync
// ======================================

router.post("/sync", async (req, res) => {

    try {

        const {
            user,
            address,
            macAddress,
            sessionId,
            status
        } = req.body;

        console.log("MikroTik sync received:", {
            user,
            address,
            macAddress,
            sessionId,
            status
        });

        if (!user) {

            return res.status(400).json({
                success: false,
                message: "MikroTik username is required."
            });

        }

        // ======================================
        // FIND USER
        // ======================================

        const witimeUser = await User.findOne({
            phone: String(user)
        });

        if (!witimeUser) {

            console.log(
                "❌ WiTime user not found:",
                user
            );

            return res.status(404).json({
                success: false,
                message: "WiTime user not found."
            });

        }

        // ======================================
        // UPDATE CONNECTION INFORMATION
        // ======================================

        witimeUser.status =
            status === "Online"
                ? "Online"
                : "Offline";

        if (status === "Online") {

            witimeUser.ipAddress =
                address || "";

            witimeUser.macAddress =
                macAddress || "";

            witimeUser.mikrotikSessionId =
                sessionId || "";

            witimeUser.lastSeen = new Date();

        } else {

            witimeUser.ipAddress = "";
            witimeUser.macAddress = "";
            witimeUser.mikrotikSessionId = "";

        }

        await witimeUser.save();

        console.log(
            "✅ WiTime user updated:",
            witimeUser.phone,
            witimeUser.status
        );

        return res.json({

            success: true,

            message:
                "MikroTik user synchronized.",

            user: {

                phone:
                    witimeUser.phone,

                status:
                    witimeUser.status,

                ipAddress:
                    witimeUser.ipAddress,

                macAddress:
                    witimeUser.macAddress,

                mikrotikSessionId:
                    witimeUser.mikrotikSessionId

            }

        });

    } catch (error) {

        console.error(
            "❌ MikroTik sync error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to synchronize MikroTik user."

        });

    }

});

module.exports = router;