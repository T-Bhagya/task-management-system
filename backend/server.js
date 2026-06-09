const express = require('express');
const app = express();
const cors = require('cors');

app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 5000;

app.get('/api/test', (req, res) => {
    res.status(200).json({ message: "Backend is running beautifully!" });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    
    res.status(err.status || 500).json({
        errorCode: err.name || 'ServerError',
        message: err.message || 'Something went wrong on the server',
        details: err.details || null
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});