const phone = new URLSearchParams(window.location.search).get("phone");

document.getElementById("phoneNumber").innerText = phone;

document.getElementById("buyMore").onclick = () => {

    window.location.href = "/";

};

document.getElementById("disconnect").onclick = () => {

    if(confirm("Disconnect from WiTime?")){

        window.location.href="/";

    }

};

// We'll connect the countdown to MongoDB next.