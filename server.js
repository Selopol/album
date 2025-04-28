const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

cloudinary.config({
  cloud_name: 'doeb360bh',
  api_key: '286616121887916',
  api_secret: 'tnF2f3HZ2D9bZ93q_bk232aJpEo'
});

const db = new sqlite3.Database('album.db');

// Create table if not exists
db.run('CREATE TABLE IF NOT EXISTS photos (id INTEGER PRIMARY KEY AUTOINCREMENT, url TEXT, name TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)');

// Set up multer storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(express.static('public'));

// Upload image and save to database
app.post('/upload', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  cloudinary.uploader.upload_stream(
    {
      resource_type: 'image',
      folder: 'album_images'
    },
    (error, result) => {
      if (error) {
        return res.status(500).send('Error uploading image to Cloudinary.');
      }

      // Insert image data into the database with timestamp
      db.run('INSERT INTO photos (url, name) VALUES (?, ?)', [result.secure_url, req.body.name], function(err) {
        if (err) {
          return res.status(500).send('Error saving image data to database.');
        }
        res.json({ url: result.secure_url });
      });
    }
  ).end(req.file.buffer);
});

// Get all images from the database, sorted by timestamp (newest first)
app.get('/photos', (req, res) => {
  db.all('SELECT * FROM photos ORDER BY timestamp DESC', (err, rows) => {
    if (err) {
      return res.status(500).send('Error fetching images from database.');
    }
    res.json(rows);
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});