const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const prisma = require('./prismaClient'); // Shared Prisma singleton used by all controllers
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const app = express();

// Load Swagger document
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

// Setup Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 1. Global Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? allowedOrigins : true,
    credentials: true
}));
app.use(express.json());

// Health check endpoint (used by Docker & Azure)
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 2. API Routes
const { verifyToken } = require('./middleware/authMiddleware');

app.get('/api/test', verifyToken, (req, res) => {
    res.status(200).json({ 
        message: "Backend is running beautifully!", 
        authenticatedUser: req.user
    });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));

// Serve static assets from frontend/dist in production
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// SPA Fallback: Serve index.html for any request that doesn't match an API route
app.get('*any', (req, res, next) => {
    if (req.path.startsWith('/api')) {
        return next();
    }
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

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
app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    try {
        await prisma.$connect();
        console.log('Database connected successfully via Prisma!');
    } catch (dbError) {
        console.error('Prisma failed to connect to the database:', dbError);
    }
});