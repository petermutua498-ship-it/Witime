// ======================================
// WiTime Administrator Login
// ======================================

const loginForm =
    document.getElementById("loginForm");

const loginMessage =
    document.getElementById("loginMessage");

const loginButton =
    document.getElementById("loginButton");


// ======================================
// LOGIN
// ======================================

loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    loginMessage.textContent = "Logging in...";

    const username =
        document.getElementById("loginUsername").value.trim();

    const password =
        document.getElementById("loginPassword").value;

    try {

        const response = await fetch(
            "/api/admin/login",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                credentials: "include",

                body: JSON.stringify({
                    username,
                    password
                })
            }
        );

        const data = await response.json();

        console.log("Login response:", data);

        if (!response.ok || !data.success) {

            loginMessage.textContent =
                data.message ||
                "Invalid username or password.";

            return;
        }

        loginMessage.textContent =
            "Login successful. Opening dashboard...";

        // Give the browser a moment to store
        // the session cookie.

        setTimeout(() => {

            window.location.replace(
                "/admin/dashboard.html"
            );

        }, 300);

    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        loginMessage.textContent =
            "Unable to connect to server.";

    }

});