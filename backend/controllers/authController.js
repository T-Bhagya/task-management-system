const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const prisma = require('../prismaClient');
const { sendVerificationCodeEmail } = require('../utils/emailService');

const validatePassword = (password) => {
    if (!password || password.length < 8) {
        return "Password must be at least 8 characters long.";
    }
    if (!/[A-Z]/.test(password)) {
        return "Password must contain at least one uppercase letter.";
    }
    if (!/[a-z]/.test(password)) {
        return "Password must contain at least one lowercase letter.";
    }
    if (!/\d/.test(password)) {
        return "Password must contain at least one number.";
    }
    if (!/[@$!%*?&#]/.test(password)) {
        return "Password must contain at least one special character (@$!%*?&#).";
    }
    return null;
};


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

        // Check active status
        if (!user.is_active) {
            return res.status(403).json({
                errorCode: "ACCOUNT_DEACTIVATED",
                message: "Your account has been deactivated. Please contact an administrator."
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

        const passwordError = validatePassword(password);
        if (passwordError) {
            return res.status(400).json({ message: passwordError });
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
        const { newPassword, name } = req.body;
        if (!newPassword) {
            return res.status(400).json({ message: "New password is required." });
        }
        const passwordError = validatePassword(newPassword);
        if (passwordError) {
            return res.status(400).json({ message: passwordError });
        }

        const userId = req.user.id;
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Only enforce the once-a-month restriction if the user is not in a forced reset flow
        if (!user.must_reset_password && user.password_last_changed) {
            const lastChanged = new Date(user.password_last_changed);
            const nextAllowedDate = new Date(lastChanged);
            nextAllowedDate.setDate(nextAllowedDate.getDate() + 30);
            const now = new Date();
            if (now < nextAllowedDate) {
                const diffTime = Math.abs(nextAllowedDate - now);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return res.status(400).json({
                    message: `Password can only be changed once a month. You can change it again in ${diffDays} day(s).`
                });
            }
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password, reset flag, and set last changed timestamp
        const updateData = {
            password_hash: hashedPassword,
            must_reset_password: false,
            password_last_changed: new Date()
        };
        if (name) {
            updateData.name = name;
        }

        await prisma.user.update({
            where: { id: userId },
            data: updateData
        });

        res.status(200).json({ message: "Password updated successfully!" });
    } catch (error) {
        next(error);
    }
};

exports.forgotPasswordVerify = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await prisma.user.findUnique({
            where: { email: email }
        });

        if (!user) {
            return res.status(404).json({ message: "Email is not registered." });
        }

        // Only enforce the once-a-month restriction if must_reset_password is false
        if (!user.must_reset_password && user.password_last_changed) {
            const lastChanged = new Date(user.password_last_changed);
            const nextAllowedDate = new Date(lastChanged);
            nextAllowedDate.setDate(nextAllowedDate.getDate() + 30);
            const now = new Date();
            if (now < nextAllowedDate) {
                const diffTime = Math.abs(nextAllowedDate - now);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return res.status(400).json({
                    message: `Password can only be changed once a month. You can change it again in ${diffDays} day(s).`
                });
            }
        }

        // Generate a 6-digit verification code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date();
        expires.setMinutes(expires.getMinutes() + 15); // Valid for 15 minutes

        // Save code and expiration to DB
        await prisma.user.update({
            where: { email: email },
            data: {
                reset_code: code,
                reset_code_expires: expires
            }
        });

        // Send email (simulated or real)
        await sendVerificationCodeEmail(user.email, user.name, code);

        return res.status(200).json({
            message: "Verification code sent to your email. Please check your inbox.",
            email: user.email
        });
    } catch (error) {
        next(error);
    }
};

exports.forgotPasswordReset = async (req, res, next) => {
    try {
        console.log("Backend received reset payload:", req.body);
        const { email, code, newPassword } = req.body;
        if (!email || !code || !newPassword) {
            return res.status(400).json({ message: "Email, verification code, and new password are required." });
        }
        const passwordError = validatePassword(newPassword);
        if (passwordError) {
            return res.status(400).json({ message: passwordError });
        }

        const user = await prisma.user.findUnique({
            where: { email: email }
        });

        if (!user) {
            return res.status(404).json({ message: "Email is not registered." });
        }

        // Verify code
        if (!user.reset_code || user.reset_code !== code || !user.reset_code_expires || new Date() > user.reset_code_expires) {
            return res.status(400).json({ message: "Invalid or expired verification code." });
        }

        // Re-check restriction on actual reset action (security best practice)
        if (!user.must_reset_password && user.password_last_changed) {
            const lastChanged = new Date(user.password_last_changed);
            const nextAllowedDate = new Date(lastChanged);
            nextAllowedDate.setDate(nextAllowedDate.getDate() + 30);
            const now = new Date();
            if (now < nextAllowedDate) {
                const diffTime = Math.abs(nextAllowedDate - now);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return res.status(400).json({
                    message: `Password can only be changed once a month. You can change it again in ${diffDays} day(s).`
                });
            }
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await prisma.user.update({
            where: { email: email },
            data: {
                password_hash: hashedPassword,
                must_reset_password: false,
                password_last_changed: new Date(),
                reset_code: null, // Clear reset code info
                reset_code_expires: null
            }
        });

        return res.status(200).json({ message: "Password reset successfully!" });
    } catch (error) {
        next(error);
    }
};