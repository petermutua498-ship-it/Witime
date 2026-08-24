// ======================================
// MIKROTIK SERVICE
// CommonJS compatible with ESM routeros-client
// ======================================


// ======================================
// LOAD ROUTEROS CLIENT
// ======================================

let RouterOSClient = null;

async function getRouterOSClient() {

    if (!RouterOSClient) {

        const module =
            await import("routeros-client");

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

    const Client =
        await getRouterOSClient();

    if (!Client) {

        throw new Error(
            "Unable to load routeros-client."
        );

    }

    return new Client({

        host,

        user: username,

        password,

        port: Number(port)

    });

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

        api =
            await createMikroTikAPI({

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
// CONVERT DURATION TO ROUTEROS FORMAT
// ======================================

function convertDurationToRouterOS(
    duration,
    unit
) {

    const value =
        Number(duration);


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
            await createMikroTikAPI({

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
            profileName,
            sessionTimeout
        );


        // ======================================
        // FIND EXISTING PROFILE
        // ======================================

        const existing =
            await api.write(

                "/ip/hotspot/user/profile/print",

                [
                    `?name=${profileName}`
                ]

            );


        // ======================================
        // UPDATE EXISTING PROFILE
        // ======================================

        if (
            Array.isArray(existing) &&
            existing.length > 0
        ) {

            const profileId =
                existing[0][".id"] ||
                existing[0].id;


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
            error
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
            await createMikroTikAPI({

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


        // ======================================
        // FIND EXISTING USER
        // ======================================

        const existingUsers =
            await api.write(

                "/ip/hotspot/user/print",

                [
                    `?name=${phone}`
                ]

            );


        // ======================================
        // UPDATE EXISTING USER
        // ======================================

        if (
            Array.isArray(existingUsers) &&
            existingUsers.length > 0
        ) {

            const userId =
                existingUsers[0][".id"] ||
                existingUsers[0].id;


            console.log(
                "🟡 Updating MikroTik user:",
                phone,
                userId
            );


            const commands = [

                `=.id=${userId}`,

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
                userPassword || phone,

            profileName,

            limitUptime,

            message:
                "MikroTik Hotspot user created successfully."

        };

    } catch (error) {

        console.error(
            "❌ MikroTik hotspot user error:",
            error
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


    // ======================================
    // CREATE SAFE PROFILE NAME
    // ======================================

    const profileName =
        String(packageName)

            .replace(
                /[^a-zA-Z0-9_-]/g,
                "_"
            )

            .substring(0, 50);


    // ======================================
    // CREATE / UPDATE PROFILE
    // ======================================

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

        return profile;

    }


    // ======================================
    // CREATE / UPDATE USER
    // ======================================

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
            profile.sessionTimeout

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

    let api;

    try {

        api =
            await createMikroTikAPI({

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
                users || [],

            count:
                Array.isArray(users)
                    ? users.length
                    : 0

        };

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
            await createMikroTikAPI({

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
                    "Customer phone number is required."

            };

        }


        api =
            await createMikroTikAPI({

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
        // DISABLE HOTSPOT USER
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
            error
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