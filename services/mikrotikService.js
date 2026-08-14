const { RouterOSAPI } = require("routeros-client");

// ======================================
// Create MikroTik API connection
// ======================================

function createMikroTikAPI({
    host,
    username,
    password,
    port = 8728
}) {

    const api = new RouterOSAPI({
        host,
        user: username,
        password,
        port: Number(port),
        timeout: 5000
    });

    // VERY IMPORTANT:
    // Prevent RouterOS socket errors from
    // becoming unhandled Node.js errors.

    api.on("error", (error) => {

        console.error(
            "MikroTik API error:",
            error.message || error
        );

    });

    return api;
}


// ======================================
// Test MikroTik connection
// ======================================

async function testMikroTikConnection({
    host,
    username,
    password,
    port = 8728
}) {

    let api;

    try {

        api = createMikroTikAPI({
            host,
            username,
            password,
            port
        });

        await api.connect();

        const identity =
            await api.write(
                "/system/identity/print"
            );

        return {

            success: true,

            message:
                "MikroTik connection successful.",

            identity:
                identity &&
                identity[0] &&
                identity[0].name
                    ? identity[0].name
                    : "MikroTik"

        };

    } catch (error) {

        console.error(
            "MikroTik connection error:",
            error
        );

        return {

            success: false,

            message:
                error.message ||
                "Unable to connect to MikroTik."

        };

    } finally {

        if (api) {

            try {
                await api.close();
            } catch (_) {}

        }

    }

}


// ======================================
// GET ACTIVE HOTSPOT USERS
// ======================================

async function getActiveHotspotUsers({
    host,
    username,
    password,
    port = 8728
}) {

    let api;

    try {

        api = createMikroTikAPI({
            host,
            username,
            password,
            port
        });

        await api.connect();

        const users =
            await api.write(
                "/ip/hotspot/active/print"
            );

        return {

            success: true,

            users: users || [],

            count:
                Array.isArray(users)
                    ? users.length
                    : 0

        };

    } catch (error) {

        console.error(
            "Get active MikroTik users error:",
            error
        );

        return {

            success: false,

            users: [],

            count: 0,

            message:
                error.message ||
                "Unable to get active MikroTik users."

        };

    } finally {

        if (api) {

            try {
                await api.close();
            } catch (_) {}

        }

    }

}


// ======================================
// DISCONNECT ACTIVE HOTSPOT USER
// ======================================

async function disconnectHotspotUser({
    host,
    username,
    password,
    port = 8728,
    sessionId
}) {

    let api;

    try {

        if (!sessionId) {

            return {

                success: false,

                message:
                    "MikroTik active session ID is required."

            };

        }

        api = createMikroTikAPI({
            host,
            username,
            password,
            port
        });

        await api.connect();

        console.log(
            "Disconnecting MikroTik session:",
            sessionId
        );

        await api.write(
            "/ip/hotspot/active/remove",
            [
                `=.id=${sessionId}`
            ]
        );

        return {

            success: true,

            message:
                "MikroTik user disconnected.",

            sessionId

        };

    } catch (error) {

        console.error(
            "MikroTik disconnect error:",
            error
        );

        return {

            success: false,

            message:
                error.message ||
                "Unable to disconnect MikroTik user."

        };

    } finally {

        if (api) {

            try {
                await api.close();
            } catch (_) {}

        }

    }

}


module.exports = {

    testMikroTikConnection,

    getActiveHotspotUsers,

    disconnectHotspotUser

};