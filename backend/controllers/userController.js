// Why: In a real app, this would pull from Person 3's database. 
// For now, we will just return a success message to prove the security works.
exports.getAllUsers = async (req, res, next) => {
    try {
        // Superpower check: Because of our middleware, we can see req.user.role!
        // If the user logging in is NOT an Admin, block them immediately.
        if (req.user.role !== 'Admin') {
            return res.status(403).json({
                errorCode: 'FORBIDDEN',
                message: 'Access denied. Admins only.'
            });
        }

        // If they are an Admin, give them the data
        return res.status(200).json({
            message: "User list retrieved successfully!",
            users: [
                { id: 1, email: "student@kln.ac.lk", role: "Admin" },
                { id: 2, email: "team@kln.ac.lk", role: "Collaborator" }
            ]
        });

    } catch (error) {
        next(error);
    }
};