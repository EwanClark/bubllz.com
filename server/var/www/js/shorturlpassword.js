const queryParams = new URLSearchParams(window.location.search);
const id = queryParams.get("aid");
const path = window.location.pathname;
const shorturl = path.split('/').pop();

function checkPassword() {
    const input = document.getElementById("passwordInput").value;
    const message = document.getElementById("message");

    fetch(`https://ewanc.dev/api/short/${id}/checkpassword`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "password": input,
            "shorturl": shorturl
        })
    })
        .then(response => {
            if (response.status === 404) {
                message.classList.remove("success");
                console.log("Error:", response.json());
                return message.innerHTML = "Shorturl not found. Please try again.";
            }
            else if (response.status === 401) {
                message.classList.remove("success");
                console.log("Error:", response.json());
                return message.innerHTML = "Password is incorrect. Please try again.";
            }
            else if (response.status !== 200) {
                message.classList.remove("success");
                console.error("Error:", response.json());
                return message.innerHTML = "An error occurred. Please try again.";
            }
            else {
                return response.json();
            }
        })
        .then(data => {
            if (data.redirecturl) {
                const redirecturl = data.redirecturl;
                message.classList.add("success");
                message.innerHTML = "Password is correct!";
                window.location.href = redirecturl;
            }
        }).catch(error => {
            message.innerHTML = "A logic error occurred. Please try again.";
            console.error("Error:", error);
        });
}