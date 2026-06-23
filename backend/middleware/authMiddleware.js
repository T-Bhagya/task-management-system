const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
    // 1. Look for the token in the headers
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Access denied. No valid token provided." });
    }

    // 2. Extract just the token part
    const token = authHeader.split(' ')[1];

    try {
        // 3. Verify the token using your secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 4. Attach the verified user payload (id, role) to the request object
        req.user = decoded;
        
        // 5. Let them pass to the actual controller!
        next();
    } catch (error) {
        res.status(401).json({ message: "Invalid or expired token." });
    }
};

exports.requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        res.status(403).json({ message: "Access denied. Admins only." });
    }
};

exports.requireAdminOrPM = (req, res, next) => {
    if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'PROJECT_MANAGER')) {
        next();
    } else {
        res.status(403).json({ message: "Access denied. Admins and Project Managers only." });
    }
};