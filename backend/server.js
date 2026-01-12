// server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

// ==========================
// App & Paths
// ==========================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;
const MONGODB_URI = process.env.MONGODB_URI;

// ==========================
// Middleware
// ==========================
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// ==========================
// MongoDB Schemas
// ==========================
const ProjectSchema = new mongoose.Schema(
  {
    title: String,
    category: String,
    image: String,
    type: {
      type: String,
      enum: ['Template', 'Dashboard'],
      default: 'Template'
    },
    language: String,
    rating: Number,
    description: String,
    createdAt: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

const MessageSchema = new mongoose.Schema(
  {
    senderName: String,
    senderEmail: String,
    senderPhone: String,
    senderAddress: String,
    subject: String,
    plan: String,
    body: String,
    timestamp: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['unread', 'read', 'resolved'],
      default: 'unread'
    },
    type: { type: String, default: 'portal' },
    history: Array
  },
  { versionKey: false }
);

const Project = mongoose.model('Project', ProjectSchema);
const Message = mongoose.model('Message', MessageSchema);

// ==========================
// Serve Frontend (React build)
// ==========================
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// ==========================
// API Routes - Projects
// ==========================
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error('Projects fetch error:', err.message);
    res.status(500).json({ message: 'Failed to fetch projects' });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const saved = await new Project(req.body).save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('Project save error:', err.message);
    res.status(400).json({ message: 'Failed to save project' });
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
    console.error('Project update error:', err.message);
    res.status(400).json({ message: 'Failed to update project' });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const deleted = await Project.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Project not found' });
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error('Project delete error:', err.message);
    res.status(500).json({ message: 'Failed to delete project' });
  }
});

// ==========================
// API Routes - Messages
// ==========================
app.get('/api/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: -1 });
    res.json(messages);
  } catch (err) {
    console.error('Messages fetch error:', err.message);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const saved = await new Message(req.body).save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('Message save error:', err.message);
    res.status(400).json({ message: 'Failed to save message' });
  }
});

app.patch('/api/messages/:id', async (req, res) => {
  try {
    const updated = await Message.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    console.error('Message update error:', err.message);
    res.status(400).json({ message: 'Failed to update message' });
  }
});

// ==========================
// React Router Fallback
// ==========================
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ==========================
// MongoDB Events (Debug)
// ==========================
mongoose.connection.on('connected', () =>
  console.log('🟢 MongoDB connected')
);

mongoose.connection.on('error', err =>
  console.error('🔴 MongoDB error:', err.message)
);

mongoose.connection.on('disconnected', () =>
  console.log('🟠 MongoDB disconnected')
);

// ==========================
// Start Server (STRICT MODE)
// ==========================
async function startServer() {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined');
    }

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000
    });

    console.log('✅ MongoDB connection successful');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error('❌ Server startup failed:', error.message);
    process.exit(1);
  }
}

startServer();
