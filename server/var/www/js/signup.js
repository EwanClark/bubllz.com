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

function SignupButtonClicked() {
    var FirstNameInputElement = document.getElementById("Fname");
    var FirstNameInput = FirstNameInputElement.value;

    var LastNameInputElement = document.getElementById("Lname");
    var LastNameInput = LastNameInputElement.value;

    var UsernameInputElement = document.getElementById("Username");
    var UsernameInput = UsernameInputElement.value;

    var passwordInputElement = document.getElementById("Password");
    var passwordInput = passwordInputElement.value;
    
    var passwordAgainInputElement = document.getElementById("PasswordAgain");
    var passwordAgainInput = passwordAgainInputElement.value;

    if (passwordInput != passwordAgainInput) {
        sendalert("Passwords do not match");
        return;
    }
    if (FirstNameInput == "" || LastNameInput == "" || UsernameInput == "" || passwordInput == "" || passwordAgainInput == "") {
        sendalert("Please fill out all fields");
        return;
    }
    if (passwordInput.search(/\s/) >= 0) {
        sendalert("Password must not contain any whitespace");
        return;
    }
    else {
        fetch("https://ewanc.dev/api/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "FirstName": FirstNameInput,
                "LastName": LastNameInput,
                "Username": UsernameInput,
                "Password": passwordInput
            })
        })
        .then (response => {
            if (response.status === 400) {
                sendalert("Username already exists");
                throw new Error('Username already exists.');
            }
            else if (response.status === 500) {
                sendalert("Database error");
                throw new Error('Database error.');
            }
    return response.json();
    })  
        .then(responseData => {
            console.log('Success:', responseData);
            sendalert(`User signed up successfully! as ${UsernameInput}`);
            document.getElementById('alert-ok').addEventListener('click', function () {
                window.location.href = 'https://ewanc.dev/login';
            });
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation: ', error);
        });
    }
}