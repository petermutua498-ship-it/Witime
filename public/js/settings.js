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