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
    fetch("https://api.bubllz.com/shorturlanalytics", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "shorturl": window.location.search.split("shorturl=")[1]
        }
    })
    .then(response => {
        if (response.status === 201) {
            console.log("No analytics data found but shorturl exists");
            alert("No analytics data found but shorturl exists.");
            return null; // Stop processing if no data
        } else if (response.status === 404) {
            console.log("Shorturl does not exist");
            alert("Shorturl does not exist.");
            return null;
        } else if (response.status === 500) {
            console.log("Database error");
            alert("Database error.");
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
                const city = element.city;
                const region = element.region;
                const country = element.country;
                const userAgent = element.useragent;
                currentData = document.getElementById("analyticsData")
                const newData = 
                `
                <tr>
                    <td>${timestamp}</td>
                    <td>${ip}</td>
                    <td><a href="${redirect}" target="_blank">${redirect}</a></td>
                    <td>${isp}</td>
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