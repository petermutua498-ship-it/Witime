// ======================================
// WiTime Admin Login
// ======================================

const loginForm = document.getElementById("loginForm");

const loginUsername = document.getElementById("loginUsername");
const loginPassword = document.getElementById("loginPassword");

const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");


// ======================================
// LOGIN
// ======================================

loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const username = loginUsername.value.trim();
    const password = loginPassword.value;

    if (!username || !password) {

        loginMessage.textContent =
            "Enter username and password.";

        return;
    }


    // Disable button

    loginButton.disabled = true;

    loginButton.textContent = "Logging in...";

    loginMessage.textContent = "";


    try {

        console.log("Sending administrator login...");


        const response = await fetch(
            "/api/admin/login",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                credentials: "include",

                cache: "no-store",

                body: JSON.stringify({
                    username: username,
                    password: password
                })
            }
        );


        const data = await response.json();


        console.log(
            "Login response:",
            data
        );


        // ======================================
        // LOGIN FAILED
        // ======================================

        if (!response.ok || !data.success) {

            loginMessage.textContent =
                data.message ||
                "Invalid username or password.";

            loginButton.disabled = false;

            loginButton.textContent = "Login";

            return;
        }


        // ======================================
        // LOGIN SUCCESS
        // ======================================

        console.log(
            "Login successful."
        );


        loginMessage.textContent =
            "Login successful. Proceeding to dashboard...";


        // ======================================
        // VERIFY SESSION
        // ======================================

        const sessionResponse = await fetch(
            "/api/admin/me",
            {
                method: "GET",

                credentials: "include",

                cache: "no-store"
            }
        );


        console.log(
            "Session verification status:",
            sessionResponse.status
        );


        if (!sessionResponse.ok) {

            console.error(
                "Administrator session was not returned by server."
            );


            loginMessage.textContent =
                "Login succeeded, but administrator session was not created in the browser.";


            loginButton.disabled = false;

            loginButton.textContent = "Login";

            return;
        }


        const sessionData =
            await sessionResponse.json();


        console.log(
            "Session verification:",
            sessionData
        );


        if (
            !sessionData.success ||
            !sessionData.admin
        ) {

            loginMessage.textContent =
                "Login succeeded, but administrator session could not be verified.";

            loginButton.disabled = false;

            loginButton.textContent = "Login";

            return;
        }


        // ======================================
        // EVERYTHING IS GOOD
        // ======================================

        console.log(
            "✅ Administrator session verified."
        );


        console.log(
            "➡️ Redirecting to dashboard..."
        );


        window.location.replace(
            "/admin/dashboard.html"
        );


    } catch (error) {

        console.error(
            "Administrator login error:",
            error
        );


        loginMessage.textContent =
            "Unable to connect to the server.";


        loginButton.disabled = false;

        loginButton.textContent = "Login";

    }

});


// ======================================
// PREVENT MULTIPLE SUBMISSIONS
// ======================================

loginPassword.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Enter") {

            loginForm.requestSubmit();

        }

    }
);