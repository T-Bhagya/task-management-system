const jwt = require('jsonwebtoken');

// Why: Middleware is just a function with access to (req, res, next).
// 'next' is a special callback that tells Express to move to the next function in line.
module.exports = (req, res, next) => {
    try {
        // 1. Look for the token in the request headers
        const authHeader = req.header('Authorization');

        // Why: The standard practice is to send tokens as 'Bearer <token_string>'.
        // If there's no header, or it doesn't start with 'Bearer ', block them immediately.
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                errorCode: 'TOKEN_MISSING',
                message: 'Access denied. No token provided.'
            });
        }

        // 2. Extract the actual token string
        // Why: 'Bearer token12345' split by a space gives us ['Bearer', 'token12345'].
        // We grab index [1] to get just the token string.
        const token = authHeader.split(' ')[1];

        // 3. Verify the token using your secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Attach the user data to the request object
        // Why: This is a NodeJS superpower. By putting the user's ID and role into 'req.user',
        // any controller function that runs AFTER this middleware can instantly know who is logged in.
        req.user = decoded;

        // 5. Let them pass!
        next();

    } catch (error) {
        // Why: If jwt.verify() fails (because the token is expired or altered), it throws an error.
        return res.status(401).json({
            errorCode: 'INVALID_TOKEN',
            message: 'Token is invalid or expired.'
        });
    }
};