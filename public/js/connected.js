// ======================================
// WiTime Connected
// ======================================

const params =
    new URLSearchParams(
        window.location.search
    );

const phone =
    params.get("phone");


if (!phone) {

    alert("Invalid connection.");

    window.location.href = "/";

}


// ======================================
// LOAD CONNECTION
// ======================================

async function loadConnection() {

    try {

        const response =
            await fetch(
                `/api/connected/${encodeURIComponent(phone)}`
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.message ||
                "Unable to load connection."
            );

            window.location.href = "/";

            return;

        }


        // ==================================
        // BASIC INFORMATION
        // ==================================

        document.getElementById("phone").innerText =
            data.phone || phone;


        document.getElementById("package").innerText =
            data.packageName || "Unknown";


        // ==================================
        // LOGIN TIME
        // ==================================

        if (data.loginTime) {

            const loginTime =
                new Date(data.loginTime);

            document.getElementById(
                "connectedAt"
            ).innerText =
                loginTime.toLocaleString();

        }


        // ==================================
        // EXPIRY TIME
        // ==================================

        if (data.expiryTime) {

            const expiry =
                new Date(data.expiryTime);


            document.getElementById(
                "expiresAt"
            ).innerText =
                expiry.toLocaleString();


            startCountdown(expiry);

        } else {

            document.getElementById(
                "remainingTime"
            ).innerText =
                "No expiry time";

        }


        // ==================================
        // STATUS
        // ==================================

        updateStatus(data.status);


    } catch (error) {

        console.error(
            "Connection loading error:",
            error
        );

        alert(
            "Unable to load connection."
        );

    }

}


// ======================================
// STATUS
// ======================================

function updateStatus(status) {

    const statusElement =
        document.getElementById("status");


    if (!statusElement) {
        return;
    }


    statusElement.innerText =
        status || "Offline";

}


// ======================================
// COUNTDOWN
// ======================================

function startCountdown(expiry) {

    const timer =
        setInterval(() => {

            const now =
                new Date();

            const diff =
                expiry.getTime() -
                now.getTime();


            // ==============================
            // EXPIRED
            // ==============================

            if (diff <= 0) {

                clearInterval(timer);


                document.getElementById(
                    "remainingTime"
                ).innerText =
                    "Expired";


                updateStatus(
                    "Expired"
                );


                return;

            }


            // ==============================
            // CALCULATE TIME
            // ==============================

            const totalSeconds =
                Math.floor(
                    diff / 1000
                );


            const hrs =
                Math.floor(
                    totalSeconds / 3600
                );


            const mins =
                Math.floor(
                    (totalSeconds % 3600) / 60
                );


            const secs =
                totalSeconds % 60;


            // ==============================
            // DISPLAY
            // ==============================

            document.getElementById(
                "remainingTime"
            ).innerText =

                `${String(hrs).padStart(2, "0")}:` +

                `${String(mins).padStart(2, "0")}:` +

                `${String(secs).padStart(2, "0")}`;


        }, 1000);

}


// ======================================
// BUY AGAIN
// ======================================

const buyAgain =
    document.getElementById(
        "buyAgain"
    );


if (buyAgain) {

    buyAgain.addEventListener(
        "click",
        () => {

            window.location.href = "/";

        }
    );

}


// ======================================
// START
// ======================================

loadConnection();