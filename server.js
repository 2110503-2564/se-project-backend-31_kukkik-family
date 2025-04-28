const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/db');
const helmet = require('helmet');
const { xss } = require('express-xss-sanitizer');
const rateLimit = require('express-rate-limit');
const swaggerUI = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const PORT = process.env.PORT || 5000;

const hpp = require('hpp');
const cors = require('cors');
//Load env vars
dotenv.config({ path: './config/config.env' });

//Connect to database
connectDB();

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(mongoSanitize());
app.use(helmet());
app.use(xss());
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));
const limiter = rateLimit({
    windowsMs: 10 * 60 * 1000,//10 mins
    max: 100
});
app.use(limiter);
app.use(hpp());
app.use(cors());

//Allow large JSON/form data (base64 images) up to 20MB
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

//Route files
const carProviders = require('./routes/carProviders');
const auth = require('./routes/auth');
const bookings = require('./routes/bookings')
const coins = require('./routes/coins')
//Mount routers
const users = require('./routes/user')
app.use('/api/v1/carProviders', carProviders)
app.use('/api/v1/auth', auth);
app.use('/api/v1/bookings', bookings);
app.use('/api/v1/coins', coins);

//Body parser
app.use('/api/v1/users', users);

const server = app.listen(PORT, console.log('Server running in', process.env.NODE_ENV, 'mode on port', PORT));

//Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    //Close server & exit process
    server.close(() => process.exit(1));
});