document.getElementById("internet").innerHTML =
"🟢 Online";

document.getElementById("router").innerHTML =
"🟡 Not Connected";

document.getElementById("database").innerHTML =
"🟡 Waiting";

const activity = [

"System Started",

"Waiting for Users..."

];

const list = document.getElementById("activityList");

list.innerHTML = "";

activity.forEach(item=>{

const li=document.createElement("li");

li.innerHTML=item;

list.appendChild(li);

});