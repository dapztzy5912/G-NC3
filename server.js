import express from 'express';
import multer from 'multer';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;

// Path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Public
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer config
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (_, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Route: Upload and process
app.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

  const localPath = req.file.path;
  const imageUrl = `https://fastmanager.fasturl.cloud/api/upload`;

  try {
    // Upload to FastURL
    const formData = new FormData();
    formData.append('file', fs.createReadStream(localPath));

    const uploadRes = await fetch(imageUrl, {
      method: 'POST',
      body: formData
    });

    const uploadData = await uploadRes.json();
    const uploadedImageUrl = uploadData.url;

    // Call Anime API
    const animeApi = `https://fastrestapis.fasturl.cloud/aiimage/toanime?imageUrl=${encodeURIComponent(uploadedImageUrl)}&gender=${req.body.gender}&specificPrompt=Elegant%20and%20majestic`;

    const animeRes = await fetch(animeApi);
    const animeData = await animeRes.json();

    res.json({ output_url: animeData.output_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process image' });
  } finally {
    // Clean up uploaded file
    fs.unlinkSync(localPath);
  }
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
