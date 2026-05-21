require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Connect to DB and start server
connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode.`);
    });
}).catch(err => {
    console.error('Failed to connect to database. Server not started.', err);
    process.exit(1);
});
