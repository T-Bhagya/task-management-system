// 1. Temporary Mock Database
// Why: We need data to test our login logic before Person 3 links the real database.
const mockUsers = [
    {
        id: 1,
        email: "student@kln.ac.lk",
        // This is a plain text password for now just to test the logic easily
        password: "Password123", 
        role: "Admin"
    }
];

// 2. The Login Logic Function
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Why: Always check if the user actually typed both fields.
        if (!email || !password) {
            return res.status(400).json({
                errorCode: "VALIDATION_ERROR",
                message: "Email and password are required"
            });
        }

        // Why: Search our database to see if a user with that email exists.
        const user = mockUsers.find(u => u.email === email);

        // Why: If the user doesn't exist, OR the password doesn't match, block them.
        // Security Tip: Use a generic message like "Invalid credentials" so hackers 
        // don't know if they got the email right or wrong.
        if (!user || user.password !== password) {
            return res.status(401).json({
                errorCode: "AUTH_FAILED",
                message: "Invalid email or password"
            });
        }

        // Why: If they pass the checks, they are verified! 
        // For now, we return a success message. We will generate the real JWT token next.
        return res.status(200).json({
            message: "Login successful!",
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        // Why: If any unexpected error happens, pass it to your global error handler in server.js
        next(error);
    }
};