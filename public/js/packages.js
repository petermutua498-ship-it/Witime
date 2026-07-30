const modal = document.getElementById("packageModal");

const addBtn = document.querySelector(".addBtn");

const closeBtn = document.querySelector(".close");

addBtn.onclick = () => {
    modal.style.display = "block";
};

closeBtn.onclick = () => {
    modal.style.display = "none";
};

window.onclick = (e) => {
    if (e.target === modal) {
        modal.style.display = "none";
    }
};

row.querySelector(".deleteBtn").addEventListener("click", () => {

    if (confirm("Delete this package?")) {
        row.remove();
    }

});

row.querySelector(".editBtn").addEventListener("click", () => {

    document.getElementById("packageName").value = name;
    document.getElementById("packagePrice").value = price;
    document.getElementById("packageDuration").value = duration;
    document.getElementById("durationUnit").value = unit;

    row.remove();

    modal.style.display = "block";

});

saveBtn.addEventListener("click", async () => {

    const packageData = {

        name: document.getElementById("packageName").value,

        price: document.getElementById("packagePrice").value,

        duration: document.getElementById("packageDuration").value,

        durationUnit: document.getElementById("durationUnit").value

    };

    const response = await fetch("/api/packages",{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify(packageData)

    });

    const data = await response.json();

    if(data.success){

        alert("Package saved successfully.");

        location.reload();

    }else{

        alert(data.message);

    }

});

async function loadPackages(){

    const response = await fetch("/api/packages");

    const packages = await response.json();

    table.innerHTML="";

    packages.forEach(pkg=>{

        table.innerHTML +=`

<tr>

<td>${pkg.name}</td>

<td>KES ${pkg.price}</td>

<td>${pkg.duration} ${pkg.durationUnit}</td>

<td><span class="status active">Active</span></td>

<td>
<button>Edit</button>
<button>Delete</button>
</td>

</tr>

`;

    });

}

loadPackages();