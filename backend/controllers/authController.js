const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// --- NEW PRISMA 7 SETUP ---
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// 1. Create a connection pool using the Neon URL
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// 2. Wrap it in the Prisma Adapter
const adapter = new PrismaPg(pool);

// 3. Pass the adapter to the Prisma Client
const prisma = new PrismaClient({ adapter });
// 1. Fixed Mock Database
// Why: Using hashSync ensures Node automatically generates a mathematically perfect 
// bcrypt hash for "Password123" when the server starts up. No more hardcoded typos!


exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validation Check
        if (!email || !password) {
            return res.status(400).json({
                errorCode: "VALIDATION_ERROR",
                message: "Email and password are required"
            });
        }

        // Find the user
        const user = await prisma.user.findUnique({
            where: { email: email }
        });

        console.log("Prisma returned this user:", user);

        // Security Check: Use bcrypt to safely compare the plain text input with the stored hash
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({
                errorCode: "AUTH_FAILED",
                message: "Invalid email or password"
            });
        }

        // Why: If the password is correct, generate a signed JWT token.
        // We pack the user's ID and Role inside the token payload.
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // Token automatically expires in 1 hour for security
        );

        // Send the token back to the frontend
        return res.status(200).json({
            message: "Login successful!",
            token: token, // Person 1 (Frontend) will save this token in the browser
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        next(error); // Sends any crash to your global error handler
    }
};