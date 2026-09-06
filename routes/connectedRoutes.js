const express = require("express");
const router = express.Router();

const User = require("../models/Users");

const {
    getActiveHotspotUsers
} = require("../services/mikrotikService");

// ======================================
// GET CONNECTED USER
// GET /api/connected/:phone
// ======================================

router.get("/:phone", async (req, res) => {
    try {
        const { phone } = req.params;

        // 1. FIND WITIME USER
        const user = await User.findOne({ phone });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "WiTime user not found."
            });
        }

        // 2. DEFAULT VALUES
        let status = user.status || "Offline";
        let remainingSeconds = 0;
        let countdown = "Expired";

        // 3. WITIME EXPIRY CALCULATION
        if (user.expiryTime) {
            const now = new Date();
            const expiry = new Date(user.expiryTime);
            const difference = expiry.getTime() - now.getTime();

            if (difference > 0) {
                remainingSeconds = Math.floor(difference / 1000);
            }
        }

        // 4. CHECK MIKROTIK (GUARDED FOR CLOUD DEPLOYMENT)
        let mikrotikOnline = false;
        let mikrotikUser = null;

        const host = process.env.MIKROTIK_HOST;
        const isLocalHost = !host || host === "192.168.88.1" || host === "localhost" || host === "127.0.0.1";

        // Only attempt direct socket query if running locally with a valid remote host
        if (!isLocalHost) {
            try {
                const result = await getActiveHotspotUsers({
                    host: process.env.MIKROTIK_HOST,
                    username: process.env.MIKROTIK_USERNAME,
                    password: process.env.MIKROTIK_PASSWORD,
                    port: Number(process.env.MIKROTIK_PORT || 8728)
                });

                if (result && result.success && Array.isArray(result.users)) {
                    mikrotikUser = result.users.find(
                        activeUser => String(activeUser.user).trim() === phone
                    );

                    if (mikrotikUser) {
                        mikrotikOnline = true;
                        status = "Online";

                        user.status = "Online";
                        user.ipAddress = mikrotikUser.address || "";
                        user.macAddress = mikrotikUser.macAddress || "";
                        user.mikrotikSessionId = mikrotikUser.id || "";
                        user.lastSeen = new Date();

                        await user.save();
                    }
                }
            } catch (mikrotikError) {
                console.error(
                    "Connected route MikroTik check error:",
                    mikrotikError.message
                );
            }
        }

        // 5. STATUS FALLBACK & EXPIRY CHECK
        if (!mikrotikOnline && remainingSeconds > 0) {
            status = user.status === "Expired" ? "Offline" : (user.status || "Paid");
        }

        if (remainingSeconds <= 0) {
            status = "Expired";
            remainingSeconds = 0;
            countdown = "Expired";
        } else {
            // 6. FORMAT COUNTDOWN
            const days = Math.floor(remainingSeconds / 86400);
            const hours = Math.floor((remainingSeconds % 86400) / 3600);
            const minutes = Math.floor((remainingSeconds % 3600) / 60);
            const seconds = remainingSeconds % 60;

            countdown = days > 0 
                ? `${days}d ${hours}h ${minutes}m ${seconds}s` 
                : `${hours}h ${minutes}m ${seconds}s`;
        }

        // 7. RESPONSE
        return res.json({
            success: true,
            phone: user.phone,
            packageName: user.packageName,
            status,
            ipAddress: user.ipAddress || "",
            macAddress: user.macAddress || "",
            mikrotikSessionId: user.mikrotikSessionId || "",
            mikrotikOnline,
            mikrotikUptime: mikrotikUser?.uptime || "",
            loginTime: user.loginTime || null,
            expiryTime: user.expiryTime || null,
            remainingTime: user.remainingTime || "",
            remainingSeconds,
            countdown,
            lastSeen: user.lastSeen || null
        });

    } catch (error) {
        console.error("Connected user error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to load connection information."
        });
    }
});

module.exports = router;