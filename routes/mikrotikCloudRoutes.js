const express = require("express");

const router = express.Router();


// ======================================
// VERIFY MIKROTIK CLOUD TOKEN
// ======================================

function verifyRouterToken(req, res, next) {

    const token =
        req.headers["x-router-token"];

    if (
        !token ||
        token !== process.env.MIKROTIK_CLOUD_TOKEN
    ) {

        console.log(
            "❌ Unauthorized MikroTik cloud request"
        );

        return res.status(401).json({

            success: false,

            message:
                "Unauthorized MikroTik request."

        });

    }

    next();

}


// ======================================
// MIKROTIK HEARTBEAT
// GET /api/mikrotik/cloud/heartbeat
// ======================================

router.get(
    "/heartbeat",
    verifyRouterToken,
    (req, res) => {

        console.log(
            "💓 MikroTik heartbeat received"
        );

        return res.json({

            success: true,

            message:
                "WiTime MikroTik cloud connection is active.",

            time:
                new Date().toISOString()

        });

    }
);


module.exports = router;