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

// Get message display area
const messageDisplay = document.getElementById('messageDisplayArea');

// Initialize WebSocket connection
const ws = new WebSocket('wss://bubllz.com/api');
if (localStorage.getItem('username')) {
    document.getElementById('nicknameInput').value = localStorage.getItem('username');
    username = localStorage.getItem('username');
}
else {
    let username = '';
}

ws.onopen = () => {
    console.log('Connected to chat server');
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.error) {
        sendalert(data.error);
    } else if (data.message) {
        displayMessage(data.message.username, data.message.message);
    }
};

function displayMessage(username, message) {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = `${username}: ${message}`;
    messageDisplay.appendChild(messageDiv);
    // Auto scroll to bottom
    messageDisplay.scrollTop = messageDisplay.scrollHeight;
}

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();

    if (!message) {
        return; // Don't send empty messages
    }

    ws.send(JSON.stringify({
        username: username,
        message: message
    }));

    // Clear input after sending
    messageInput.value = '';
}

// Event listeners
document.getElementById('sendButton').addEventListener('click', sendMessage);

document.getElementById('messageInput').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
});

document.getElementById('nicknameInput').addEventListener('input', function() {
    localStorage.setItem('username', document.getElementById('nicknameInput').value);
    username = document.getElementById('nicknameInput').value;
});