// ======================================
// ADMIN ACCOUNT
// ======================================

const adminForm = document.getElementById("adminSettingsForm");

if (adminForm) {

    adminForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const message = document.getElementById("adminMessage");

        const username =
            document.getElementById("adminUsername").value.trim();

        const currentPassword =
            document.getElementById("currentPassword").value;

        const newPassword =
            document.getElementById("newPassword").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;

        message.textContent = "";
        message.className = "message";

        if (!username) {
            message.textContent = "Username is required.";
            message.classList.add("error");
            return;
        }

        // If changing password, all password fields are required
        if (newPassword || confirmPassword || currentPassword) {

            if (!currentPassword) {
                message.textContent =
                    "Enter your current password.";
                message.classList.add("error");
                return;
            }

            if (!newPassword) {
                message.textContent =
                    "Enter a new password.";
                message.classList.add("error");
                return;
            }

            if (newPassword !== confirmPassword) {
                message.textContent =
                    "New passwords do not match.";
                message.classList.add("error");
                return;
            }

            if (newPassword.length < 6) {
                message.textContent =
                    "New password must be at least 6 characters.";
                message.classList.add("error");
                return;
            }
        }

        message.textContent =
            "Saving account changes...";

        try {

            const response = await fetch(
                "/api/admin/update-account",
                {
                    method: "PUT",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        username,
                        currentPassword,
                        newPassword
                    })
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {

                message.textContent =
                    result.message ||
                    "Unable to update account.";

                message.classList.add("error");

                return;
            }

            message.textContent =
                "Account updated successfully.";

            message.classList.add("success");

            // Clear password fields
            document.getElementById("currentPassword").value = "";
            document.getElementById("newPassword").value = "";
            document.getElementById("confirmPassword").value = "";

            /*
             * If the password was changed, force a new login.
             * This is safer than leaving the old session active.
             */
            if (newPassword) {

                setTimeout(() => {

                    window.location.replace(
                        "/admin/login.html"
                    );

                }, 1500);

            }

        } catch (error) {

            console.error(
                "Account update error:",
                error
            );

            message.textContent =
                "Unable to contact the server.";

            message.classList.add("error");
        }

    });

}

// ======================================
// MIKROTIK
// ======================================

const mikrotikForm =
    document.getElementById("mikrotikForm");

const testMikrotik =
    document.getElementById("testMikrotik");


// ======================================
// LOAD SAVED MIKROTIK SETTINGS
// ======================================

async function loadMikrotikSettings() {

    try {

        const response =
            await fetch(
                "/api/admin/mikrotik/settings",
                {
                    credentials: "include",
                    cache: "no-store"
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            return;

        }


        if (
            data.configured &&
            data.mikrotik
        ) {

            document.getElementById(
                "mikrotikHost"
            ).value =
                data.mikrotik.host || "";


            document.getElementById(
                "mikrotikUsername"
            ).value =
                data.mikrotik.username || "";


            document.getElementById(
                "mikrotikPort"
            ).value =
                data.mikrotik.port || 8728;


            const status =
                document.getElementById(
                    "mikrotikStatus"
                );


            if (status) {

                status.textContent =
                    "Configured";

                status.className =
                    "status connected";

            }

        }

    } catch (error) {

        console.error(
            "Unable to load MikroTik settings:",
            error
        );

    }

}


// ======================================
// TEST MIKROTIK
// ======================================

if (testMikrotik) {

    testMikrotik.addEventListener(
        "click",
        async function () {

            const message =
                document.getElementById(
                    "mikrotikMessage"
                );


            const host =
                document.getElementById(
                    "mikrotikHost"
                ).value.trim();


            const username =
                document.getElementById(
                    "mikrotikUsername"
                ).value.trim();


            const password =
                document.getElementById(
                    "mikrotikPassword"
                ).value;


            const port =
                document.getElementById(
                    "mikrotikPort"
                ).value.trim();


            if (!host || !username) {

                message.textContent =
                    "Enter the MikroTik host and username.";

                return;

            }


            message.textContent =
                "Testing MikroTik connection...";


            try {

                const response =
                    await fetch(
                        "/api/admin/mikrotik/test",
                        {

                            method: "POST",

                            credentials: "include",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({

                                    host,

                                    username,

                                    password,

                                    port:
                                        Number(port) ||
                                        8728

                                })

                        }
                    );


                const data =
                    await response.json();


                if (
                    !response.ok ||
                    !data.success
                ) {

                    message.textContent =
                        data.message ||
                        "MikroTik connection failed.";

                    return;

                }


                message.textContent =
                    "✅ MikroTik connection successful.";


                const status =
                    document.getElementById(
                        "mikrotikStatus"
                    );


                if (status) {

                    status.textContent =
                        "Connected";

                    status.className =
                        "status connected";

                }

            } catch (error) {

                console.error(
                    "MikroTik test error:",
                    error
                );

                message.textContent =
                    "Unable to connect to MikroTik.";

            }

        }
    );

}


// ======================================
// SAVE MIKROTIK
// ======================================

if (mikrotikForm) {

    mikrotikForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const message =
                document.getElementById(
                    "mikrotikMessage"
                );


            const host =
                document.getElementById(
                    "mikrotikHost"
                ).value.trim();


            const username =
                document.getElementById(
                    "mikrotikUsername"
                ).value.trim();


            const password =
                document.getElementById(
                    "mikrotikPassword"
                ).value;


            const port =
                document.getElementById(
                    "mikrotikPort"
                ).value.trim();


            if (!host || !username) {

                message.textContent =
                    "Enter the MikroTik host and username.";

                return;

            }


            message.textContent =
                "Saving MikroTik settings...";


            try {

                const response =
                    await fetch(
                        "/api/admin/mikrotik/save",
                        {

                            method: "POST",

                            credentials: "include",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({

                                    host,

                                    username,

                                    password,

                                    port:
                                        Number(port) ||
                                        8728

                                })

                        }
                    );


                const data =
                    await response.json();


                if (
                    !response.ok ||
                    !data.success
                ) {

                    message.textContent =
                        data.message ||
                        "Unable to save MikroTik settings.";

                    return;

                }


                message.textContent =
                    "✅ MikroTik settings saved successfully.";


                const status =
                    document.getElementById(
                        "mikrotikStatus"
                    );


                if (status) {

                    status.textContent =
                        "Connected";

                    status.className =
                        "status connected";

                }

            } catch (error) {

                console.error(
                    "MikroTik save error:",
                    error
                );

                message.textContent =
                    "Unable to save MikroTik settings.";

            }

        }
    );

}

window.addEventListener(
    "DOMContentLoaded",
    function () {

        loadAdmin();

        loadMikrotikSettings();

    }
);