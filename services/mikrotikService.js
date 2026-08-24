const { RouterOSClient } = require("routeros-client");

// ======================================
// CREATE MIKROTIK API CONNECTION
// ======================================

function createMikroTikAPI({
    host,
    username,
    password,
    port = 8728
}) {
    return new RouterOSClient({
        host,
        user: username,
        password,
        port: Number(port)
    });
}


// ======================================
// GET MIKROTIK CONFIG FROM .ENV
// ======================================

function getMikroTikConfig() {

    const host = process.env.MIKROTIK_HOST;
    const username = process.env.MIKROTIK_USERNAME;
    const password = process.env.MIKROTIK_PASSWORD;
    const port = Number(
        process.env.MIKROTIK_PORT || 8728
    );

    if (!host || !username || !password) {

        return {
            success: false,
            message:
                "MikroTik configuration is missing from .env."
        };

    }

    return {
        success: true,
        host,
        username,
        password,
        port
    };
}


// ======================================
// TEST MIKROTIK CONNECTION
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

        console.log(
            "✅ MikroTik connection successful:",
            host
        );

        return {

            success: true,

            message:
                "MikroTik connection successful.",

            identity:
                identity?.[0]?.name ||
                "MikroTik"

        };

    } catch (error) {

        console.error(
            "❌ MikroTik connection error:",
            error.message
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
// CONVERT DURATION TO ROUTEROS FORMAT
// ======================================

function convertDurationToRouterOS(
    duration,
    unit
) {

    const value = Number(duration);

    if (
        !Number.isFinite(value) ||
        value <= 0
    ) {

        throw new Error(
            "Invalid package duration."
        );

    }

    switch (unit) {

        case "Minutes":
            return `${value}m`;

        case "Hours":
            return `${value}h`;

        case "Days":
            return `${value}d`;

        case "Weeks":
            return `${value * 7}d`;

        case "Months":
            return `${value * 30}d`;

        default:
            throw new Error(
                `Unsupported duration unit: ${unit}`
            );

    }

}


// ======================================
// CREATE / UPDATE HOTSPOT PROFILE
// ======================================

async function createHotspotProfile({

    host,
    username,
    password,
    port = 8728,

    profileName,

    duration,

    durationUnit

}) {

    let api;

    try {

        if (!profileName) {

            return {

                success: false,

                message:
                    "MikroTik profile name is required."

            };

        }

        api =
            createMikroTikAPI({

                host,
                username,
                password,
                port

            });

        await api.connect();

        const sessionTimeout =
            convertDurationToRouterOS(
                duration,
                durationUnit
            );

        console.log(
            "🔵 Creating MikroTik profile:",
            profileName
        );

        console.log(
            "⏰ Session timeout:",
            sessionTimeout
        );


        // ======================================
        // CHECK EXISTING PROFILE
        // ======================================

        const profiles =
            await api.write(
                "/ip/hotspot/user/profile/print"
            );


        const existingProfile =
            Array.isArray(profiles)
                ? profiles.find(
                    profile =>
                        String(profile.name) ===
                        String(profileName)
                )
                : null;


        // ======================================
        // UPDATE EXISTING PROFILE
        // ======================================

        if (existingProfile) {

            const profileId =
                existingProfile[".id"] ||
                existingProfile.id;

            console.log(
                "🟡 Updating existing MikroTik profile:",
                profileName,
                profileId
            );

            await api.write(
                "/ip/hotspot/user/profile/set",
                [

                    `=.id=${profileId}`,

                    `=session-timeout=${sessionTimeout}`

                ]
            );

            console.log(
                "✅ MikroTik profile updated:",
                profileName
            );

        }

        // ======================================
        // CREATE NEW PROFILE
        // ======================================

        else {

            await api.write(
                "/ip/hotspot/user/profile/add",
                [

                    `=name=${profileName}`,

                    `=session-timeout=${sessionTimeout}`

                ]
            );

            console.log(
                "✅ MikroTik profile created:",
                profileName
            );

        }


        return {

            success: true,

            profileName,

            sessionTimeout

        };

    } catch (error) {

        console.error(
            "❌ MikroTik profile error:",
            error.message
        );

        return {

            success: false,

            message:
                error.message ||
                "Unable to create MikroTik profile."

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
// CREATE / UPDATE HOTSPOT USER
// ======================================

async function createHotspotUser({

    host,
    username,
    password,
    port = 8728,

    phone,

    userPassword,

    profileName,

    limitUptime

}) {

    let api;

    try {

        if (!phone) {

            return {

                success: false,

                message:
                    "Customer phone number is required."

            };

        }

        api =
            createMikroTikAPI({

                host,
                username,
                password,
                port

            });

        await api.connect();

        console.log(
            "🔵 Connecting to MikroTik to create user:",
            phone
        );


        const finalPassword =
            String(
                userPassword || phone
            );


        // ======================================
        // GET ALL HOTSPOT USERS
        // ======================================

        const users =
            await api.write(
                "/ip/hotspot/user/print"
            );


        const existingUser =
            Array.isArray(users)
                ? users.find(
                    user =>
                        String(user.name) ===
                        String(phone)
                )
                : null;


        // ======================================
        // UPDATE EXISTING USER
        // ======================================

        if (existingUser) {

            const userId =
                existingUser[".id"] ||
                existingUser.id;

            console.log(
                "🟡 Updating MikroTik user:",
                phone,
                userId
            );


            const commands = [

                `=.id=${userId}`,

                `=password=${finalPassword}`,

                "=disabled=no"

            ];


            if (profileName) {

                commands.push(
                    `=profile=${profileName}`
                );

            }


            if (limitUptime) {

                commands.push(
                    `=limit-uptime=${limitUptime}`
                );

            }


            await api.write(
                "/ip/hotspot/user/set",
                commands
            );


            console.log(
                "✅ MikroTik user updated:",
                phone
            );

        }

        // ======================================
        // CREATE NEW USER
        // ======================================

        else {

            const commands = [

                `=name=${phone}`,

                `=password=${finalPassword}`,

                "=disabled=no"

            ];


            if (profileName) {

                commands.push(
                    `=profile=${profileName}`
                );

            }


            if (limitUptime) {

                commands.push(
                    `=limit-uptime=${limitUptime}`
                );

            }


            await api.write(
                "/ip/hotspot/user/add",
                commands
            );


            console.log(
                "✅ MikroTik user created:",
                phone
            );

        }


        return {

            success: true,

            phone,

            password:
                finalPassword,

            profileName,

            limitUptime,

            message:
                "MikroTik Hotspot user ready."

        };

    } catch (error) {

        console.error(
            "❌ MikroTik hotspot user error:",
            error.message
        );

        return {

            success: false,

            message:
                error.message ||
                "Unable to create MikroTik Hotspot user."

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
// CONNECT WITIME USER TO MIKROTIK
// ======================================

async function connectWiTimeUserToMikroTik({

    phone,

    packageName,

    duration,

    durationUnit

}) {

    try {

        const config =
            getMikroTikConfig();


        if (!config.success) {

            console.error(
                "❌",
                config.message
            );

            return config;

        }


        if (!phone) {

            return {

                success: false,

                message:
                    "Phone number is required."

            };

        }


        if (!packageName) {

            return {

                success: false,

                message:
                    "Package name is required."

            };

        }


        // ======================================
        // CREATE SAFE PROFILE NAME
        // ======================================

        const profileName =
            String(packageName)

                .trim()

                .replace(
                    /[^a-zA-Z0-9_-]/g,
                    "_"
                )

                .substring(
                    0,
                    50
                );


        console.log(
            "🔵 Connecting WiTime user to MikroTik:",
            phone
        );

        console.log(
            "📦 Package:",
            packageName
        );

        console.log(
            "👤 MikroTik profile:",
            profileName
        );


        // ======================================
        // CREATE / UPDATE PROFILE
        // ======================================

        const profile =
            await createHotspotProfile({

                host:
                    config.host,

                username:
                    config.username,

                password:
                    config.password,

                port:
                    config.port,

                profileName,

                duration,

                durationUnit

            });


        if (!profile.success) {

            return profile;

        }


        // ======================================
        // CREATE / UPDATE USER
        // ======================================

        const user =
            await createHotspotUser({

                host:
                    config.host,

                username:
                    config.username,

                password:
                    config.password,

                port:
                    config.port,

                phone,

                userPassword:
                    String(phone),

                profileName,

                limitUptime:
                    profile.sessionTimeout

            });


        if (!user.success) {

            return user;

        }


        console.log(
            "✅ WiTime user connected to MikroTik:",
            phone
        );


        return {

            success: true,

            phone,

            profileName,

            sessionTimeout:
                profile.sessionTimeout,

            message:
                "WiTime user successfully connected to MikroTik."

        };

    } catch (error) {

        console.error(
            "❌ WiTime → MikroTik connection error:",
            error.message
        );

        return {

            success: false,

            message:
                error.message ||
                "Unable to connect WiTime user to MikroTik."

        };

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

        api =
            createMikroTikAPI({

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

            users:
                Array.isArray(users)
                    ? users
                    : [],

            count:
                Array.isArray(users)
                    ? users.length
                    : 0

        };

    } catch (error) {

        console.error(
            "❌ Active MikroTik users error:",
            error.message
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
// DISCONNECT HOTSPOT SESSION
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


        api =
            createMikroTikAPI({

                host,
                username,
                password,
                port

            });

        await api.connect();


        await api.write(

            "/ip/hotspot/active/remove",

            [

                `=.id=${sessionId}`

            ]

        );


        console.log(
            "✅ MikroTik session disconnected:",
            sessionId
        );


        return {

            success: true,

            message:
                "MikroTik user disconnected.",

            sessionId

        };

    } catch (error) {

        console.error(
            "❌ MikroTik disconnect error:",
            error.message
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


// ======================================
// DISCONNECT USER BY PHONE
// ======================================

async function disconnectUserByPhone({

    host,

    username,

    password,

    port = 8728,

    phone

}) {

    let api;

    try {

        if (!phone) {

            return {

                success: false,

                message:
                    "Phone number is required."

            };

        }


        api =
            createMikroTikAPI({

                host,
                username,
                password,
                port

            });


        await api.connect();


        console.log(
            "🔵 Connected to MikroTik for expiry:",
            phone
        );


        // ======================================
        // FIND ACTIVE SESSION
        // ======================================

        const activeUsers =
            await api.write(
                "/ip/hotspot/active/print"
            );


        const activeUser =
            Array.isArray(activeUsers)

                ? activeUsers.find(
                    user =>
                        String(user.name) ===
                        String(phone)
                )

                : null;


        if (activeUser) {

            const sessionId =
                activeUser[".id"] ||
                activeUser.id;


            console.log(
                "🔴 Removing active MikroTik session:",
                phone,
                sessionId
            );


            if (sessionId) {

                await api.write(

                    "/ip/hotspot/active/remove",

                    [

                        `=.id=${sessionId}`

                    ]

                );


                console.log(
                    "✅ MikroTik session disconnected:",
                    phone
                );

            }

        } else {

            console.log(
                "ℹ️ No active MikroTik session found:",
                phone
            );

        }


        // ======================================
        // FIND HOTSPOT USER
        // ======================================

        const hotspotUsers =
            await api.write(
                "/ip/hotspot/user/print"
            );


        const hotspotUser =
            Array.isArray(hotspotUsers)

                ? hotspotUsers.find(
                    user =>
                        String(user.name) ===
                        String(phone)
                )

                : null;


        // ======================================
        // DISABLE USER
        // ======================================

        if (hotspotUser) {

            const userId =
                hotspotUser[".id"] ||
                hotspotUser.id;


            console.log(
                "🔒 Disabling MikroTik user:",
                phone,
                userId
            );


            if (userId) {

                await api.write(

                    "/ip/hotspot/user/set",

                    [

                        `=.id=${userId}`,

                        "=disabled=yes"

                    ]

                );


                console.log(
                    "✅ MikroTik account disabled:",
                    phone
                );

            }

        } else {

            console.log(
                "⚠️ MikroTik hotspot user not found:",
                phone
            );

        }


        return {

            success: true,

            phone

        };

    } catch (error) {

        console.error(
            "❌ MikroTik expiry error:",
            error.message
        );

        return {

            success: false,

            message:
                error.message ||
                "Unable to disconnect expired user."

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
// EXPORT
// ======================================

module.exports = {

    testMikroTikConnection,

    createHotspotProfile,

    createHotspotUser,

    connectWiTimeUserToMikroTik,

    getActiveHotspotUsers,

    disconnectHotspotUser,

    disconnectUserByPhone

};