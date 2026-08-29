// ======================================
// MIKROTIK SERVICE
// CommonJS compatible with ESM routeros-client
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
// SAFE RUNNER HELPER FOR API COMMANDS
// ======================================

async function runMikroTikCommand(clientOptions, callback) {
  let client;
  let conn;

  try {
    client = await createMikroTikAPI(clientOptions);
    conn = await client.connect();

    // Helper to write commands using whichever interface is active
    const execute = async (path, params = []) => {
      // 1. Try low-level write on connection object
      if (conn && typeof conn.write === "function") {
        return await conn.write(path, params);
      }
      // 2. Try low-level write on client object
      if (client && typeof client.write === "function") {
        return await client.write(path, params);
      }
      // 3. Fallback to menu-style interface
      const targetMenu = conn?.menu
        ? conn.menu(path)
        : client?.menu
        ? client.menu(path)
        : null;

      if (targetMenu) {
        if (params.length === 0) return await targetMenu.get();
        return await targetMenu.where(params).get();
      }

      throw new Error("No valid execution method (.write or .menu) found on RouterOS connection.");
    };

    return await callback(execute, conn, client);
  } finally {
    if (client) {
      try {
        await client.close();
      } catch (_) {}
    } else if (conn && typeof conn.close === "function") {
      try {
        await conn.close();
      } catch (_) {}
    }
  }
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
  try {
    return await runMikroTikCommand(
      { host, username, password, port },
      async (execute) => {
        const identity = await execute("/system/identity/print");
        console.log("✅ MikroTik connection successful:", host);

        return {
          success: true,
          message: "MikroTik connection successful.",
          identity: identity?.[0]?.name || "MikroTik"
        };
      }
    );
  } catch (error) {
    console.error("❌ MikroTik connection error:", error);
    return {
      success: false,
      message: error.message || "Unable to connect to MikroTik."
    };
  }
}

// ======================================
// CONVERT DURATION TO ROUTEROS FORMAT
// ======================================

function convertDurationToRouterOS(duration, unit) {
  const value = Number(duration);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Invalid package duration.");
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
      throw new Error(`Unsupported duration unit: ${unit}`);
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
  if (!profileName) {
    return {
      success: false,
      message: "MikroTik profile name is required."
    };
  }

  try {
    return await runMikroTikCommand(
      { host, username, password, port },
      async (execute) => {
        const sessionTimeout = convertDurationToRouterOS(duration, durationUnit);

        console.log("🔵 Creating MikroTik profile:", profileName, sessionTimeout);

        const existing = await execute("/ip/hotspot/user/profile/print", [
          `?name=${profileName}`
        ]);

        if (Array.isArray(existing) && existing.length > 0) {
          const profileId = existing[0][".id"] || existing[0].id;
          console.log("🟡 Updating existing MikroTik profile:", profileName, profileId);

          await execute("/ip/hotspot/user/profile/set", [
            `=.id=${profileId}`,
            `=session-timeout=${sessionTimeout}`
          ]);
        } else {
          await execute("/ip/hotspot/user/profile/add", [
            `=name=${profileName}`,
            `=session-timeout=${sessionTimeout}`
          ]);
          console.log("✅ MikroTik profile created:", profileName);
        }

        return {
          success: true,
          profileName,
          sessionTimeout
        };
      }
    );
  } catch (error) {
    console.error("❌ MikroTik profile error:", error);
    return {
      success: false,
      message: error.message || "Unable to create MikroTik profile."
    };
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
  if (!phone) {
    return {
      success: false,
      message: "Customer phone number is required."
    };
  }

  try {
    return await runMikroTikCommand(
      { host, username, password, port },
      async (execute) => {
        console.log("🔵 Connecting to MikroTik to create user:", phone);

        const existingUsers = await execute("/ip/hotspot/user/print", [
          `?name=${phone}`
        ]);

        const commands = [
          `=password=${userPassword || phone}`,
          "=disabled=no"
        ];

        if (profileName) commands.push(`=profile=${profileName}`);
        if (limitUptime) commands.push(`=limit-uptime=${limitUptime}`);

        if (Array.isArray(existingUsers) && existingUsers.length > 0) {
          const userId = existingUsers[0][".id"] || existingUsers[0].id;
          console.log("🟡 Updating MikroTik user:", phone, userId);
          commands.unshift(`=.id=${userId}`);

          await execute("/ip/hotspot/user/set", commands);
          console.log("✅ MikroTik user updated:", phone);
        } else {
          commands.unshift(`=name=${phone}`);

          await execute("/ip/hotspot/user/add", commands);
          console.log("✅ MikroTik user created:", phone);
        }

        return {
          success: true,
          phone,
          password: userPassword || phone,
          profileName,
          limitUptime,
          message: "MikroTik Hotspot user created successfully."
        };
      }
    );
  } catch (error) {
    console.error("❌ MikroTik hotspot user error:", error);
    return {
      success: false,
      message: error.message || "Unable to create MikroTik Hotspot user."
    };
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
  const host = process.env.MIKROTIK_HOST;
  const username = process.env.MIKROTIK_USERNAME;
  const password = process.env.MIKROTIK_PASSWORD;
  const port = Number(process.env.MIKROTIK_PORT || 8728);

  if (!host || !username || !password) {
    return {
      success: false,
      message: "MikroTik configuration is missing from .env."
    };
  }

  if (!phone) {
    return {
      success: false,
      message: "Customer phone number is required."
    };
  }

  if (!packageName) {
    return {
      success: false,
      message: "Package name is required."
    };
  }

  const profileName = String(packageName)
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .substring(0, 50);

  const profile = await createHotspotProfile({
    host,
    username,
    password,
    port,
    profileName,
    duration,
    durationUnit
  });

  if (!profile.success) return profile;

  const user = await createHotspotUser({
    host,
    username,
    password,
    port,
    phone,
    userPassword: String(phone),
    profileName,
    limitUptime: profile.sessionTimeout
  });

  if (!user.success) return user;

  console.log("✅ WiTime user connected to MikroTik:", phone);

  return {
    success: true,
    phone,
    profileName,
    sessionTimeout: profile.sessionTimeout
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
      { host, username, password, port },
      async (execute) => {
        console.log("🔵 Connected to MikroTik - getting active users");

        const users = await execute("/ip/hotspot/active/print");

        console.log("📡 Active MikroTik users:", users);

        return {
          success: true,
          users: Array.isArray(users) ? users : [],
          count: Array.isArray(users) ? users.length : 0
        };
      }
    );
  } catch (error) {
    console.error("❌ Active MikroTik users error:", error);
    return {
      success: false,
      users: [],
      count: 0,
      message: error.message || "Unable to get active MikroTik users."
    };
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
  if (!sessionId) {
    return {
      success: false,
      message: "MikroTik active session ID is required."
    };
  }

  try {
    return await runMikroTikCommand(
      { host, username, password, port },
      async (execute) => {
        console.log("🔵 Disconnecting MikroTik session:", sessionId);

        await execute("/ip/hotspot/active/remove", [`=.id=${sessionId}`]);

        console.log("✅ MikroTik session disconnected:", sessionId);

        return {
          success: true,
          message: "MikroTik user disconnected.",
          sessionId
        };
      }
    );
  } catch (error) {
    console.error("❌ MikroTik disconnect error:", error);
    return {
      success: false,
      message: error.message || "Unable to disconnect MikroTik user."
    };
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
  if (!phone) {
    return {
      success: false,
      message: "Customer phone number is required."
    };
  }

  try {
    return await runMikroTikCommand(
      { host, username, password, port },
      async (execute) => {
        console.log("🔵 Connected to MikroTik for expiry:", phone);

        // Find and remove active session
        const activeUsers = await execute("/ip/hotspot/active/print", [
          `?user=${phone}`
        ]);

        if (Array.isArray(activeUsers) && activeUsers.length > 0) {
          for (const activeUser of activeUsers) {
            const sessionId = activeUser[".id"] || activeUser.id;
            if (sessionId) {
              await execute("/ip/hotspot/active/remove", [`=.id=${sessionId}`]);
              console.log("🔴 Removed active session:", phone, sessionId);
            }
          }
        }

        // Find and disable hotspot user record
        const hotspotUsers = await execute("/ip/hotspot/user/print", [
          `?name=${phone}`
        ]);

        if (Array.isArray(hotspotUsers) && hotspotUsers.length > 0) {
          const userId = hotspotUsers[0][".id"] || hotspotUsers[0].id;
          if (userId) {
            await execute("/ip/hotspot/user/set", [
              `=.id=${userId}`,
              "=disabled=yes"
            ]);
            console.log("🔒 MikroTik account disabled:", phone);
          }
        }

        return {
          success: true,
          phone
        };
      }
    );
  } catch (error) {
    console.error("❌ MikroTik expiry error:", error);
    return {
      success: false,
      message: error.message || "Unable to disconnect expired user."
    };
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