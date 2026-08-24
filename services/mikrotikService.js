// ======================================
// MIKROTIK SERVICE
// WiTime + RouterOS Hotspot
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

    if (!RouterOSClient) {

        throw new Error(
            "RouterOSClient could not be loaded."
        );

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

    if (!host) {
        throw new Error(
            "MikroTik host is required."
        );
    }

    if (!username) {
        throw new Error(
            "MikroTik username is required."
        );
    }

    if (!password) {
        throw new Error(
            "MikroTik password is required."
        );
    }

    const Client =
        await getRouterOSClient();

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

        const client =
            await api.connect();


        const identity =
            await client
                .menu("/system identity")
                .getOnly();


        console.log(
            "✅ MikroTik connection successful:",
            host
        );


        return {

            success: true,

            message:
                "MikroTik connection successful.",

            identity:
                identity?.name ||
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
// CONVERT DURATION
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

            throw new Error(
                "MikroTik profile name is required."
            );

        }


        api =
            await createMikroTikAPI({

                host,
                username,
                password,
                port

            });


        const client =
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


        const profileMenu =
            client.menu(
                "/ip hotspot user profile"
            );


        // ======================================
        // FIND EXISTING PROFILE
        // ======================================

        const existingProfiles =
            await profileMenu
                .where(
                    "name",
                    profileName
                )
                .get();


        // ======================================
        // UPDATE EXISTING PROFILE
        // ======================================

        if (
            Array.isArray(existingProfiles) &&
            existingProfiles.length > 0
        ) {

            const existing =
                existingProfiles[0];


            const profileId =
                existing.id ||
                existing[".id"];


            console.log(
                "🟡 Updating existing MikroTik profile:",
                profileName,
                profileId
            );


            await profileMenu
                .where(
                    "id",
                    profileId
                )
                .update({

                    "session-timeout":
                        sessionTimeout

                });


            console.log(
                "✅ MikroTik profile updated:",
                profileName
            );

        }

        // ======================================
        // CREATE NEW PROFILE
        // ======================================

        else {

            await profileMenu.add({

                name:
                    profileName,

                "session-timeout":
                    sessionTimeout

            });


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

            throw new Error(
                "Customer phone number is required."
            );

        }


        api =
            await createMikroTikAPI({

                host,
                username,
                password,
                port

            });


        const client =
            await api.connect();


        console.log(
            "🔵 Creating MikroTik hotspot user:",
            phone
        );


        const userMenu =
            client.menu(
                "/ip hotspot user"
            );


        // ======================================
        // FIND EXISTING USER
        // ======================================

        const existingUsers =
            await userMenu
                .where(
                    "name",
                    String(phone)
                )
                .get();


        const passwordValue =
            String(
                userPassword ||
                phone
            );


        // ======================================
        // UPDATE EXISTING USER
        // ======================================

        if (
            Array.isArray(existingUsers) &&
            existingUsers.length > 0
        ) {

            const existing =
                existingUsers[0];


            const userId =
                existing.id ||
                existing[".id"];


            console.log(
                "🟡 Updating MikroTik user:",
                phone,
                userId
            );


            const updateData = {

                password:
                    passwordValue,

                disabled:
                    "no"

            };


            if (profileName) {

                updateData.profile =
                    profileName;

            }


            if (limitUptime) {

                updateData["limit-uptime"] =
                    limitUptime;

            }


            await userMenu
                .where(
                    "id",
                    userId
                )
                .update(
                    updateData
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

            const userData = {

                name:
                    String(phone),

                password:
                    passwordValue,

                disabled:
                    "no"

            };


            if (profileName) {

                userData.profile =
                    profileName;

            }


            if (limitUptime) {

                userData["limit-uptime"] =
                    limitUptime;

            }


            await userMenu.add(
                userData
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
                passwordValue,

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

    try {

        const host =
            process.env.MIKROTIK_HOST;


        const username =
            process.env.MIKROTIK_USERNAME;


        const password =
            process.env.MIKROTIK_PASSWORD;


        const port =
            Number(
                process.env.MIKROTIK_PORT ||
                8728
            );


        // ======================================
        // CHECK CONFIGURATION
        // ======================================

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

    } catch (error) {

        console.error(
            "❌ WiTime MikroTik connection error:",
            error
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
            await createMikroTikAPI({

                host,
                username,
                password,
                port

            });


        const client =
            await api.connect();


        const users =
            await client
                .menu(
                    "/ip hotspot active"
                )
                .get();


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


        const client =
            await api.connect();


        await client
            .menu(
                "/ip hotspot active"
            )
            .remove(
                sessionId
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
                    "Phone number is required."

            };

        }


        api =
            await createMikroTikAPI({

                host,
                username,
                password,
                port

            });


        const client =
            await api.connect();


        console.log(
            "🔵 Connected to MikroTik for expiry:",
            phone
        );


        // ======================================
        // ACTIVE SESSION
        // ======================================

        const activeMenu =
            client.menu(
                "/ip hotspot active"
            );


        const activeUsers =
            await activeMenu.get();


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
                activeUser.id ||
                activeUser[".id"];


            if (sessionId) {

                console.log(
                    "🔴 Removing active session:",
                    phone,
                    sessionId
                );


                await activeMenu.remove(
                    sessionId
                );


                console.log(
                    "✅ MikroTik session disconnected:",
                    phone
                );

            }

        } else {

            console.log(
                "ℹ️ No active MikroTik session:",
                phone
            );

        }


        // ======================================
        // HOTSPOT USER
        // ======================================

        const userMenu =
            client.menu(
                "/ip hotspot user"
            );


        const hotspotUsers =
            await userMenu.get();


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
                hotspotUser.id ||
                hotspotUser[".id"];


            if (userId) {

                console.log(
                    "🔒 Disabling MikroTik user:",
                    phone
                );


                await userMenu
                    .where(
                        "id",
                        userId
                    )
                    .update({

                        disabled:
                            "yes"

                    });


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
// EXPORTS
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