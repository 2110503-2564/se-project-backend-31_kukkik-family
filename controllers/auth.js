const mongoose = require('mongoose');
const User = require('../models/User'); // Adjust the path if necessary


//@desc   Register user
//@route  POST /api/v1/auth/register
//@access Public

exports.register = async (req, res, next) => {
    try {
        const { name, tel, email, password,} = req.body;
        //create user
        const user = await User.create({
            ...req.body,
            role : "user",
            likedCars: []
        });
        //const token=user.getSignedJwtToken(); 
        //res.status(200).json({success:true,token});
        sendTokenResponse(user, 200, res);
    } catch (err) {
        res.status(400).json({ sucess: false });
        console.log(err.stack);
    }
};

//@desc   Login user
//@route  POST /api/va/auth/login
//@access Public
exports.login = async (req, res, next) => {
    console.log(req);
    try {
        const { email, password } = req.body;

        //Validate email & password
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                msg: 'Please provide an email and password'
            });
        }

        //Check for user
        const user = await
            User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(400).json({
                success: false,
                msg: 'Invalid credentials'
            });
        }

        //Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                msg: 'Invalid credentials'
            });
        }

        //Create token
        //const token=user.getSignedJwtToken();

        //res.status(200).json({success:true,token});
        sendTokenResponse(user, 200, res);
    } catch (err) {
        return res.status(401).json({ success: false, msg: 'Cannot convert email or password to string' });
    }
};

//@desc Log user out / clear cookie
//@route GET /api/v1/auth/logout
//@access Private
exports.logout = async (req, res) => {
    const startTime = Date.now();
    try {
        if (!req.cookies.token) {
            console.log('No token found:', Date.now() - startTime, 'ms');
            return res.status(400).json({
                success: false,
                error: 'User not logged in'
            });
        }

        res.cookie('token', 'none', {
            expires: new Date(Date.now() + 10 * 1000),
            httpOnly: true
        });
        console.log('Before response:', Date.now() - startTime, 'ms');
        res.status(200).json({ success: true });
        console.log('After response:', Date.now() - startTime, 'ms');
        res.end(); // เพิ่มนี้เพื่อให้แน่ใจว่าการตอบกลับเสร็จสิ้น

        console.log('จบปิ้ง', Date.now() - startTime, 'ms');
    } catch (err) {
        console.error('Logout error:', err.message, Date.now() - startTime, 'ms');
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};




//Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = user.getSignedJwtToken();
    const options = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true,
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }
    res.status(statusCode).cookie('token', token, options).json({
        success: true,
        token,
        "email":user.email,
        "user_id":user.id,
        "name": user.name,
        "role": user.role,
        "tel": user.tel
    })
};

//@desc   Get current logged in user
//@route  POST /api/v1/auth/me
//@access Private
exports.getMe = async (req, res, next) => {
    const user = await User.findById(req.user.id);
    res.status(200).json({
        success: true,
        data: user
    });
};

//@desc   Admin Delete User
//@route  Delete /api/v1/auth/me
//@access Private
exports.deleteUser = async (req, res, next) => {
    console.log(req);
    try {
        const { email, password } = req.body;

        //Validate email & password
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                msg: 'Please provide an email and password'
            });
        }

        //Check for user
        const user = await
            User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(400).json({
                success: false,
                msg: 'Invalid credentials'
            });
        }

        //Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                msg: 'Invalid credentials'
            });
        }

        //Create token
        //const token=user.getSignedJwtToken();

        //res.status(200).json({success:true,token});
        try {
                const userID = await User.findById(req.params.id);
                if (!userID) {
                    return res.status(400).json({ success: false });
                }
                await userID.deleteOne({ _id: req.params.id });
                res.status(200).json({
                    success: true,
                    data: {}
                });
            } catch (err) {
                res.status(400).json({ success: false });
        }
    } catch (err) {
        return res.status(401).json({ success: false, msg: 'Cannot convert email or password to string' });
    }
};