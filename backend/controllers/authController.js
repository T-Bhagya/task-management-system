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
        const {email, password } = req.body;

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
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
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

exports.register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email, and password are required" });
        }

        // 1. Check if a user with this email already exists in the Neon DB
        const existingUser = await prisma.user.findUnique({
            where: { email: email }
        });

        if (existingUser) {
            return res.status(409).json({ message: "Email is already in use" });
        }

        // 2. Hash the password BEFORE saving it (Crucial for security!)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Create the new user in the Neon database
        const newUser = await prisma.user.create({
            data: {
                name: name,
                email: email,
                password_hash: hashedPassword,
                role: 'USER' // Default role for new signups
            }
        });

        // 4. Send success response (but don't send the password back!)
        return res.status(201).json({
            message: "User registered successfully!",
            user: {
                id: newUser.id,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        next(error);
    }
};