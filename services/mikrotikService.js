// ======================================
// WITIME MIKROTIK SERVICE
// WiTime is the source of truth for time
// ======================================

let RouterOSClient = null;

// ======================================
// LOAD ROUTEROS CLIENT
// ======================================

async function getRouterOSClient() {
    if (!RouterOSClient) {
        const module = await import("routeros-client");

        RouterOSClient =
            module.RouterOSClient ||
            module.default?.RouterOSClient ||
            module.default;
    }

    return RouterOSClient;
}

// ======================================
// CREATE MIKROTIK API CONNECTION
// ======================================

async function createMikroTikAPI({
    host,
    username,
    password,
    port = 8728
}) {
    const Client = await getRouterOSClient();

    if (!Client) {
        throw new Error("Unable to load routeros-client.");
    }

    return new Client({
        host,
        user: username,
        password,
        port: Number(port)
    });
}

// ======================================
// SAFE MIKROTIK COMMAND RUNNER
// ======================================

async function runMikroTikCommand(clientOptions, callback) {

    let client;
    let conn;

    try {

        client = await createMikroTikAPI(clientOptions);

        conn = await client.connect();

        const execute = async (path, params = []) => {

            // Connection write
            if (
                conn &&
                typeof conn.write === "function"
            ) {
                return await conn.write(path, params);
            }

            // Client write
            if (
                client &&
                typeof client.write === "function"
            ) {
                return await client.write(path, params);
            }

            // Menu fallback
            const targetMenu =
                conn?.menu
                    ? conn.menu(path)
                    : client?.menu
                        ? client.menu(path)
                        : null;

            if (targetMenu) {

                if (params.length === 0) {
                    return await targetMenu.get();
                }

                return await targetMenu.where(params).get();
            }

            throw new Error(
                "No valid RouterOS execution method found."
            );
        };

        return await callback(
            execute,
            conn,
            client
        );

    } finally {

        if (client) {

            try {
                await client.close();
            } catch (_) {}

        } else if (
            conn &&
            typeof conn.close === "function"
        ) {

            try {
                await conn.close();
            } catch (_) {}
        }
    }
}

// ======================================
// TEST CONNECTION
// ======================================

async function testMikroTikConnection({
    host,
    username,
    password,
    port = 8728
}) {

    try {

        return await runMikroTikCommand(
            {
                host,
                username,
                password,
                port
            },

            async (execute) => {

                const identity =
                    await execute(
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
            }
        );

    } catch (error) {

        console.error(
            "❌ MikroTik connection error:",
            error
        );

        return {
            success: false,
            message:
                error.message ||
                "Unable to connect to MikroTik."
        };
    }
}

// ======================================
// CONVERT DURATION TO SECONDS
// ======================================

function durationToSeconds(duration, unit) {

    const value = Number(duration);

    if (
        !Number.isFinite(value) ||
        value <= 0
    ) {
        throw new Error(
            "Invalid package duration."
        );
    }

    switch (String(unit).toLowerCase()) {

        case "second":
        case "seconds":
            return Math.floor(value);

        case "minute":
        case "minutes":
            return Math.floor(value * 60);

        case "hour":
        case "hours":
            return Math.floor(value * 3600);

        case "day":
        case "days":
            return Math.floor(value * 86400);

        case "week":
        case "weeks":
            return Math.floor(value * 7 * 86400);

        case "month":
        case "months":
            return Math.floor(value * 30 * 86400);

        default:
            throw new Error(
                `Unsupported duration unit: ${unit}`
            );
    }
}

// ======================================
// CONVERT SECONDS TO ROUTEROS TIME
// ======================================

function secondsToRouterOS(seconds) {

    seconds = Math.max(
        0,
        Math.floor(Number(seconds) || 0)
    );

    const days =
        Math.floor(seconds / 86400);

    seconds %= 86400;

    const hours =
        Math.floor(seconds / 3600);

    seconds %= 3600;

    const minutes =
        Math.floor(seconds / 60);

    const secs =
        seconds % 60;

    let result = "";

    if (days) {
        result += `${days}d`;
    }

    if (hours) {
        result += `${hours}h`;
    }

    if (minutes) {
        result += `${minutes}m`;
    }

    if (secs || !result) {
        result += `${secs}s`;
    }

    return result;
}

// ======================================
// CONVERT DURATION TO ROUTEROS FORMAT
// ======================================

function convertDurationToRouterOS(
    duration,
    unit
) {

    return secondsToRouterOS(
        durationToSeconds(
            duration,
            unit
        )
    );
}

// ======================================
// SANITIZE PROFILE NAME
// ======================================

function sanitizeProfileName(packageName) {

    return String(packageName)
        .replace(
            /[^a-zA-Z0-9_-]/g,
            "_"
        )
        .substring(0, 50);
}

// ======================================
// CREATE / UPDATE PACKAGE PROFILE
//
// IMPORTANT:
// NO FIXED SESSION TIMEOUT.
// WiTime controls the user's actual time.
// ======================================

async function createHotspotProfile({
    host,
    username,
    password,
    port = 8728,
    profileName
}) {

    if (!profileName) {

        return {
            success: false,
            message:
                "MikroTik profile name is required."
        };
    }

    try {

        return await runMikroTikCommand(
            {
                host,
                username,
                password,
                port
            },

            async (execute) => {

                console.log(
                    "🔵 Preparing MikroTik profile:",
                    profileName
                );

                const existing =
                    await execute(
                        "/ip/hotspot/user/profile/print",
                        [
                            `?name=${profileName}`
                        ]
                    );

                // No fixed session-timeout.
                // 0 means no profile session limit.
                const commands = [
                    "=session-timeout=0s"
                ];

                if (
                    Array.isArray(existing) &&
                    existing.length > 0
                ) {

                    const profileId =
                        existing[0][".id"] ||
                        existing[0].id;

                    await execute(
                        "/ip/hotspot/user/profile/set",
                        [
                            `=.id=${profileId}`,
                            ...commands
                        ]
                    );

                    console.log(
                        "🟡 MikroTik profile updated:",
                        profileName
                    );

                } else {

                    await execute(
                        "/ip/hotspot/user/profile/add",
                        [
                            `=name=${profileName}`,
                            ...commands
                        ]
                    );

                    console.log(
                        "✅ MikroTik profile created:",
                        profileName
                    );
                }

                return {
                    success: true,
                    profileName
                };
            }
        );

    } catch (error) {

        console.error(
            "❌ MikroTik profile error:",
            error
        );

        return {
            success: false,
            message:
                error.message ||
                "Unable to create MikroTik profile."
        };
    }
}

// ======================================
// CREATE / UPDATE HOTSPOT USER
//
// limit-uptime is the actual MikroTik
// enforcement value.
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

    if (!phone) {

        return {
            success: false,
            message:
                "Customer phone number is required."
        };
    }

    try {

        return await runMikroTikCommand(
            {
                host,
                username,
                password,
                port
            },

            async (execute) => {

                console.log(
                    "🔵 Creating/updating MikroTik user:",
                    phone
                );

                const existingUsers =
                    await execute(
                        "/ip/hotspot/user/print",
                        [
                            `?name=${phone}`
                        ]
                    );

                const commands = [
                    `=password=${userPassword || phone}`,
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

                // Existing user
                if (
                    Array.isArray(existingUsers) &&
                    existingUsers.length > 0
                ) {

                    const userId =
                        existingUsers[0][".id"] ||
                        existingUsers[0].id;

                    commands.unshift(
                        `=.id=${userId}`
                    );

                    await execute(
                        "/ip/hotspot/user/set",
                        commands
                    );

                    console.log(
                        "✅ MikroTik user updated:",
                        phone
                    );

                } else {

                    commands.unshift(
                        `=name=${phone}`
                    );

                    await execute(
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
                        userPassword || phone,
                    profileName,
                    limitUptime,
                    message:
                        "MikroTik Hotspot user configured."
                };
            }
        );

    } catch (error) {

        console.error(
            "❌ MikroTik hotspot user error:",
            error
        );

        return {
            success: false,
            message:
                error.message ||
                "Unable to configure MikroTik Hotspot user."
        };
    }
}

// ======================================
// CONNECT WITIME USER TO MIKROTIK
//
// duration = TOTAL TIME GRANTED
// ======================================

async function connectWiTimeUserToMikroTik({
    phone,
    packageName,
    duration,
    durationUnit
}) {

    const host =
        process.env.MIKROTIK_HOST;

    const username =
        process.env.MIKROTIK_USERNAME;

    const password =
        process.env.MIKROTIK_PASSWORD;

    const port =
        Number(
            process.env.MIKROTIK_PORT || 8728
        );

    if (
        !host ||
        !username ||
        !password
    ) {

        return {
            success: false,
            message:
                "MikroTik configuration is missing from .env."
        };
    }

    if (!phone) {

        return {
            success: false,
            message:
                "Customer phone number is required."
        };
    }

    if (!packageName) {

        return {
            success: false,
            message:
                "Package name is required."
        };
    }

    if (
        duration === undefined ||
        duration === null
    ) {

        return {
            success: false,
            message:
                "Package duration is required."
        };
    }

    let totalSeconds;

    try {

        totalSeconds =
            durationToSeconds(
                duration,
                durationUnit
            );

    } catch (error) {

        return {
            success: false,
            message: error.message
        };
    }

    const profileName =
        sanitizeProfileName(
            packageName
        );

    // Create/update profile WITHOUT
    // a fixed session timeout.
    const profile =
        await createHotspotProfile({
            host,
            username,
            password,
            port,
            profileName
        });

    if (!profile.success) {
        return profile;
    }

    const limitUptime =
        secondsToRouterOS(
            totalSeconds
        );

    const user =
        await createHotspotUser({
            host,
            username,
            password,
            port,
            phone,
            userPassword:
                String(phone),
            profileName,
            limitUptime
        });

    if (!user.success) {
        return user;
    }

    console.log(
        "✅ WiTime user connected to MikroTik:",
        phone,
        "Total time:",
        limitUptime
    );

    return {
        success: true,
        phone,
        profileName,
        totalSeconds,
        limitUptime
    };
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

    try {

        return await runMikroTikCommand(
            {
                host,
                username,
                password,
                port
            },

            async (execute) => {

                const users =
                    await execute(
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
            }
        );

    } catch (error) {

        console.error(
            "❌ Active MikroTik users error:",
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
    }
}

// ======================================
// GET ACTIVE USER SESSION
// ======================================

async function getActiveUserSession(phone) {

    const host =
        process.env.MIKROTIK_HOST;

    const username =
        process.env.MIKROTIK_USERNAME;

    const password =
        process.env.MIKROTIK_PASSWORD;

    const port =
        Number(
            process.env.MIKROTIK_PORT || 8728
        );

    if (
        !host ||
        !username ||
        !password
    ) {

        return {
            success: false,
            active: false,
            message:
                "MikroTik configuration is missing."
        };
    }

    if (!phone) {

        return {
            success: false,
            active: false,
            message:
                "Phone number is required."
        };
    }

    try {

        return await runMikroTikCommand(
            {
                host,
                username,
                password,
                port
            },

            async (execute) => {

                const activeUsers =
                    await execute(
                        "/ip/hotspot/active/print"
                    );

                const activeUser =
                    (
                        Array.isArray(activeUsers)
                            ? activeUsers
                            : []
                    ).find(
                        user =>
                            String(
                                user.user
                            ) === String(phone)
                    );

                if (!activeUser) {

                    return {
                        success: false,
                        active: false,
                        phone,
                        message:
                            "User is not currently active on MikroTik."
                    };
                }

                const sessionTimeLeft =
                    activeUser.sessionTimeLeft ||
                    activeUser["session-time-left"] ||
                    "";

                const sessionTimeLeftSeconds =
                    routerOsTimeToSeconds(
                        sessionTimeLeft
                    );

                return {

                    success: true,
                    active: true,
                    phone,

                    sessionId:
                        activeUser.id ||
                        activeUser[".id"] ||
                        "",

                    ipAddress:
                        activeUser.address ||
                        "",

                    macAddress:
                        activeUser.macAddress ||
                        activeUser["mac-address"] ||
                        "",

                    uptime:
                        activeUser.uptime ||
                        "0s",

                    uptimeSeconds:
                        routerOsTimeToSeconds(
                            activeUser.uptime ||
                            "0s"
                        ),

                    idleTime:
                        activeUser.idleTime ||
                        activeUser["idle-time"] ||
                        "0s",

                    keepaliveTimeout:
                        activeUser.keepaliveTimeout ||
                        activeUser["keepalive-timeout"] ||
                        "",

                    sessionTimeLeft,

                    sessionTimeLeftSeconds
                };
            }
        );

    } catch (error) {

        console.error(
            "❌ MikroTik session read error:",
            error
        );

        return {
            success: false,
            active: false,
            phone,
            message:
                error.message ||
                "Unable to read MikroTik session."
        };
    }
}

// ======================================
// SET USER REMAINING TIME
//
// This is used when WiTime extends a user.
//
// Example:
// WiTime says remaining = 30 minutes
// MikroTik uptime = 10 minutes
//
// New limit-uptime = 40 minutes
// ======================================

async function setUserRemainingTime({
    phone,
    remainingSeconds
}) {

    const host =
        process.env.MIKROTIK_HOST;

    const username =
        process.env.MIKROTIK_USERNAME;

    const password =
        process.env.MIKROTIK_PASSWORD;

    const port =
        Number(
            process.env.MIKROTIK_PORT || 8728
        );

    if (!phone) {

        return {
            success: false,
            message:
                "Customer phone number is required."
        };
    }

    const remaining =
        Math.max(
            0,
            Math.floor(
                Number(
                    remainingSeconds
                ) || 0
            )
        );

    try {

        return await runMikroTikCommand(
            {
                host,
                username,
                password,
                port
            },

            async (execute) => {

                console.log(
                    "🔵 Updating MikroTik remaining time:",
                    phone,
                    remaining,
                    "seconds"
                );

                // --------------------------------
                // Find hotspot user
                // --------------------------------

                const users =
                    await execute(
                        "/ip/hotspot/user/print",
                        [
                            `?name=${phone}`
                        ]
                    );

                if (
                    !Array.isArray(users) ||
                    users.length === 0
                ) {

                    return {
                        success: false,
                        message:
                            "MikroTik hotspot user not found."
                    };
                }

                const user =
                    users[0];

                const userId =
                    user[".id"] ||
                    user.id;

                if (!userId) {

                    return {
                        success: false,
                        message:
                            "MikroTik user ID not found."
                    };
                }

                // --------------------------------
                // Find current active session
                // --------------------------------

                const activeUsers =
                    await execute(
                        "/ip/hotspot/active/print"
                    );

                const activeUser =
                    (
                        Array.isArray(activeUsers)
                            ? activeUsers
                            : []
                    ).find(
                        item =>
                            String(
                                item.user
                            ) === String(phone)
                    );

                let currentUptimeSeconds = 0;

                if (activeUser) {

                    currentUptimeSeconds =
                        routerOsTimeToSeconds(
                            activeUser.uptime ||
                            "0s"
                        );
                }

                // --------------------------------
                // MikroTik limit-uptime is total
                // allowed usage.
                // --------------------------------

                const newTotalSeconds =
                    currentUptimeSeconds +
                    remaining;

                const newLimitUptime =
                    secondsToRouterOS(
                        newTotalSeconds
                    );

                // --------------------------------
                // Update MikroTik
                // --------------------------------

                await execute(
                    "/ip/hotspot/user/set",
                    [
                        `=.id=${userId}`,
                        `=limit-uptime=${newLimitUptime}`,
                        "=disabled=no"
                    ]
                );

                console.log(
                    "✅ MikroTik time updated:",
                    phone,
                    "uptime:",
                    currentUptimeSeconds,
                    "remaining:",
                    remaining,
                    "limit:",
                    newLimitUptime
                );

                return {
                    success: true,
                    phone,
                    remainingSeconds:
                        remaining,
                    uptimeSeconds:
                        currentUptimeSeconds,
                    totalSeconds:
                        newTotalSeconds,
                    limitUptime:
                        newLimitUptime
                };
            }
        );

    } catch (error) {

        console.error(
            "❌ MikroTik remaining-time update error:",
            error
        );

        return {
            success: false,
            message:
                error.message ||
                "Unable to update MikroTik remaining time."
        };
    }
}

// ======================================
// DISCONNECT ACTIVE SESSION
// ======================================

async function disconnectHotspotUser({
    host,
    username,
    password,
    port = 8728,
    sessionId
}) {

    if (!sessionId) {

        return {
            success: false,
            message:
                "MikroTik active session ID is required."
        };
    }

    try {

        return await runMikroTikCommand(
            {
                host,
                username,
                password,
                port
            },

            async (execute) => {

                await execute(
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
            }
        );

    } catch (error) {

        console.error(
            "❌ MikroTik disconnect error:",
            error
        );

        return {
            success: false,
            message:
                error.message ||
                "Unable to disconnect MikroTik user."
        };
    }
}

// ======================================
// DISCONNECT USER BY PHONE
//
// Accepts:
// disconnectUserByPhone("254...")
//
// OR:
// disconnectUserByPhone({ phone: "254..." })
// ======================================

async function disconnectUserByPhone(options) {

    const phone =
        typeof options === "string"
            ? options
            : options?.phone;

    const host =
        typeof options === "object" &&
        options?.host
            ? options.host
            : process.env.MIKROTIK_HOST;

    const username =
        typeof options === "object" &&
        options?.username
            ? options.username
            : process.env.MIKROTIK_USERNAME;

    const password =
        typeof options === "object" &&
        options?.password
            ? options.password
            : process.env.MIKROTIK_PASSWORD;

    const port =
        typeof options === "object" &&
        options?.port
            ? Number(options.port)
            : Number(
                process.env.MIKROTIK_PORT || 8728
            );

    if (!phone) {

        return {
            success: false,
            message:
                "Customer phone number is required."
        };
    }

    try {

        return await runMikroTikCommand(
            {
                host,
                username,
                password,
                port
            },

            async (execute) => {

                console.log(
                    "🔵 Disconnecting WiTime user:",
                    phone
                );

                // --------------------------------
                // Remove all active sessions
                // --------------------------------

                const activeUsers =
                    await execute(
                        "/ip/hotspot/active/print",
                        [
                            `?user=${phone}`
                        ]
                    );

                if (
                    Array.isArray(activeUsers)
                ) {

                    for (
                        const activeUser
                        of activeUsers
                    ) {

                        const sessionId =
                            activeUser[".id"] ||
                            activeUser.id;

                        if (sessionId) {

                            await execute(
                                "/ip/hotspot/active/remove",
                                [
                                    `=.id=${sessionId}`
                                ]
                            );

                            console.log(
                                "🔴 Removed active session:",
                                sessionId
                            );
                        }
                    }
                }

                // --------------------------------
                // Disable hotspot account
                // --------------------------------

                const hotspotUsers =
                    await execute(
                        "/ip/hotspot/user/print",
                        [
                            `?name=${phone}`
                        ]
                    );

                if (
                    Array.isArray(hotspotUsers) &&
                    hotspotUsers.length > 0
                ) {

                    const userId =
                        hotspotUsers[0][".id"] ||
                        hotspotUsers[0].id;

                    if (userId) {

                        await execute(
                            "/ip/hotspot/user/set",
                            [
                                `=.id=${userId}`,
                                "=disabled=yes"
                            ]
                        );

                        console.log(
                            "🔒 MikroTik account disabled:",
                            phone
                        );
                    }
                }

                return {
                    success: true,
                    phone
                };
            }
        );

    } catch (error) {

        console.error(
            "❌ MikroTik user disconnect error:",
            error
        );

        return {
            success: false,
            message:
                error.message ||
                "Unable to disconnect MikroTik user."
        };
    }
}

// ======================================
// CONVERT ROUTEROS TIME TO SECONDS
// ======================================

function routerOsTimeToSeconds(value) {

    if (!value) {
        return 0;
    }

    const text =
        String(value)
            .trim()
            .toLowerCase();

    let seconds = 0;

    const days =
        text.match(/(\d+)d/);

    const hours =
        text.match(/(\d+)h/);

    const minutes =
        text.match(/(\d+)m/);

    const secs =
        text.match(/(\d+)s/);

    if (days) {

        seconds +=
            Number(days[1]) *
            86400;
    }

    if (hours) {

        seconds +=
            Number(hours[1]) *
            3600;
    }

    if (minutes) {

        seconds +=
            Number(minutes[1]) *
            60;
    }

    if (secs) {

        seconds +=
            Number(secs[1]);
    }

    return seconds;
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

    getActiveUserSession,

    setUserRemainingTime,

    disconnectHotspotUser,

    disconnectUserByPhone,

    routerOsTimeToSeconds,

    durationToSeconds,

    secondsToRouterOS,

    convertDurationToRouterOS
};