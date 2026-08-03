const saveBtn = document.getElementById("saveSettings");

async function loadSettings(){

    try{

        const response = await fetch("/api/settings");

        const settings = await response.json();

        if(settings){

            document.getElementById("businessName").value = settings.businessName || "";
            document.getElementById("businessPhone").value = settings.businessPhone || "";
            document.getElementById("businessEmail").value = settings.businessEmail || "";
            document.getElementById("businessLocation").value = settings.businessLocation || "";

            document.getElementById("freeMinutes").value = settings.freeMinutes || "";
            document.getElementById("sessionTimeout").value = settings.sessionTimeout || "";
            document.getElementById("idleTimeout").value = settings.idleTimeout || "";

            document.getElementById("shortcode").value = settings.shortcode || "";
            document.getElementById("callbackUrl").value = settings.callbackUrl || "";

            document.getElementById("routerIP").value = settings.routerIP || "";
            document.getElementById("routerUser").value = settings.routerUser || "";
            document.getElementById("routerPassword").value = settings.routerPassword || "";

        }

    }catch(err){

        console.error(err);

    }

}

saveBtn.addEventListener("click",async()=>{

    const settings = {

        businessName:businessName.value,
        businessPhone:businessPhone.value,
        businessEmail:businessEmail.value,
        businessLocation:businessLocation.value,

        freeMinutes:freeMinutes.value,
        sessionTimeout:sessionTimeout.value,
        idleTimeout:idleTimeout.value,

        shortcode:shortcode.value,
        callbackUrl:callbackUrl.value,

        routerIP:routerIP.value,
        routerUser:routerUser.value,
        routerPassword:routerPassword.value

    };

    const response = await fetch("/api/settings",{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify(settings)

    });

    const data = await response.json();

    if(data.success){

        alert("Settings saved successfully.");

    }else{

        alert("Unable to save settings.");

    }

});

loadSettings();