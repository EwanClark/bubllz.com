function checkPassword() {
    const input = document.getElementById("passwordInput").value;
    const message = document.getElementById("message");

    fetch(`https://bubllz.com/api/consolepassword`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "password": input
        })
    })
        .then(response => {
            if (response.status === 401) {
                message.classList.remove("success");
                return message.innerHTML = "Password is incorrect. Please try again.";
            }
            else if (response.status === 200) {
                message.classList.add("success");
                return message.innerHTML = "Password is correct. Redirecting...";
            }
            else {
                message.classList.remove("success");
                return message.innerHTML = "An error occurred. Please try again.";
            }
        }).catch(error => {
            message.classList.remove("success");
            console.error(error);
            return message.innerHTML = "An error occurred. Please try again.";
        });
}