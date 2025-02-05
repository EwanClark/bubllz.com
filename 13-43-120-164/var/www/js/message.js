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


document.getElementById('sendButton').addEventListener('click', sendMessage);

document.getElementById('messageInput').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
});

function logoutFunction() {
    localStorage.removeItem('token');
    sendalert('You have been logged out.');
    document.getElementById('alert-ok').addEventListener('click', function () {
        window.location.href = 'https://bubllz.com/login';
    });
}

let isPolling = false;

async function poll() {
    if (isPolling) return;
    isPolling = true;

    try {
        const response = await fetch('https://bubllz.com/api/poll');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();

        if (data.message) {
            // Display the received message
            const messagesDiv = document.getElementById('messageDisplayArea');
            const messageElement = document.createElement('div');
            messageElement.textContent = `${data.message.username}: ${data.message.message}`;
            messagesDiv.appendChild(messageElement);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        } else {
            console.error('Received unexpected or malformed message:', data);
        }
    } catch (error) {
        console.error('Polling error:', error);
    } finally {
        isPolling = false;
        setTimeout(poll, 100);
    }
}

async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();

    if (message === '') {
        sendalert('Please enter a message.');
        return;
    }

    messageInput.value = '';

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('https://bubllz.com/api/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'token': token
            },
            body: JSON.stringify({ message: message })
        });
        if (response.status === 401) {
            sendalert('You are not logged in. Please log in first.');
            window.location.href = 'https://bubllz.com/login/';
        } else if (response.status === 413) {
            sendalert('Message is too large.');
            return;
        } else if (response.status === 429) {
            sendalert('You are sending messages too quickly. Please wait a moment.');
            return;
        } else {
            // Optionally handle the response here if needed
            const data = await response.json();

            // Immediately poll to check for the message sent
            poll();
        }
    } catch (error) {
        console.error('Sending message error:', error);
    }
}

poll();
