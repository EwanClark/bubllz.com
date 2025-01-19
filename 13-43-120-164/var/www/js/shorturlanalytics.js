function sendalert(message) {
    // Set the message in the modal
    document.getElementById('alert-message').textContent = message;

    // Show the modal
    document.getElementById('custom-alert').style.display = 'flex';

    // Close the modal when clicking the close button or OK button
    document.getElementById('alert-ok').onclick = closeModal;
}

function closeModal() {
    document.getElementById('custom-alert').style.display = 'none';
}


document.getElementById('toggleDarkMode').addEventListener('click', function () {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('dark-mode', 'enabled');
    } else {
        localStorage.setItem('dark-mode', 'disabled');
    }
});

if (localStorage.getItem('dark-mode') === 'enabled') {
    document.body.classList.add('dark-mode');
}

addEventListener("DOMContentLoaded", function () {
    document.getElementById("title").innerHTML = `URL Analytics for ${window.location.search.split("shorturl=")[1]}`;
    fetch("https://bubllz.com/api/shorturlanalytics", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "shorturl": window.location.search.split("shorturl=")[1]
        }
    })
    .then(response => {
        if (response.status === 201) {
            console.log("No analytics data found but shorturl exists");
            sendalert("No analytics data found but shorturl exists.");
            return null; // Stop processing if no data
        } else if (response.status === 404) {
            console.log("Shorturl does not exist");
            sendalert("Shorturl does not exist.");
            return null;
        } else if (response.status === 500) {
            console.log("Database error");
            sendalert("Database error.");
            return null;
        } else if (response.status === 200) {
            return response.json(); // Only return JSON if the response is OK
        }
    })
    .then(data => {
        if (data) {
            document.getElementById("clickCount").innerHTML = data.analytics.length;
            data.analytics.forEach(element => {
                const timestamp = element.timestamp;
                const ip = element.ip;
                const redirect = element.referrer;
                const isp = element.isp;
                const authorized = element.password_status;
                const city = element.city;
                const region = element.region;
                const country = element.country;
                const userAgent = element.useragent;
                currentData = document.getElementById("analyticsData")
                var redirectlink;
                if (!/^https?:\/\//i.test(redirect)) {
                    redirectlink = (`https://${redirect}`);
                } else {
                    redirectlink = redirect;
                }
                const newData = 
                `
                <tr>
                    <td>${timestamp}</td>
                    <td>${ip}</td>
                    <td><a href="${redirectlink}">${redirect}</a></td>
                    <td>${isp}</td>
                    <td>${authorized}</td>
                    <td>${city}</td>
                    <td>${region}</td>
                    <td>${country}</td>
                    <td>${userAgent}</td>
                </tr>
                `
                currentData.innerHTML += newData;
            });
        }
    })
    .catch(error => {
        console.log("Error fetching: " + error);
    });
});