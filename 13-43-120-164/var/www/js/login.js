var login = true;

function LoginButtonClicked() {
    var usernameInputElement = document.getElementById("Username");
    var usernameInputted = usernameInputElement.value;
    var passwordInputElement = document.getElementById("Password");
    var passwordInputted = passwordInputElement.value;
    if (usernameInputted == "" || passwordInputted == "") {
        alert("Please fill out all fields");
        throw new Error('Please fill out all fields.');
}
else {
    fetch("https://bubllz.com/api/login", {
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
            alert("Invalid username or password");
        }
        return response.json()
    })
    .then(data => {
        if (!login) {
            return;
        }
        else{
            console.log('Success, token stored!');
            localStorage.setItem('token', data.message);
            alert(`User logged in successfully! as ${usernameInputted}`);
            window.location.href = 'https://bubllz.com';
        }
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
        alert(`Error logging in, ${error}`);
    });
}
}
