import express from "express";
import cors from "cors";
import mysql from "mysql2";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import dotenv from "dotenv";
import axios from 'axios';
import readline from 'readline';
import fs from 'fs';
import moment from 'moment';
import http from 'http';

const app = express();
dotenv.config({ path: '~/.env' });
const port = 4000;
const ip = process.env.IP;
const server = http.createServer(app);

// Rate limiter middleware
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 200,
    message: "Too many requests from this IP, please try again after 1 minute",
});

app.set("trust proxy", 1);
app.use(
    cors({
        origin: "https://bubllz.com",
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type", "Authorization", "token", "shorturl"],
    })
);


app.use(express.json());
app.use(limiter);
let messages = [];
let clientpoll = [];
let hatewords = [];
let connection;
let codocsdocument = ""
const unknownroutepage = fs.readFileSync('./api404.html', 'utf8');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let settings = {
    shorturlfilter: true
};

function loadSettings() {
    try {
        if (fs.existsSync('./settings.txt')) {
            console.log('Loading settings from settings.txt file.');
            const data = fs.readFileSync('./settings.txt', 'utf8');
            const lines = data.split('\n');
            lines.forEach((line) => {
                const [key, value] = line.split('=');
                if (key === 'shorturlfilter') {
                    settings.shorturlfilter = value === 'true';
                    console.log(`Short URL filter set to: ${settings.shorturlfilter}`);
                }
            });
        } else {
            console.log('settings.txt file not found, creating with defaults.');
            fs.writeFileSync('./settings.txt', 'shorturlfilter=true');
            settings.shorturlfilter = true;
        }

        // Load hate words
        if (fs.existsSync('./filter.txt')) {
            hatewords = getHateWordsFromFile('./filter.txt');
            console.log('Hate words loaded successfully.');
        } else {
            console.log('filter.txt not found, creating with examples.');
            fs.writeFileSync('./filter.txt', 'exampleword1\nexampleword2\nexampleword3\n');
            hatewords = ['exampleword1', 'exampleword2', 'exampleword3'];
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

function handleDisconnect() {
    connection = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        port: process.env.DB_PORT,
    });

    connection.connect((err) => {
        if (err) {
            console.error("Error connecting to database:", err);
            setTimeout(handleDisconnect, 2000); // Reconnect after 2 seconds
        } else {
            console.log("Connected to database");
        }
    });

    connection.on("error", (err) => {
        console.error("Database error:", err);
        setTimeout(handleDisconnect, 1000);
    });
}

function getHateWordsFromFile(filePath) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        return fileContent.split('\n').map(word => word.trim()).filter(Boolean); // Removes empty lines
    } catch (error) {
        console.error('Error reading file:', error);
        return [];
    }
}

function isHateSpeech(text, hateWords) {
    const lowerCaseText = text.toLowerCase();
    return hateWords.some(hateWord => lowerCaseText.includes(hateWord.toLowerCase()));

}
// Handle the command input
rl.on('line', (input) => {
    const args = input.trim().split(/\s+/);
    const command = args[0].toLowerCase();
    const value = args[1]?.toLowerCase();

    handleCommand(command, value);
});

function handleCommand(command, value) {
    switch (command) {
        case 'shorturlfilter':
            handleShortUrlFilter(value);
            break;
        case 'help':
            showHelp();
            break;
        case 'exit':
            console.log('Exiting the application.');
            process.exit(0);
        case 'getcodoc':
            console.log('Current codoc document:');
            console.log(codocsdocument);
            break;
        case '':
            break;
        default:
            console.log('Unknown command, type "help" for more information.');
    }
}

function handleShortUrlFilter(value) {
    switch (value) {
        case 'true':
        case 'false':
            settings.shorturlfilter = value === 'true';
            fs.writeFileSync('./settings.txt', `shorturlfilter=${settings.shorturlfilter}`);
            console.log(`Custom short url filter set to: ${settings.shorturlfilter}`);
            break;
        case 'status':
            console.log(`Short URL filter is currently set to: ${settings.shorturlfilter}`);
            break;
        case 'reload':
            loadSettings();
            break;
        default:
            console.log('Invalid arguments. Type "help" for more information.');
    }
}

function showHelp() {
    console.log('Commands:');
    console.log('shorturlfilter <true/false/status/reload> - Set short url filter to true or false.');
    console.log('getcodoc - Display the current codoc document.');
    console.log('help - Display this help message.');
    console.log('exit - Exit the application.');
}

handleDisconnect();


app.get("/api/short/:shorturl", (req, res, next) => {
    const { shorturl } = req.params;
    connection.query(
        `SELECT * FROM shorturls WHERE shorturl = ?`,
        [shorturl],
        (err, results) => {
            if (err) {
                console.error("Database query error:", err.stack);
                return res.status(500).json({ error: "Database error" });
            }
            if (results.length === 0) {
                return res.status(404).json({ error: "Short URL not found" });
            } else {
                // get ip user agent referrer location.
                const referrer = results[0].redirecturl;
                res.redirect(referrer);
                const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
                axios.get(`https://ipinfo.io/${clientIp}?token=${process.env.IPLOCATER_TOKEN}`)
                    .then((response) => {
                        const userAgent = req.headers['user-agent'];
                        const isp = response.data.org;
                        const city = response.data.city;
                        const region = response.data.region;
                        const country = response.data.country;
                        const currentTime = moment.utc().format('YYYY-MM-DD HH:mm:ss');
                        connection.query("INSERT INTO shorturlanalytics (shorturl, timestamp, ip, useragent, referrer, isp, city, region, country) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                            [shorturl, currentTime, clientIp, userAgent, referrer, isp, city, region, country], (err) => {
                                if (err) {
                                    console.error("Error inserting into shorturlanalytics:", err.stack);
                                }
                            }
                        );
                    })
                    .catch((error) => {
                        console.error("Error fetching IP info:", error.stack);
                    });
            }
        }
    );
});

app.get("/api/shorturlanalytics", (req, res) => {
    const shorturl = req.headers.shorturl;
    if (!shorturl) {
        return res.status(400).json({ error: "Short URL is required." });
    }

    connection.query(
        `SELECT * FROM shorturlanalytics WHERE shorturl = ?`,
        [shorturl],
        (err, results) => {
            if (err) {
                console.error("Database query error:", err.stack);
                return res.status(500).json({ error: "Database error" });
            }
            if (results.length === 0) {
                connection.query(
                    `SELECT * FROM shorturls WHERE shorturl = ?`,
                    [shorturl],
                    (err, results) => {
                        if (err) {
                            console.error("Database query error:", err.stack);
                            return res.status(500).json({ error: "Database error" });
                        }
                        if (results.length === 0) {
                            return res.status(404).json({ error: "Short URL not found" });
                        } else {
                            return res.status(201).json({ message: "No analytics found for this short URL" });
                        }
                    }
                );
            } else {
                return res.status(200).json({ analytics: results });
            }
        }
    );
});

app.post("/api/signup", async (req, res) => {
    const userData = req.body;
    if (!userData || !userData.FirstName || !userData.LastName || !userData.Username || !userData.Password) {
        return res.status(400).json({ error: "First name, last name, username, and password are required." });
    }
    try {
        // Hash the password before storing it
        const hashedPassword = await bcrypt.hash(userData.Password, 10);

        // Check database for existing username
        connection.query(
            "SELECT * FROM Users WHERE Username = ?",
            [userData.Username],
            (err, results) => {
                if (err) {
                    console.error("Error executing query:", err.stack);
                    return res.status(500).json({ error: "Database error" });
                }
                if (results.length > 0) {
                    return res.status(400).json({ error: "Username already exists" });
                } else {
                    // Username does not exist, proceed with insertion
                    const token = crypto.randomBytes(64).toString("hex");
                    connection.query(
                        "INSERT INTO Users (FirstName, LastName, Username, Password, token) VALUES (?, ?, ?, ?, ?)",
                        [
                            userData.FirstName,
                            userData.LastName,
                            userData.Username,
                            hashedPassword,
                            token,
                        ],
                        (err, results) => {
                            if (err) {
                                console.error("Error executing query:", err.stack);
                                return res.status(500).json({ error: "Database error" });
                            }
                            res.json({ message: token });
                        }
                    );
                }
            }
        );
    } catch (err) {
        console.error("Error hashing password:", err.stack);
        return res.status(500).json({ error: "Server error" });
    }
});

app.post("/api/login", (req, res) => {
    const userData = req.body;
    if (!userData || !userData.Username || !userData.Password) {
        return res.status(400).json({ error: "Username and password are required." });
    }

    connection.query(
        "SELECT * FROM Users WHERE Username = ?",
        [userData.Username],
        (err, results) => {
            if (err) {
                console.error("Error executing query:", err.stack);
                return res.status(500).json({ error: "Database error" });
            }
            if (results.length === 0) {
                return res.status(401).json({ error: "Invalid username or password." });
            }

            const storedHash = results[0].Password;
            const token = results[0].token;

            // Compare the provided password with the hashed password in the database
            bcrypt.compare(userData.Password, storedHash, (err, isMatch) => {
                if (err) {
                    console.error("Error comparing passwords:", err.stack);
                    return res.status(500).json({ error: "Server error" });
                }
                if (!isMatch) {
                    return res
                        .status(401)
                        .json({ error: "Invalid username or password." });
                }
                res.json({ message: `${token}` });
            });
        }
    );
});

app.post("/api/message", (req, res) => {
    const messageData = req.body.message;
    const token = req.headers.token;
    if (!token) {
        return res.status(400).json({ error: "Token is required." });
    }
    if (!messageData) {
        return res.status(402).json({ error: "Message is required." });
    }

    console.log("Received token:", token);
    console.log("Received message:", messageData);

    connection.query(
        "SELECT * FROM Users WHERE token = ?",
        [token],
        (err, results) => {
            if (err) {
                console.error("Database query error:", err.stack);
                return res.status(500).json({ error: "Database error" });
            }
            if (results.length === 0) {
                return res
                    .status(401)
                    .json({ error: "Invalid token or session expired." });
            }
            const username = results[0].Username;

            const fullMessage = { username, message: messageData };
            console.log("Sending message to clients:", fullMessage);

            // Respond to the sender immediately
            res.status(200).json({ message: fullMessage });

            // Broadcast the message to all other connected clients
            clientpoll.forEach((client) => {
                if (!client.res.finished) {
                    client.res.json({ message: fullMessage });
                }
            });

            // Clear the clients array after broadcasting
            clientpoll = [];
        }
    );
});

app.get("/api/poll", (req, res) => {
    if (messages.length > 0) {
        res.json({ message: messages.shift() });
    } else {
        clientpoll.push({ req, res });
    }
});

app.get('/api/validurl', async (req, res) => {
    // Check if the URL query parameter is present
    if (!req.query.url) {
        return res.status(400).json({ Error: "URL parameter is missing" });
    }

    const url = decodeURIComponent(req.query.url); // Decode the URL parameter
    try {
        // Check if the URL exists
        const response = await axios.get(url);
        if (response.status === 200) {
            return res.status(200).json({ message: 'URL exists' });
        }
    } catch (error) {
        if (error.message.includes("ENOTFOUND")) {
            return res.status(404).json({ message: error.message });
        }
        else {
            return res.status(200).json({ message: 'URL exists' + error.message });
        }
    }
});

app.post("/api/addshorturl", (req, res) => {
    const userData = req.body;
    const token = req.headers.token;

    if (!token) {
        return res.status(400).json({ error: "Token is required." });
    }
    if (!userData.redirecturl) {
        return res.status(402).json({ error: "Redirect URL is required." });
    }
    const redirecturl = userData.redirecturl;

    connection.query("SELECT * FROM Users WHERE token = ?", [token], (err, results) => {
        if (err) {
            console.error("Database query error:", err.stack);
            return res.status(500).json({ error: "Database error" });
        }
        if (results.length === 0) {
            return res.status(401).json({ error: "Invalid token or session expired." });
        }

        if (userData.customshorturlcode) {
            const customshorturl = userData.customshorturlcode;
            if (settings.shorturlfilter && isHateSpeech(customshorturl, hatewords)) {
                return res.status(403).json({ error: "Short URL contains profanity." });
            }
            else if (!/^[a-zA-Z0-9]+$/.test(customshorturl)) {
                return res.status(405).json({ error: "Short URL contains invalid characters." });
            }

            connection.query(`SELECT * FROM shorturls WHERE shorturl = ?`, [customshorturl], (err, results) => {
                if (err) {
                    console.error("Database query error:", err.stack);
                    return res.status(500).json({ error: "Database error" });
                }
                if (results.length > 0) {
                    return res.status(404).json({ error: "Short URL already exists." });
                }

                connection.query(
                    `INSERT INTO shorturls (redirecturl, shorturl, token) VALUES (?, ?, ?)`,
                    [redirecturl, customshorturl, token],
                    (err) => {
                        if (err) {
                            console.error("Database insertion error:", err.stack);
                            return res.status(500).json({ error: "Database error" });
                        }
                        res.status(200).json({ message: customshorturl });
                    }
                );
            });
        } else {
            const userid = results[0].ID;
            const newshorturl = userid + crypto.randomBytes(2).toString("hex");
            connection.query(
                `INSERT INTO shorturls (redirecturl, shorturl, token) VALUES (?, ?, ?)`,
                [redirecturl, newshorturl, token],
                (err) => {
                    if (err) {
                        console.error("Database insertion error:", err.stack);
                        return res.status(500).json({ error: "Database error" });
                    }
                    res.status(200).json({ message: newshorturl });
                }
            );
        }
    });
});

app.post("/api/removeshorturl", (req, res) => {
    // check token
    const token = req.headers.token;
    // check the short url because they will be unique
    const shorturlremove = req.body.shorturl;
    if (!shorturlremove) {
        return res.status(400).json({ error: "Short URL is required." });
    }
    if (!token) {
        return res.status(400).json({ error: "Token is required." });
    }

    // Check all the tokens urls
    connection.query(
        `SELECT * FROM shorturls WHERE token = ? AND shorturl = ?`,
        [token, shorturlremove],
        (err, results) => {
            if (err) {
                console.error("Database query error:", err.stack);
                return res.status(500).json({ error: "Database error" });
            } else if (results.length === 0) {
                return res.status(404).json({
                    error: "You dont have any short urls or it doesnt belong to you.",
                });
            } else {
                connection.query(
                    `DELETE FROM shorturls WHERE shorturl = ?`,
                    [shorturlremove],
                    (err, results) => {
                        if (err) {
                            console.error("Database query error:", err.stack);
                            return res.status(500).json({ error: "Database error" });
                        }
                    }
                );
                connection.query(`DELETE FROM shorturlanalytics WHERE shorturl = ?`,
                    [shorturlremove],
                    (err) => {
                        if (err) {
                            console.error("Error deleting shorturlanalytics:", err.stack);
                        }
                        else {
                            return res.status(200).json({ message: "Short url and analytics removed." });
                        }
                    });
            }
        }
    );
});

app.get("/api/getshorturls", (req, res) => {
    // check token
    const token = req.headers.token;
    if (!token) {
        return res.status(400).json({ error: "Token is required." });
    }
    // get all short urls of the user with that token
    connection.query(
        `SELECT id, redirecturl, shorturl FROM shorturls WHERE token = ?`,
        [token],
        (err, results) => {
            if (err) {
                console.error("Database query error:", err.stack);
                return res.status(500).json({ error: "Database error" });
            } else {
                res.status(200).json({ message: results });
            }
        }
    );
});

// Fallback route for non-existing routes
app.use("*", (req, res) => {
    res.status(404).send(unknownroutepage);
});

// Update server startup
server.listen(port, ip, () => {
    loadSettings();
    console.log(`API listening at port: ${port} on: ${ip}`);
    console.log("Type 'help' for a list of commands.");
    console.log("-----------------------------------------");
});