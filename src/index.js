const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const userRoutes = require('./routes/user');
const serviceRoutes = require('./routes/service');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);

// Health check
app.get('/', (req, res) => res.send('API is running'));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
});
