const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

const formTitle = document.getElementById("formTitle");
const switchAuth = document.getElementById("switchAuth");
const switchText = document.getElementById("switchText");

const loginMessage = document.getElementById("loginMessage");
const signupMessage = document.getElementById("signupMessage");

// SWITCH LOGIN / SIGN UP

switchAuth.addEventListener("click", function () {


if (loginForm.style.display !== "none") {

    loginForm.style.display = "none";
    signupForm.style.display = "block";

    formTitle.textContent = "Create Administrator Account";

    switchText.textContent = "Already have an account?";

    switchAuth.textContent = "Login";

    loginMessage.textContent = "";
    signupMessage.textContent = "";

} else {

    loginForm.style.display = "block";
    signupForm.style.display = "none";

    formTitle.textContent = "Administrator Login";

    switchText.textContent = "Don't have an account?";

    switchAuth.textContent = "Sign Up";

    loginMessage.textContent = "";
    signupMessage.textContent = "";

}


});

// LOGIN

loginForm.addEventListener("submit", async function (event) {


event.preventDefault();

loginMessage.textContent = "Logging in...";

const username =
    document.getElementById("loginUsername").value.trim();

const password =
    document.getElementById("loginPassword").value;

try {

    const response = await fetch("/api/admin/login", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        credentials: "include",

        body: JSON.stringify({
            username: username,
            password: password
        })

    });

    const data = await response.json();

    if (!response.ok || !data.success) {

        loginMessage.textContent =
            data.message || "Invalid username or password.";

        return;

    }

    window.location.href = "/admin/dashboard.html";

} catch (error) {

    console.error("Login error:", error);

    loginMessage.textContent =
        "Unable to connect to server.";

}


});

// SIGN UP

signupForm.addEventListener("submit", async function (event) {


event.preventDefault();

signupMessage.textContent = "Creating account...";

const username =
    document.getElementById("signupUsername").value.trim();

const password =
    document.getElementById("signupPassword").value;

const confirmPassword =
    document.getElementById("confirmPassword").value;

if (password !== confirmPassword) {

    signupMessage.textContent =
        "Passwords do not match.";

    return;

}

if (password.length < 6) {

    signupMessage.textContent =
        "Password must be at least 6 characters.";

    return;

}

try {

    const response = await fetch("/api/admin/signup", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        credentials: "include",

        body: JSON.stringify({
            username: username,
            password: password,
            confirmPassword: confirmPassword
        })

    });

    const data = await response.json();

    if (!response.ok || !data.success) {

        signupMessage.textContent =
            data.message || "Unable to create account.";

        return;

    }

    window.location.href = "/admin/dashboard.html";

} catch (error) {

    console.error("Signup error:", error);

    signupMessage.textContent =
        "Unable to connect to server.";

}


});
