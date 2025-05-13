const express = require('express');
const app = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');


// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, '../Public/imagedata');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // Save images to the "uploads" directory
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); // Generate unique filename
    }
});

const upload = multer({ storage: storage });

// Route to handle image upload
app.post('/content/uploadimage', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No image file uploaded" });
        }

        const imageUrl = `/imagedata/${req.file.filename}`; // URL to access the uploaded image

        res.json({ success: true, url: imageUrl });
    } catch (error) {
        console.error("Image upload error:", error);
        res.status(500).json({ error: "Image upload failed" });
    }
});

module.exports = app;
