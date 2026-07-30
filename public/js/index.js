// ===============================
// WiTime Hotspot
// index.js
// ===============================


// Check if free trial has already been used
const freeUsed = localStorage.getItem("freeTrialUsed");

// Free Trial Button
const freeBtn = document.getElementById("freeBtn");

if (freeUsed === "true") {
    freeBtn.innerText = "Free Trial Already Used";
    freeBtn.disabled = true;
    freeBtn.style.background = "#999";
}

freeBtn.addEventListener("click", () => {

    if (localStorage.getItem("freeTrialUsed") === "true") {
        alert("You have already used your free 5-minute trial.");
        return;
    }

    localStorage.setItem("freeTrialUsed", "true");

    alert("Welcome! Your FREE 5-minute internet session has started.");

    // Later this will contact the backend
    // and MikroTik to activate the session.
});

// ===============================
// Buy Internet
// ===============================

const buyBtn = document.getElementById("buyBtn");

buyBtn.addEventListener("click", () => {
    window.location.href = "payment.html";
});

// ===============================
// Package Selection
// ===============================

// ===============================
// Package Selection
// ===============================

const packages = document.querySelectorAll(".package");

packages.forEach(card => {

    card.addEventListener("click", () => {

        const nameElement = card.querySelector("h3");

        const name = nameElement
            ? nameElement.innerText
            : card.querySelector("span").innerText;

        const price = card.querySelector("p").innerText;

        const duration = card.querySelector("span").innerText;

        localStorage.setItem("packageName", name);
        localStorage.setItem("packagePrice", price);
        localStorage.setItem("packageDuration", duration);

        packages.forEach(pkg => {
            pkg.classList.remove("selected");
        });

        card.classList.add("selected");

        console.log(
            "Selected:",
            name,
            price,
            duration
        );

    });

});

