document.getElementById('sendButton').addEventListener('click', sendMessage);

document.getElementById('messageInput').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
});

function logoutFunction() {
    localStorage.removeItem('token');
    alert('You have been logged out.');
    window.location.href = 'https://bubllz.com/login/';
}

let isPolling = false;

async function poll() {
    console.log('Polling started');
    if (isPolling) return;
    isPolling = true;

    try {
        const response = await fetch('https://api.bubllz.com/poll');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Received data:', data);

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
        console.log('Polling finished');
        setTimeout(poll, 100);
    }
}

async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();

    if (message === '') {
        alert('Please enter a message.');
        return;
    }

    messageInput.value = '';

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('https://api.bubllz.com/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'token': token
            },
            body: JSON.stringify({ message: message })
        });
        if (response.status === 401) {
            alert('You are not logged in. Please log in first.');
            window.location.href = 'https://bubllz.com/login/';
        } else if (response.status === 413) {
            alert('Message is too large.');
            return;
        } else {
            // Optionally handle the response here if needed
            const data = await response.json();
            console.log('Message sent:', data.message);

            // Immediately poll to check for the message sent
            poll();
        }
    } catch (error) {
        console.error('Sending message error:', error);
    }
}

poll();
