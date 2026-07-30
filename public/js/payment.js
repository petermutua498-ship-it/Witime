// ==============================
// WiTime Payment
// ==============================

// Load selected package
const packageName = localStorage.getItem("packageName");
const packagePrice = localStorage.getItem("packagePrice");
const packageDuration = localStorage.getItem("packageDuration");

document.getElementById("packageName").innerText = packageName || "No package selected";
document.getElementById("packagePrice").innerText = packagePrice || "";
document.getElementById("packageDuration").innerText = packageDuration || "";

// Pay Button
document.getElementById("payBtn").addEventListener("click", async () => {

    let phone = document.getElementById("phone").value.trim();

    if (phone === "") {
        alert("Please enter your phone number.");
        return;
    }

    // Convert 07XXXXXXXX to 2547XXXXXXXX
    if (phone.startsWith("07")) {
        phone = "254" + phone.substring(1);
    }

    // Already in 254 format
    if (!phone.startsWith("254")) {
        alert("Enter a valid Safaricom number.");
        return;
    }

    try {

        document.getElementById("payBtn").disabled = true;
        document.getElementById("payBtn").innerText = "Sending STK Push...";

        const response = await fetch("/pay", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                phone,
                packageName,
                packagePrice,
                packageDuration
            })
        });

        const data = await response.json();

        if (data.success) {

            window.location.href =
                `/verify.html?phone=${phone}`;

        } else {

            alert(data.message || "Payment request failed.");

            document.getElementById("payBtn").disabled = false;
            document.getElementById("payBtn").innerText = "Pay with M-Pesa";
        }

    } catch (err) {

        console.error(err);

        alert("Unable to contact the server.");

        document.getElementById("payBtn").disabled = false;
        document.getElementById("payBtn").innerText = "Pay with M-Pesa";
    }

});