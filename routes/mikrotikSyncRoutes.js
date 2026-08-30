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
            id,
            status
        } = req.body;


        console.log(
            "📡 MikroTik sync received:",
            {
                user,
                address,
                macAddress,
                id,
                status
            }
        );


        // ======================================
        // VALIDATE USER
        // ======================================

        if (!user) {

            return res.status(400).json({

                success: false,

                message:
                    "MikroTik username is required."

            });

        }


        // ======================================
        // NORMALIZE PHONE
        // ======================================

        const phone =
            String(user).trim();


        // ======================================
        // FIND WITIME USER
        // ======================================

        const witimeUser =
            await User.findOne({
                phone
            });


        if (!witimeUser) {

    console.log(
        `ℹ️ Ignoring MikroTik user not registered in WiTime: ${phone}`
    );

    return res.json({

        success: true,

        ignored: true,

        message:
            "MikroTik user is not registered in WiTime."

    });

}


        // ======================================
        // ONLINE
        // ======================================

        if (status === "Online") {

            witimeUser.status =
                "Online";


            witimeUser.ipAddress =
                address || "";


            witimeUser.macAddress =
                macAddress || "";


            witimeUser.mikrotikSessionId =
                id || "";


            witimeUser.lastSeen =
                new Date();

        }


        // ======================================
        // OFFLINE
        // ======================================

        else {

            witimeUser.status =
                "Offline";


            witimeUser.ipAddress =
                "";


            witimeUser.macAddress =
                "";


            witimeUser.mikrotikSessionId =
                "";


            witimeUser.lastSeen =
                null;

        }


        // ======================================
        // SAVE
        // ======================================

        await witimeUser.save();


        console.log(
            "✅ WiTime user updated:",
            {
                phone:
                    witimeUser.phone,

                status:
                    witimeUser.status,

                ip:
                    witimeUser.ipAddress,

                mac:
                    witimeUser.macAddress,

                session:
                    witimeUser.mikrotikSessionId
            }
        );


        // ======================================
        // RESPONSE
        // ======================================

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