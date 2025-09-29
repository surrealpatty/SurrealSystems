require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path'); 
const { sequelize, testConnection } = require('./models/database');
const {
  register,
  login,
  getProfile,
  updateProfile,
  upgradeToPaid
} = require('./controllers/userController');

const app = express();
const PORT = process.env.PORT || 10000;

// ---------- Middleware ----------
app.use(cors());
app.use(express.json());

// ---------- API Routes ----------
// Make sure these come FIRST
app.post('/register', register);
app.post('/login', login);
app.get('/profile/:id?', getProfile);
app.put('/profile', updateProfile);
app.post('/upgrade', upgradeToPaid);

// ---------- Serve Frontend ----------
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ---------- Start Server ----------
(async () => {
  try {
    await testConnection();
    await sequelize.sync();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Server failed to start:', err);
    process.exit(1);
  }
})();
