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
// COUNTDOWN TIMER
// ======================================

let countdownTimer = null;


// ======================================
// LOAD CONNECTION
// ======================================

async function loadConnection() {

    try {

        const response =
            await fetch(
                `/api/connected/${encodeURIComponent(phone)}`,
                {
                    cache: "no-store"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            console.error(
                "Connection error:",
                data
            );

            return;

        }


        // ==================================
        // BASIC INFORMATION
        // ==================================

        const phoneElement =
            document.getElementById("phone");

        if (phoneElement) {

            phoneElement.innerText =
                data.phone || phone;

        }


        const packageElement =
            document.getElementById("package");

        if (packageElement) {

            packageElement.innerText =
                data.packageName || "Unknown";

        }


        // ==================================
        // LOGIN TIME
        // ==================================

        const connectedAt =
            document.getElementById(
                "connectedAt"
            );


        if (
            connectedAt &&
            data.loginTime
        ) {

            connectedAt.innerText =
                new Date(
                    data.loginTime
                ).toLocaleString();

        }


        // ==================================
        // EXPIRY TIME
        // ==================================

        const expiresAt =
            document.getElementById(
                "expiresAt"
            );


        if (
            expiresAt &&
            data.expiryTime
        ) {

            expiresAt.innerText =
                new Date(
                    data.expiryTime
                ).toLocaleString();

        }


        // ==================================
        // STATUS
        // ==================================

        updateStatus(
            data.status
        );


        // ==================================
        // REMAINING TIME
        // ==================================

        updateRemainingTime(
            data
        );


    } catch (error) {

        console.error(
            "Connection loading error:",
            error
        );

    }

}


// ======================================
// STATUS
// ======================================

function updateStatus(status) {

    const statusElement =
        document.getElementById(
            "status"
        );


    if (!statusElement) {

        return;

    }


    statusElement.innerText =
        status || "Offline";

}


// ======================================
// REMAINING TIME
// ======================================

function updateRemainingTime(data) {

    const remainingElement =
        document.getElementById(
            "remainingTime"
        );


    if (!remainingElement) {

        return;

    }


    // ----------------------------------
    // EXPIRED
    // ----------------------------------

    if (
        data.status === "Expired" ||
        data.remainingTime === "Expired"
    ) {

        remainingElement.innerText =
            "Expired";

        stopCountdown();

        return;

    }


    // ----------------------------------
    // USE EXPIRY TIME
    // ----------------------------------

    if (!data.expiryTime) {

        remainingElement.innerText =
            data.remainingTime ||
            "No expiry time";

        return;

    }


    const expiry =
        new Date(
            data.expiryTime
        );


    if (
        Number.isNaN(
            expiry.getTime()
        )
    ) {

        remainingElement.innerText =
            data.remainingTime ||
            "Unknown";

        return;

    }


    startCountdown(
        expiry
    );

}


// ======================================
// START COUNTDOWN
// ======================================

function startCountdown(expiry) {

    stopCountdown();


    function update() {

        const now =
            Date.now();


        const diff =
            expiry.getTime() -
            now;


        // ----------------------------------
        // EXPIRED
        // ----------------------------------

        if (diff <= 0) {

            document.getElementById(
                "remainingTime"
            ).innerText =
                "Expired";


            updateStatus(
                "Expired"
            );


            stopCountdown();

            // Ask server for the latest state
            setTimeout(
                loadConnection,
                1000
            );

            return;

        }


        // ----------------------------------
        // CALCULATE
        // ----------------------------------

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


        // ----------------------------------
        // DISPLAY
        // ----------------------------------

        const remainingElement =
            document.getElementById(
                "remainingTime"
            );


        if (remainingElement) {

            remainingElement.innerText =

                `${String(hrs).padStart(2, "0")}:` +

                `${String(mins).padStart(2, "0")}:` +

                `${String(secs).padStart(2, "0")}`;

        }

    }


    update();


    countdownTimer =
        setInterval(
            update,
            1000
        );

}


// ======================================
// STOP COUNTDOWN
// ======================================

function stopCountdown() {

    if (countdownTimer) {

        clearInterval(
            countdownTimer
        );

        countdownTimer = null;

    }

}


// ======================================
// REFRESH SERVER DATA
// ======================================
//
// Every 30 seconds we get the latest
// WiTime/MikroTik state.
//

setInterval(
    loadConnection,
    30 * 1000
);


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

            window.location.href =
                "/";

        }
    );

}


// ======================================
// START
// ======================================

loadConnection();