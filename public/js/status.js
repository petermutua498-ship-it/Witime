const phone =
new URLSearchParams(window.location.search).get("phone");

document.getElementById("phone").innerText = phone;

document.getElementById("package").innerText =
localStorage.getItem("packageName");

// Example countdown (1 hour for now)
let seconds = 3600;

function updateTimer(){

    let hrs = Math.floor(seconds / 3600);

    let mins = Math.floor((seconds % 3600) / 60);

    let secs = seconds % 60;

    document.getElementById("timer").innerText =
        `${String(hrs).padStart(2,"0")}:` +
        `${String(mins).padStart(2,"0")}:` +
        `${String(secs).padStart(2,"0")}`;

    if(seconds > 0){
        seconds--;
    }else{
        alert("Your internet session has expired.");
    }

}

setInterval(updateTimer,1000);

function buyMore(){

    window.location.href = "/payment.html";

}