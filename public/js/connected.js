// ======================================
// WiTime Connected
// ======================================

const params = new URLSearchParams(window.location.search);

const phone = params.get("phone");

if (!phone) {

    alert("Invalid connection.");

    window.location.href = "/";

}

async function loadConnection() {

    try {

        const response = await fetch(`/api/connected/${phone}`);

        const data = await response.json();

        if (!response.ok) {

            alert(data.message);

            window.location.href = "/";

            return;

        }

        document.getElementById("phone").innerText =
            data.phone;

        document.getElementById("package").innerText =
            data.packageName;

        const connectedTime =
            new Date(data.createdAt);

        document.getElementById("connectedAt").innerText =
            connectedTime.toLocaleString();

        // Calculate expiry

        let hours = 1;

        const duration =
            data.packageDuration.toLowerCase();

        if (duration.includes("2")) hours = 2;
        else if (duration.includes("3")) hours = 3;
        else if (duration.includes("5")) hours = 5;
        else if (duration.includes("12")) hours = 12;

        const expiry =
            new Date(connectedTime.getTime() + hours * 60 * 60 * 1000);

        document.getElementById("expiresAt").innerText =
            expiry.toLocaleString();

        startCountdown(expiry);

    } catch (err) {

        console.error(err);

        alert("Unable to load connection.");

    }

}

function startCountdown(expiry) {

    const timer = setInterval(() => {

        const now = new Date();

        const diff = expiry - now;

        if (diff <= 0) {

            clearInterval(timer);

            document.getElementById("remainingTime").innerText =
                "Expired";

            alert("Your internet package has expired.");

            window.location.href = "/";

            return;

        }

        const hrs =
            Math.floor(diff / 3600000);

        const mins =
            Math.floor((diff % 3600000) / 60000);

        const secs =
            Math.floor((diff % 60000) / 1000);

        document.getElementById("remainingTime").innerText =

            `${String(hrs).padStart(2,"0")}:` +
            `${String(mins).padStart(2,"0")}:` +
            `${String(secs).padStart(2,"0")}`;

    }, 1000);

}

document.getElementById("buyAgain")
.addEventListener("click", () => {

    window.location.href = "/";

});

loadConnection();