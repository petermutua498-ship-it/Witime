(function () {

    const currentPage = window.location.pathname;

    // Login page does not need authentication
    if (currentPage.endsWith("/admin/login.html")) {
        return;
    }

    // Check whether admin is logged in
    fetch("/api/admin/check", {
        credentials: "include"
    })
    .then(response => {

        if (!response.ok) {
            throw new Error("Not authenticated");
        }

        return response.json();

    })
    .then(data => {

        if (!data.success || !data.loggedIn) {
            window.location.href = "/admin/login.html";
        }

    })
    .catch(() => {

        window.location.href = "/admin/login.html";

    });


    // ==============================
    // LOGOUT
    // ==============================

    document.addEventListener("click", async (event) => {

        const logoutButton = event.target.closest("#logoutBtn");

        if (!logoutButton) {
            return;
        }

        try {

            const response = await fetch("/api/admin/logout", {
                method: "POST",
                credentials: "include"
            });

            const data = await response.json();

            if (data.success) {

                window.location.href = "/admin/login.html";

            } else {

                alert(data.message || "Logout failed.");

            }

        } catch (error) {

            console.error("Logout error:", error);

            alert("Unable to logout.");

        }

    });

})();