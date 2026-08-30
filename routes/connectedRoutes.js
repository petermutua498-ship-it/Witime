const express = require("express");
const router = express.Router();

const User = require("../models/Users");


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
        // CHECK EXPIRY
        // ==================================

        const now =
            new Date();

        let status =
            user.status || "Offline";


        if (
            user.expiryTime &&
            new Date(user.expiryTime) <= now
        ) {

            status = "Expired";

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

            loginTime:
                user.loginTime,

            expiryTime:
                user.expiryTime,

            remainingTime:
                user.remainingTime,

            lastSeen:
                user.lastSeen

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