// server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://itsnexverra_db_user:WfVZ3fnBr1lyuS5N@cluster0.ha2gdv2.mongodb.net/?appName=Cluster0';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Successfully connected to Nexverra MongoDB Database'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Schemas
const ProjectSchema = new mongoose.Schema({
  title: String,
  category: String,
  image: String,
  type: { type: String, enum: ['Template', 'Dashboard'], default: 'Template' },
  language: String,
  rating: Number,
  description: String,
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

const MessageSchema = new mongoose.Schema({
  senderName: String,
  senderEmail: String,
  senderPhone: String,
  senderAddress: String,
  subject: String,
  plan: String,
  body: String,
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ['unread', 'read', 'resolved'], default: 'unread' },
  type: { type: String, default: 'portal' },
  history: Array
}, { versionKey: false });

const Project = mongoose.model('Project', ProjectSchema);
const Message = mongoose.model('Message', MessageSchema);

// Serve frontend from dist folder
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// API Routes - Projects
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const project = new Project(req.body);
    const newProject = await project.save();
    res.status(201).json(newProject);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const deleted = await Project.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Project not found' });
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    const updated = await Project.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Project not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// API Routes - Messages
app.get('/api/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const msg = new Message(req.body);
    const saved = await msg.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.patch('/api/messages/:id', async (req, res) => {
  try {
    const updated = await Message.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// React Router support: serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Nexverra Backend API & Frontend active on http://localhost:${PORT}`);
});
