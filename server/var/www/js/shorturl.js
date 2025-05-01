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

let currentID = 1;

// Function to get the short URL code from the full URL
function extractShortUrlCode(text) {
    // Use regex to match the new short URL format
    const match = text.match(/bubllz\.com\/api\/short\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null; // Return the matched code or null if not found
}

// Function to add a short URL
async function addShortUrl(redirectUrl, token, customshorturl, password) {
    let body;

    if (customshorturl && password) {
        body = { redirecturl: redirectUrl, customshorturlcode: customshorturl, password: password };
    } else if (customshorturl) {
        body = { redirecturl: redirectUrl, customshorturlcode: customshorturl };
    } else if (password) {
        body = { redirecturl: redirectUrl, password: password };
    } else {
        body = { redirecturl: redirectUrl };
    }

    try {
        const response = await fetch('https://ewanc.dev/api/addshorturl', {
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
            sendalert("No token provided. Please log in again.");
            document.getElementById('alert-ok').addEventListener('click', function () {
                window.location.href = 'https://ewanc.dev/login';
            });
        } else if (response.status === 401) {
            document.getElementById('shortenButton').disabled = false;
            return sendalert("Invalid token or session expired. Please log in again.");
        } else if (response.status === 402) {
            document.getElementById('shortenButton').disabled = false;
            return sendalert("No URL provided. Please enter a URL to shorten.");
        } else if (response.status === 403) {
            document.getElementById('shortenButton').disabled = false;
            return sendalert("Custom short URL contains profanity.");
        } else if (response.status === 404) {
            document.getElementById('shortenButton').disabled = false;
            return sendalert("Custom short URL already exists. Please choose another one.");
        } else if (response.status === 405) {
            document.getElementById('shortenButton').disabled = false;
            sendalert("Custom short URL contains invalid characters. Only letters and numbers are allowed.");
        } else if (response.status === 406) {
            document.getElementById('shortenButton').disabled = false;
            sendalert("Custom short URL is invalid and one of the current API routes. Please choose another one.");
        } else if (response.status === 500) {
            document.getElementById('shortenButton').disabled = false;
            sendalert("An error occurred on the server. Please try again later.");
        } else if (response.status === 200) {
            return data.message; // Return the short URL code
        }
    } catch (error) {
        console.error('An error occurred:', error);
        sendalert('An error occurred while shortening the URL.');
    } finally {
        document.getElementById('shortenButton').disabled = false;
    }
}

// Function to remove short URL
async function removeshorturl(shorturlcode, token, urlItem) {
    fetch("https://ewanc.dev/api/removeshorturl", {
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
                sendalert('An error occurred while deleting the short URL');
                document.getElementById('shortenButton').disabled = false;
                return console.log('An error occurred');
            }
        })
        .catch(error => {
            document.getElementById('shortenButton').disabled = false;
            return sendalert('An error occurred while deleting the short URL');
        })
        .finally(() => {
            console.log('Short URL deleted from database');
            urlItem.remove();
            console.log('Short URL deleted from UI');
        });
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
    sendalert('Please login to create or view your short URLs.')
    document.getElementById('alert-ok').addEventListener('click', function () {
        window.location.href = 'https://ewanc.dev/login';
    });
}

// Fetch user's short URLs
fetch('https://ewanc.dev/api/getshorturls', {
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
            if (!/^https?:\/\//i.test(url.redirecturl)) {
                var redirecturl = (`https://${url.redirecturl}`);
            } else {
                var redirecturl = url.redirecturl;
            }
            if (url.password) {
                lockedorunlocked = '🔒';
            }
            else{
                lockedorunlocked = '';
            }

            urlText.innerHTML = `
                ${lockedorunlocked}&nbsp;<a href="https://ewanc.dev/api/short/${url.shorturl}">ewanc.dev/api/short/${url.shorturl}</a>
                &nbsp;&nbsp;&gt;&gt;&nbsp;&nbsp;
                <a href="${redirecturl}">${url.redirecturl}</a>
                &nbsp;&nbsp;||&nbsp;&nbsp;<a href="https://ewanc.dev/shorturlanalytics?shorturl=${url.shorturl}">View Analytics</a>
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
                    sendalert('Could not extract the short URL code.');
                    return;
                }

                if (!localStorage.getItem('token')) {
                    sendalert('Please login to create or view your short URLs.');
                    document.getElementById('alert-ok').addEventListener('click', function () {
                        window.location.href = 'https://ewanc.dev/login';
                    });
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
            if (url) {
                // Make the short URL
                const shorturlcode = await addShortUrl(url, localStorage.getItem('token'), document.getElementById('shorturlcode').value, document.getElementById('password').value);
                const parentDiv = document.querySelector('.url-list');
                if (shorturlcode) {
                    const newDiv = document.createElement('div');
                    newDiv.className = 'url-item';
                    newDiv.setAttribute('data-id', currentID);
                    currentID++;
                    if (!/^https?:\/\//i.test(url)) {
                        urltouse = (`https://${url}`);
                    }
                    else {
                        urltouse = url;
                    }
                    
                    if (document.getElementById('password').value) {
                        lockedorunlocked = '🔒';
                    }
                    else{
                        lockedorunlocked = '';
                    };

                    const urlText = document.createElement('div');
                    urlText.className = 'url-text';
                    urlText.innerHTML = `
                        ${lockedorunlocked}&nbsp;<a href="https://ewanc.dev/api/short/${shorturlcode}">ewanc.dev/api/short/${shorturlcode}</a>
                        &nbsp;&nbsp;&gt;&gt;&nbsp;&nbsp;
                        <a href="${urltouse}">${url}</a>
                        &nbsp;&nbsp;||&nbsp;&nbsp;<a href="https://ewanc.dev/shorturlanalytics?shorturl=${shorturlcode}">View Analytics</a>
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
                            sendalert('Could not extract the short URL code.');
                            return;
                        }

                        if (!localStorage.getItem('token')) {
                            sendalert('Please login to create or view your short URLs.');
                            document.getElementById('alert-ok').addEventListener('click', function () {
                                window.location.href = 'https://ewanc.dev/login';
                            });
                        }
                        removeshorturl(shortUrlCode, localStorage.getItem('token'), urlItem);
                    });
                }
            }
            else {
                sendalert('Please enter a URL to shorten.');
                document.getElementById('shortenButton').disabled = false;
            }
        });
    })
    .catch(error => console.error(error));