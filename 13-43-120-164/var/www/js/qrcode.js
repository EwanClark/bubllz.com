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



document.getElementById('generate-btn').addEventListener('click', function () {
    const data = document.getElementById('data').value;
    if (!data) {
        return sendalert('Please enter some text to generate QR code.');
    }

    const qrDisplay = document.getElementById("qr-display");
    qrDisplay.innerHTML = "";

    const customWidth = 450;
    const customHeight = 450;

    const canvas = document.createElement("canvas");
    
    canvas.width = customWidth;
    canvas.height = customHeight;
    
    qrDisplay.appendChild(canvas);  // Add the canvas to the display

    // Generate QR code using QRCode.toCanvas()
    QRCode.toCanvas(canvas, data, { width: customWidth, height: customHeight}, function (error) {
        if (error) {
            sendalert(error)
            document.getElementById('download-btn').disabled = true;
            qrDisplay.innerHTML = `<p>Generated QR code will appear here.</p>`;
        } else {
            document.getElementById('download-btn').disabled = false;
        }
    });
});
document.getElementById('download-btn').disabled = true;

document.getElementById('download-btn').addEventListener('click', function () {
    const qrCanvas = document.querySelector("#qr-display canvas"); // Get the canvas element
    if (qrCanvas) {
        const dataURL = qrCanvas.toDataURL("image/png"); // Convert canvas to image
        const link = document.createElement("a");
        link.href = dataURL;
        link.download = "qrcode.png";
        link.click();
    } else {
        sendalert("Please generate a QR code first.");
    }
});

document.getElementById('payloads-btn').addEventListener('click', function () {
    window.location.href = "https://bubllz.com/qrcode/payloads";
});