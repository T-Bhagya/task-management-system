const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const app = express();
const cors = require('cors');

// 1. Global Middleware
app.use(cors());
app.use(express.json());

// 2. API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));

// 3. Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    res.status(err.status || 500).json({
        errorCode: err.name || 'ServerError',
        message: err.message || 'Something went wrong on the server',
        details: err.details || null
    });
});

// 4. Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});