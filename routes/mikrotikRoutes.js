const express = require("express");
const router = express.Router();

const {
    testMikroTikConnection,
    createHotspotProfile,
    createHotspotUser
} = require("../services/mikrotikService");


// ======================================
// TEST MIKROTIK CONNECTION
// POST /api/admin/mikrotik/test
// ======================================

router.post("/test", async (req, res) => {

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

                

                port:
                    port || 8728

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

// ======================================
// TEST MIKROTIK USER CREATION
// POST /api/admin/mikrotik/test-user
// ======================================

router.post("/test-user", async (req, res) => {

    try {

        const {
            phone,
            profileName,
            duration,
            durationUnit
        } = req.body;

        if (
            !phone ||
            !profileName ||
            !duration ||
            !durationUnit
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "phone, profileName, duration and durationUnit are required."

            });

        }

        const host =
            process.env.MIKROTIK_HOST;

        const username =
            process.env.MIKROTIK_USERNAME;

        const password =
            process.env.MIKROTIK_PASSWORD;

        const port =
            process.env.MIKROTIK_PORT || 8728;


        // ----------------------------------
        // CREATE PROFILE
        // ----------------------------------

        const profile =
            await createHotspotProfile({

                host,
                username,
                password,
                port,

                profileName,

                duration,

                durationUnit

            });


        if (!profile.success) {

            return res.status(500).json(profile);

        }


        // ----------------------------------
        // CREATE HOTSPOT USER
        // ----------------------------------

        const user =
            await createHotspotUser({

                host,
                username,
                password,
                port,

                phone,

                userPassword:
                    phone,

                profileName,

                limitUptime:
                    profile.sessionTimeout

            });


        if (!user.success) {

            return res.status(500).json(user);

        }


        return res.json({

            success: true,

            message:
                "MikroTik test user created successfully.",

            phone,

            profileName,

            sessionTimeout:
                profile.sessionTimeout

        });

    } catch (error) {

        console.error(
            "MikroTik test-user error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Unable to create test MikroTik user."

        });

    }

});

module.exports = router;