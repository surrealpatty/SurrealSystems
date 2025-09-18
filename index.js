require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./config/database');

// Import models
require('./models/User');
require('./models/Service');
require('./models/Message');

// Import routes
const userRoutes = require('./routes/user');
const serviceRoutes = require('./routes/service');
const messageRoutes = require('./routes/message'); // ✅ make sure the filename matches

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/users', userRoutes);
app.use('/services', serviceRoutes);
app.use('/messages', messageRoutes);

// Serve HTML pages
app.get(['/index.html', '/signup.html', '/profile.html', '/services.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'public', req.path));
});

// Catch-all API 404
app.use((req, res, next) => {
    if (req.path.startsWith('/users') || req.path.startsWith('/services') || req.path.startsWith('/messages')) {
        return res.status(404).json({ error: 'API route not found' });
    }
    next();
});

// Start server after syncing database
sequelize.sync({ alter: true })
    .then(() => {
        console.log(`✅ DB synced`);
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ DB sync failed', err);
        process.exit(1);
    });
