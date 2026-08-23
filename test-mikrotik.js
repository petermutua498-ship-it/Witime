require("dotenv").config();

const { RouterOSClient } = require("routeros-client");

(async () => {

    const client = new RouterOSClient({

        host: process.env.MIKROTIK_HOST,

        user: process.env.MIKROTIK_USERNAME,

        password: process.env.MIKROTIK_PASSWORD,

        port: 8728

    });

    try {

        const api = await client.connect();

        const identity = await api.menu("/system/identity").getOnly();

        console.log("✅ Connected to:", identity.name);

        await client.close();

    } catch (err) {

        console.error(err);

    }

})();