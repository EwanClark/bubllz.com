let currentID = 1;

// Function to get the short URL code from the full URL
function extractShortUrlCode(text) {
    // Use regex to match the short URL code
    const match = text.match(/https:\/\/short\.bubllz\.com\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null; // Return the matched code or null if not found
}

// Function to add a short URL
async function addShortUrl(redirectUrl, token, customshorturl) {
    let body;
    if (customshorturl) {
        body = { redirecturl: redirectUrl, customshorturlcode: customshorturl };
    } else {
        body = { redirecturl: redirectUrl };
    }

    try {
        const response = await fetch('https://api.bubllz.com/addshorturl', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'token': token
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        // Handle specific status codes and errors
        if (response.status === 400) {
            document.getElementById('shortenButton').disabled = false;
            alert("No token provided. Please log in again.");
            window.location.href = 'https://bubllz.com/login';
        } else if (response.status === 401) {
            document.getElementById('shortenButton').disabled = false;
            return alert("Invalid token or session expired. Please log in again.");
        } else if (response.status === 402) {
            document.getElementById('shortenButton').disabled = false;
            return alert("No URL provided. Please enter a URL to shorten.");
        } else if (response.status === 403) {
            document.getElementById('shortenButton').disabled = false;
            return alert("Custom short URL contains profanity.");
        } else if (response.status === 404) {
            document.getElementById('shortenButton').disabled = false;
            return alert("Custom short URL already exists. Please choose another one.");
        } else if (response.status === 405) {
            document.getElementById('shortenButton').disabled = false;
            alert("Custom short URL contains invalid characters. Only letters and numbers are allowed.");
        } else if (response.status === 406) {
            document.getElementById('shortenButton').disabled = false;
            alert("Custom short URL is invalid and one of the current API routes. Please choose another one.");
        } else if (response.status === 500) {
            document.getElementById('shortenButton').disabled = false;
            alert("An error occurred on the server. Please try again later.");
        } else if (response.status === 200) {
            return data.message; // Return the short URL code
        }
    } catch (error) {
        console.error('An error occurred:', error);
        alert('An error occurred while shortening the URL.');
    } finally {
        document.getElementById('shortenButton').disabled = false;
    }
}

// Function to remove short URL
async function removeshorturl(shorturlcode, token, urlItem) {
    fetch("https://api.bubllz.com/removeshorturl", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'token': token
        },
        body: JSON.stringify({ shorturl: shorturlcode })
    })
        .then(response => {
            if (response.status === 200) {
                console.log('Short URL deleted');
            } else {
                alert('An error occurred while deleting the short URL');
                document.getElementById('shortenButton').disabled = false;
                return console.log('An error occurred');
            }
        })
        .catch(error => {
            document.getElementById('shortenButton').disabled = false;
            return alert('An error occurred while deleting the short URL');
        })
        .finally(() => {
            console.log('Short URL deleted from database');
            urlItem.remove();
            console.log('Short URL deleted from UI');
        });
}

// Function to validate and check URL
async function validateAndCheckUrl(url) {
    if (!url.startsWith('https://') && !url.startsWith('http://')) {
        url = 'https://' + url;
    }
    if (!url.includes('www.')) {
        const protocol = url.startsWith('https://') ? 'https://' : 'http://';
        url = protocol + 'www.' + url.replace(protocol, '');
    }
    console.log('URL after formatting:', url);

    try {
        const response = await fetch(`https://api.bubllz.com/validurl?url=${encodeURIComponent(url)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 400) {
            console.log("No URL provided");
            document.getElementById('shortenButton').disabled = false;
            alert("No URL provided");
            return false;
        }
        if (response.status === 200) {
            return url;
        } else {
            console.log('URL is invalid');
            return false;
        }
    } catch (error) {
        console.log("Error:", error);
        return false;
    }
}

// Toggle Dark Mode
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

// Check if token is present
if (!localStorage.getItem('token')) {
    alert('Please login to create or view your short URLs.');
    window.location.href = 'https://bubllz.com/login';
}

// Fetch user's short URLs
fetch('https://api.bubllz.com/getshorturls', {
    method: 'GET',
    headers: {
        'token': localStorage.getItem('token')
    }
})
    .then(response => {
        if (response.status === 200) {
            return response.json();
        } else {
            throw new Error('An error occurred');
        }
    })
    .then(data => {
        const usersurls = data.message; // Assign data.message to usersurls
        const parentDiv = document.querySelector('.url-list');
        usersurls.forEach(url => {
            const newDiv = document.createElement('div');
            newDiv.className = 'url-item';
            newDiv.setAttribute('data-id', currentID);
            currentID++;

            const urlText = document.createElement('div');
            urlText.className = 'url-text';
            urlText.innerHTML = `
                <a href="https://short.bubllz.com/${url.shorturl}">https://short.bubllz.com/${url.shorturl}</a>
                &nbsp;&nbsp;&gt;&gt;&nbsp;&nbsp;
                <a href="${url.redirecturl}">${url.redirecturl}</a>
                <br><a href="https://bubllz.com/shorturlanalytics?shorturl=${url.shorturl}">View Analytics</a>
            `;
            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-btn';
            deleteButton.textContent = 'Delete';

            newDiv.appendChild(urlText);
            newDiv.appendChild(deleteButton);
            parentDiv.appendChild(newDiv);

            // Add event listener for the newly added delete button
            deleteButton.addEventListener('click', function () {
                const urlItem = this.closest('.url-item');
                const shortUrlCode = extractShortUrlCode(urlItem.querySelector('.url-text').innerHTML);
                if (!shortUrlCode) {
                    alert('Could not extract the short URL code.');
                    return;
                }

                if (!localStorage.getItem('token')) {
                    alert('Please login to create or view your short URLs.');
                    window.location.href = 'https://bubllz.com/login';
                }
                removeshorturl(shortUrlCode, localStorage.getItem('token'), urlItem);
            });
        });

        // Make the shorten button clickable
        document.getElementById('shortenButton').disabled = false;

        // Wait for shorten button click
        document.getElementById('shortenButton').addEventListener('click', async function () {
            document.getElementById('shortenButton').disabled = true;
            console.log('Shorten button clicked');
            const url = document.getElementById('url').value;
            const validUrl = await validateAndCheckUrl(url);
            if (validUrl) {
                // Make the short URL
                const shorturlcode = await addShortUrl(validUrl, localStorage.getItem('token'), document.getElementById('shorturlcode').value);
                const parentDiv = document.querySelector('.url-list');
                if (shorturlcode) {
                    const newDiv = document.createElement('div');
                    newDiv.className = 'url-item';
                    newDiv.setAttribute('data-id', currentID);
                    currentID++;

                    const urlText = document.createElement('div');
                    urlText.className = 'url-text';
                    urlText.innerHTML = `
                        <a href="https://short.bubllz.com/${shorturlcode}">https://short.bubllz.com/${shorturlcode}</a>
                        &nbsp;&nbsp;&gt;&gt;&nbsp;&nbsp;
                        <a href="${validUrl}">${validUrl}</a>
                        <br><a href="https://bubllz.com/shorturlanalytics?shorturl=${shorturlcode}">View Analytics</a>
                    `;
                    const deleteButton = document.createElement('button');
                    deleteButton.className = 'delete-btn';
                    deleteButton.textContent = 'Delete';

                    newDiv.appendChild(urlText);
                    newDiv.appendChild(deleteButton);
                    parentDiv.appendChild(newDiv);

                    // Add event listener for the newly added delete button
                    deleteButton.addEventListener('click', function () {
                        const urlItem = this.closest('.url-item');
                        const shortUrlCode = extractShortUrlCode(urlItem.querySelector('.url-text').innerHTML);
                        if (!shortUrlCode) {
                            alert('Could not extract the short URL code.');
                            return;
                        }

                        if (!localStorage.getItem('token')) {
                            alert('Please login to create or view your short URLs.');
                            window.location.href = 'https://bubllz.com/login';
                        }
                        removeshorturl(shortUrlCode, localStorage.getItem('token'), urlItem);
                    });
                }
            }
        });
    })
    .catch(error => console.error(error));
