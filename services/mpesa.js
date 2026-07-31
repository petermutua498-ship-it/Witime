const axios = require("axios");

async function getAccessToken() {

    const auth = Buffer.from(
        process.env.MPESA_CONSUMER_KEY + ":" + process.env.MPESA_CONSUMER_SECRET
    ).toString("base64");

    try {

        const response = await axios.get(
            "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
            {
                headers: {
                    Authorization: "Basic " + auth
                }
            }
        );

        console.log("KEY:", process.env.MPESA_CONSUMER_KEY);
console.log("SECRET:", process.env.MPESA_CONSUMER_SECRET);
console.log("SHORTCODE:", process.env.MPESA_SHORTCODE);
console.log("PASSKEY:", process.env.MPESA_PASSKEY);

        return response.data.access_token;

    } catch (err) {
    console.error("ACCESS TOKEN ERROR");

    if (err.response) {
        console.error("Status:", err.response.status);
        console.error("Response:", JSON.stringify(err.response.data, null, 2));
    } else {
        console.error(err);
    }

    throw err;
}
    }


module.exports = { getAccessToken };