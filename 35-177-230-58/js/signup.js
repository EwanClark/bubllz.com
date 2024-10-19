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
        alert("Passwords do not match");
        return;
    }
    if (FirstNameInput == "" || LastNameInput == "" || UsernameInput == "" || passwordInput == "" || passwordAgainInput == "") {
        alert("Please fill out all fields");
        return;
    }
    if (passwordInput.search(/\s/) >= 0) {
        alert("Password must not contain any whitespace");
        return;
    }
    else {
        fetch("https://bubllz.com/api/signup", {
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
                alert("Username already exists");
                throw new Error('Username already exists.');
            }
            else if (response.status === 500) {
                alert("Database error");
                throw new Error('Database error.');
            }
    return response.json();
    })  
        .then(responseData => {
            console.log('Success:', responseData);
            alert(`User signed up successfully! as ${UsernameInput}`);
            window.location.href = "https://bubllz.com/login";
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation: ', error);
        });
    }
}