const { message } = require('statuses');
const User = require('../models/User')

exports.getCoins = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            coin: user.coin
        });

    } catch (err) {
        console.log(err);
        
        res.status(500).json({
            success: false,
            message: "Cannot fetch coins",
            error: err.message
        });
    }
};

exports.addCoins = async (req, res, next) => {
    try {


    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Cannot add coins",
            error: err.message
        })
    }
}

exports.deductCoins = async (req, res, next) => {
    try {

    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Cannot deduct coins",
            error: err.message
        })
    }
}