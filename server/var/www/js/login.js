function sendalert(message) {
    document.getElementById('alert-message').textContent = message;
    document.getElementById('custom-alert').style.display = 'flex';
    document.getElementById('alert-ok').onclick = closeModal;
    window.onkeydown = function (event) {
        if (event.key === 'Escape') {
            closeModal();
        }
    };
}

function closeModal() {
    document.getElementById('custom-alert').style.display = 'none';
}


function LoginButtonClicked() {
    var usernameInputElement = document.getElementById("Username");
    var usernameInputted = usernameInputElement.value;
    var passwordInputElement = document.getElementById("Password");
    var passwordInputted = passwordInputElement.value;
    if (usernameInputted == "" || passwordInputted == "") {
        return sendalert("Please fill out all fields");
    } else {
        var login = true;
        fetch("https://ewanc.dev/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "Username": usernameInputted,
                "Password": passwordInputted
            })
        })
        .then(response => {
            if (response.status === 401) {
                login = false;
                sendalert("Invalid username or password");
            }
            return response.json();
        })
        .then(data => {
            if (login) {
                console.log('Success, token stored!');
                localStorage.setItem('token', data.message);
                sendalert(`User logged in successfully! as ${usernameInputted}`);
                document.getElementById('alert-ok').addEventListener('click', function () {
                    window.location.href = 'https://ewanc.dev';
                });
            }
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
            sendalert(`Error logging in, ${error}`);
        });
    }
}
