const { Pool } = require('pg');

// Why: A 'Pool' manages multiple connections to the database efficiently.
// It automatically reads the DATABASE_URL from your .env file.
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Test the connection as soon as the server starts
pool.connect()
    .then(() => console.log('✅ Successfully connected to PostgreSQL Database'))
    .catch((err) => console.error('❌ Database connection error', err.stack));

module.exports = {
    // Why: This lets us run SQL queries safely from any other file in our project
    query: (text, params) => pool.query(text, params),
};