const express = require('express');
const { exec } = require('child_process');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const { GridFSBucket } = require('mongodb');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const { sendMail } = require('./util/mailer.js');
require('dotenv').config();
const bodyParser = require('body-parser'); // Added body-parser
const app = express();


// Middleware
const corsOptions = {
  origin: 'https://techhubfrontend.onrender.com', // Updated to frontend's URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'], // Include any headers you might send .
  credentials: true, // Enable credentials if needed
};

// Use CORS middleware
app.use(cors(corsOptions));

// Handle pre-flight requests
app.options('*', cors(corsOptions)); // Enable pre-flight across-the-board

// Body parser middleware
app.use(bodyParser.json()); // Use bodyParser.json()

app.use('/auth', authRoutes); // Authentication routes


const candidateRoutes = require("./routes/candidates");
app.use("/candidates", candidateRoutes);
// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'your_default_mongo_uri';
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((error) => console.error('Error connecting to MongoDB Atlas:', error));

const connection = mongoose.connection;
let gridFSBucket;
connection.once('open', () => {
  gridFSBucket = new GridFSBucket(connection.db, {
    bucketName: 'uploads'
  });
  console.log('GridFSBucket initialized');
});

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Candidate schema
const candidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  location: { type: String, required: true },
  comments: { type: String },
  employeeCode: { type: String, required: true },
  fileId: { type: mongoose.Schema.Types.ObjectId, required: false },
  fileName: { type: String, required: false }
});
const Candidate = mongoose.model('Candidate', candidateSchema);

// Endpoint to run the Python script with the LinkedIn URL
app.get('/api/data', (req, res) => {
  const linkedinUrl = req.query.linkedin_url;

  if (!linkedinUrl) {
      return res.status(400).send('LinkedIn URL is required.');
  }

  // Adjust the path to point to the Python script in the 'scripts' folder
  const scriptPath = path.join(__dirname, 'scripts', 'script.py');

  const command = `python "${scriptPath}" "${linkedinUrl}"`;

  exec(command, (error, stdout, stderr) => {
      if (error) {
          console.error(`exec error: ${error}`);
          return res.status(500).send('Error executing Python script');
      }
      try {
          const data = JSON.parse(stdout);
          res.json(data);
      } catch (jsonError) {
          console.error('Error parsing JSON:', jsonError);
          res.status(500).send('Error parsing JSON output');
      }
  });
});

// Send email route
app.post('/send-email', async (req, res) => {
  try {
    const info = await sendMail(); // Capture the info returned by sendMail
    console.log('Email sent successfully:', info); // Log the info for debugging
    res.status(200).json({ message: 'Email sent successfully', info }); // Send back info
  } catch (error) {
    console.error('Error sending email:', error); // Improved logging for errors
    res.status(500).json({ message: 'Error sending email', error: error.message }); // Send meaningful error response
  }
});

// File upload and candidate creation
app.post('/upload', upload.single('cv'), async (req, res) => {
  try {
    console.log('File received:', req.file);
    const { name, type, location, comments, employeeCode } = req.body;
    if (!name || !type || !location || !employeeCode) {
      return res.status(400).json({ message: 'All fields except the CV are required.' });
    }
    let fileId = null;
    let fileName = null;
    if (req.file) {
      const uploadStream = gridFSBucket.openUploadStream(req.file.originalname);
      fileId = await new Promise((resolve, reject) => {
        uploadStream.on('error', (error) => {
          console.error('Error uploading file to GridFS:', error);
          reject(new Error('Error uploading file: ' + error.message));
        });
        uploadStream.on('finish', () => {
          console.log('File uploaded successfully:', uploadStream.id);
          resolve(uploadStream.id);
        });
        uploadStream.end(req.file.buffer);
      });
      fileName = req.file.originalname;
    }
    const newCandidate = new Candidate({
      name,
      type,
      location,
      comments,
      employeeCode,
      fileId,
      fileName
    });

    await newCandidate.save();
    res.status(201).json({ message: 'Candidate created successfully', candidate: newCandidate });
  } catch (error) {
    console.error('Error creating candidate:', error);
    res.status(500).json({ message: 'Error creating candidate', error: error.message });
  }
});

// Route for downloading CV
app.get('/api/candidates/download/:id', async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate || !candidate.fileId) {
      return res.status(404).json({ message: 'CV not available' });
    }
    const fileId = new mongoose.Types.ObjectId(candidate.fileId);
    gridFSBucket.openDownloadStream(fileId)
      .on('error', () => res.status(404).json({ message: 'File not found' }))
      .pipe(res);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ message: 'Error downloading file' });
  }
});

// Ruta para buscar candidatos
app.get('/api/candidates', async (req, res) => {
  const { location, employeeCode } = req.query;
  try {
    let searchCriteria = {};
    if (location) {
      searchCriteria.location = { $regex: new RegExp(location, 'i') }; // Case-insensitive search
    }
    if (employeeCode) {
      searchCriteria.employeeCode = employeeCode;
    }
    const candidates = await Candidate.find(searchCriteria);
    res.status(200).json(candidates);
  } catch (error) {
    console.error('Error al buscar candidatos:', error);
    res.status(500).json({ message: 'Error al buscar candidatos' });
  }
});

// Route to get detailed information about a candidate
app.get('/api/candidates/:id', async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    res.json(candidate); // Return the full candidate object
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching candidate" });
  }
});

const uploadEdit = multer({ storage });
app.put('/api/candidates/:id', uploadEdit.single('cv'), async (req, res) => {
  const { id } = req.params;
  const { name, type, location, comments, employeeCode } = req.body;

  try {
    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    let fileId = candidate.fileId;
    let fileName = candidate.fileName;

    // Si llega un nuevo archivo
    if (req.file) {
      console.log('Nuevo CV recibido:', req.file.originalname);

      // Eliminar el archivo anterior si existía
      if (candidate.fileId) {
        try {
          await gridFSBucket.delete(new mongoose.Types.ObjectId(candidate.fileId));
          console.log('CV anterior eliminado de GridFS:', candidate.fileId);
        } catch (fileError) {
          console.warn('Error eliminando CV anterior:', fileError.message);
        }
      }

      // Subir nuevo CV
      const uploadStream = gridFSBucket.openUploadStream(req.file.originalname);
      fileId = await new Promise((resolve, reject) => {
        uploadStream.on('error', reject);
        uploadStream.on('finish', () => resolve(uploadStream.id));
        uploadStream.end(req.file.buffer);
      });
      fileName = req.file.originalname;
    }

    // Crear objeto de actualización
    const updateData = {
      name,
      type,
      location,
      comments,
      employeeCode,
      fileId,
      fileName,
    };

    const updatedCandidate = await Candidate.findByIdAndUpdate(id, updateData, { new: true });
    res.json(updatedCandidate);
  } catch (error) {
    console.error('Error updating candidate:', error);
    res.status(500).json({ message: 'Error updating candidate', error: error.message });
  }
});


// Delete candidate
app.delete('/api/candidates/:id', async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    // Si el candidato tiene un archivo, eliminarlo de GridFS
    if (candidate.fileId) {
      try {
        await gridFSBucket.delete(new mongoose.Types.ObjectId(candidate.fileId));
        console.log('CV eliminado de GridFS:', candidate.fileId);
      } catch (fileError) {
        console.warn('Error al eliminar CV de GridFS (continuando de todas formas):', fileError.message);
      }
    }

    await Candidate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Candidate deleted successfully' });
  } catch (error) {
    console.error('Error deleting candidate:', error);
    res.status(500).json({ message: 'Error deleting candidate', error: error.message });
  }
});


// Start the server (Ensure only one app.listen exists)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
