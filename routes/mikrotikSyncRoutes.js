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

        // Find the WiTime user by phone.
        const witimeUser = await User.findOne({
            phone: user
        });

        if (!witimeUser) {

            console.log(
                "WiTime user not found:",
                user
            );

            return res.status(404).json({
                success: false,
                message: "WiTime user not found."
            });

        }

        // ======================================
        // USER IS ONLINE
        // ======================================

        if (status === "Online") {

            witimeUser.status = "Online";

            witimeUser.ipAddress =
                address || "";

            witimeUser.macAddress =
                macAddress || "";

            witimeUser.mikrotikSessionId =
                sessionId || "";

            await witimeUser.save();

            console.log(
                "✅ WiTime user marked Online:",
                user
            );

        }

        // ======================================
        // USER IS OFFLINE
        // ======================================

        else {

            witimeUser.status = "Offline";

            witimeUser.ipAddress = "";
            witimeUser.macAddress = "";
            witimeUser.mikrotikSessionId = "";

            await witimeUser.save();

const verifiedUser = await User.findOne({
    phone: user
});

console.log("✅ AFTER SAVE:", {
    phone: verifiedUser.phone,
    status: verifiedUser.status,
    ipAddress: verifiedUser.ipAddress,
    macAddress: verifiedUser.macAddress,
    mikrotikSessionId: verifiedUser.mikrotikSessionId
});

        }

        return res.json({

            success: true,

            message:
                "MikroTik user synchronized.",

            user: {

                phone: witimeUser.phone,

                status: witimeUser.status,

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