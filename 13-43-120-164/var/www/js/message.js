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

const messageDisplay = document.getElementById('messageDisplayArea');
const userListDisplay = document.getElementById('userList').querySelector('.users-container');
const nicknameInput = document.getElementById('nicknameInput');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const connectButton = document.getElementById('connectButton')
let ws = null;
let username = null;
let done = false;
connectButton.disabled = false;

function initializeWebSocket(username) {
    if (ws) {
        ws.close();
    }

    ws = new WebSocket('wss://ewanc.dev/api/messagewss');

    ws.onopen = () => {
        if (!done) {
            sendalert('Connected to chat server!');
            done = true;
        } else {
            sendalert('Reconnected to chat server!');
        }
        messageInput.disabled = false;
        sendButton.disabled = false;
        ws.send(JSON.stringify({ username: username }));

    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'error') {
            sendalert(data.message);
            if (data.message.includes('Username')) {
                username = null;
            }
        } else if (data.type === 'message') {
            displayMessage(data.message.username, data.message.message);
        } else if (data.type === 'userList') {
            updateUserList(data.users);
        }
    };

    ws.onclose = () => {
        messageInput.disabled = true;
        sendButton.disabled = true;
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        sendalert('Connection error. Please try again.');
    };
}

function displayMessage(username, message) {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = `${username}: ${message}`;
    messageDisplay.appendChild(messageDiv);
    messageDisplay.scrollTop = messageDisplay.scrollHeight;
}

function updateUserList(users) {
    userListDisplay.innerHTML = '';
    document.querySelector('.online-count').textContent = `${users.length} online`;
    
    users.forEach(user => {
        const userDiv = document.createElement('div');
        userDiv.textContent = user;
        userListDisplay.appendChild(userDiv);
    });
}

function sendMessage() {
    const message = messageInput.value.trim();

    if (!message || !ws || ws.readyState !== WebSocket.OPEN) {
        return;
    }

    ws.send(JSON.stringify({
        type: 'message',
        message: message
    }));

    messageInput.value = '';
}

function connectToChat() {
    const newUsername = nicknameInput.value.trim();
    if (newUsername) {
        messageInput.disabled = false;
        sendButton.disabled = false;
        username = newUsername;
        initializeWebSocket(newUsername);
    } else {
        sendalert('Please enter a valid username.');
    }
}

// Event listeners
sendButton.addEventListener('click', sendMessage);
connectButton.addEventListener('click', connectToChat);

messageInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
});

nicknameInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        connectToChat();
    }
});

// Initial setup
sendalert('Enter a username to start chatting.');