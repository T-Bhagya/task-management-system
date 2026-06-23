const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const prisma = require('../prismaClient');
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
        try {
            const tables = await prisma.$queryRaw`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema'`;
            console.log("TABLES IN DB:", tables);
        } catch (e) {
            console.log("FAILED TO QUERY TABLES", e);
        }
        
        console.log("USING DATABASE_URL:", process.env.DATABASE_URL);

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
            { expiresIn: '8h' } // Token automatically expires in 8 hours
        );

        // Send the token back to the frontend
        return res.status(200).json({
            message: "Login successful!",
            token: token, // Person 1 (Frontend) will save this token in the browser
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                must_reset_password: user.must_reset_password  // ← required for forced reset flow
            }
        });

    } catch (error) {
        next(error); // Sends any crash to your global error handler
    }
};

exports.register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

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

        // Map frontend role dropdown values to Prisma enum values
        let dbRole = 'COLLABORATOR';
        if (role) {
            const normalizedRole = role.trim().toLowerCase();
            if (normalizedRole === 'administrator' || normalizedRole === 'admin') {
                dbRole = 'ADMIN';
            } else if (normalizedRole === 'project manager' || normalizedRole === 'project_manager') {
                dbRole = 'PROJECT_MANAGER';
            } else if (normalizedRole === 'collaborator') {
                dbRole = 'COLLABORATOR';
            }
        }

        // 3. Create the new user in the Neon database
        const newUser = await prisma.user.create({
            data: {
                name: name,
                email: email,
                password_hash: hashedPassword,
                role: dbRole
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

exports.changePassword = async (req, res, next) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: "New password must be at least 6 characters long." });
        }

        const userId = req.user.id;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password and reset flag
        await prisma.user.update({
            where: { id: userId },
            data: {
                password_hash: hashedPassword,
                must_reset_password: false
            }
        });

        res.status(200).json({ message: "Password updated successfully!" });
    } catch (error) {
        next(error);
    }
};