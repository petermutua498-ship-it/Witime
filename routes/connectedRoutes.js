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

        const phone =
            String(req.params.phone).trim();


        if (!phone) {

            return res.status(400).json({

                success: false,

                message:
                    "Phone number is required."

            });

        }


        // ==================================
        // FIND WITIME USER
        // ==================================

        const user =
            await User.findOne({
                phone
            });


        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "WiTime user not found."

            });

        }


        // ==================================
        // DEFAULT VALUES
        // ==================================

        let status =
            user.status || "Offline";

        let remainingSeconds = 0;

        let countdown = "Expired";


        // ==================================
        // WITIME EXPIRY CALCULATION
        // ==================================

        if (user.expiryTime) {

            const now =
                new Date();

            const expiry =
                new Date(user.expiryTime);

            const difference =
                expiry.getTime() -
                now.getTime();


            if (difference > 0) {

                remainingSeconds =
                    Math.floor(
                        difference / 1000
                    );

            }

        }


        // ==================================
        // CHECK MIKROTIK
        // ==================================

        let mikrotikOnline = false;

        let mikrotikUser = null;


        try {

            const result =
                await getActiveHotspotUsers({

                    host:
                        process.env.MIKROTIK_HOST,

                    username:
                        process.env.MIKROTIK_USERNAME,

                    password:
                        process.env.MIKROTIK_PASSWORD,

                    port:
                        Number(
                            process.env.MIKROTIK_PORT || 8728
                        )

                });


            if (
                result &&
                result.success &&
                Array.isArray(result.users)
            ) {

                mikrotikUser =
                    result.users.find(
                        activeUser =>
                            String(
                                activeUser.user
                            ).trim() === phone
                    );


                if (mikrotikUser) {

                    mikrotikOnline = true;

                    status = "Online";


                    // ----------------------------------
                    // UPDATE USER CONNECTION INFORMATION
                    // ----------------------------------

                    user.status = "Online";

                    user.ipAddress =
                        mikrotikUser.address || "";

                    user.macAddress =
                        mikrotikUser.macAddress || "";

                    user.mikrotikSessionId =
                        mikrotikUser.id || "";

                    user.lastSeen =
                        new Date();


                    await user.save();

                }

            }

        } catch (mikrotikError) {

            console.error(
                "Connected route MikroTik check error:",
                mikrotikError.message
            );

        }


        // ==================================
        // IF NOT ACTIVE ON MIKROTIK
        // ==================================

        if (!mikrotikOnline) {

            if (
                status !== "Expired" &&
                remainingSeconds > 0
            ) {

                status =
                    user.status || "Offline";

            }

        }


        // ==================================
        // EXPIRED
        // ==================================

        if (remainingSeconds <= 0) {

            status = "Expired";

            remainingSeconds = 0;

            countdown = "Expired";

        }


        // ==================================
        // FORMAT COUNTDOWN
        // ==================================

        if (remainingSeconds > 0) {

            const days =
                Math.floor(
                    remainingSeconds / 86400
                );

            const hours =
                Math.floor(
                    (remainingSeconds % 86400) /
                    3600
                );

            const minutes =
                Math.floor(
                    (remainingSeconds % 3600) /
                    60
                );

            const seconds =
                remainingSeconds % 60;


            countdown =
                `${days}d ${hours}h ${minutes}m ${seconds}s`;

        }


        // ==================================
        // RESPONSE
        // ==================================

        return res.json({

            success: true,

            phone:
                user.phone,

            packageName:
                user.packageName,

            status,

            ipAddress:
                user.ipAddress || "",

            macAddress:
                user.macAddress || "",

            mikrotikSessionId:
                user.mikrotikSessionId || "",

            mikrotikOnline,

            mikrotikUptime:
                mikrotikUser?.uptime || "",

            loginTime:
                user.loginTime || null,

            expiryTime:
                user.expiryTime || null,

            remainingTime:
                user.remainingTime || "",

            remainingSeconds,

            countdown,

            lastSeen:
                user.lastSeen || null

        });

    } catch (error) {

        console.error(
            "Connected user error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to load connection information."

        });

    }

});


module.exports = router;