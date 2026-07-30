document.getElementById("loginBtn").addEventListener("click", async () => {

    const username =
        document.getElementById("username").value.trim();

    const password =
        document.getElementById("password").value.trim();

    if (!username || !password) {

        alert("Enter username and password.");

        return;

    }

    try {

        const response = await fetch("/admin/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                username,
                password
            })

        });

        const data = await response.json();

        if (data.success) {

            window.location.href = "/admin.html";

        } else {

            alert(data.message);

        }

    } catch (err) {

        alert("Unable to connect to the server.");

        console.log(err);

    }

});