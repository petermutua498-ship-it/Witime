const express = require("express");
const router = express.Router();

const requireAdmin = require("../middleware/adminAuth");
const {
    testMikroTikConnection
} = require("../services/mikrotikService");

// ======================================
// TEST MIKROTIK CONNECTION
// POST /api/admin/mikrotik/test
// ======================================

router.post("/test", requireAdmin, async (req, res) => {

    try {

        const {
            host,
            username,
            password,
            port
        } = req.body;

        if (!host || !username || !password) {

            return res.status(400).json({
                success: false,
                message:
                    "MikroTik host, username and password are required."
            });

        }

        console.log(
            `Testing MikroTik connection: ${host}:${port || 8728}`
        );

        const result =
            await testMikroTikConnection({
                host,
                username,
                password,
                port: port || 8728
            });

        if (!result.success) {

            return res.status(502).json(result);

        }

        return res.json(result);

    } catch (error) {

        console.error(
            "MikroTik test route error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to test MikroTik connection."
        });

    }

});

module.exports = router;