const express = require('express')
const { getCoins, addCoins, deductCoins } = require('../controllers/coins');

const router = express.Router();

const {protect, authorize} = require('../middleware/auth');

router('/').get(protect, authorize('admin', 'user', 'renter'), getCoins)
router('/add').post(protect, authorize('admin', 'user', 'renter'), addCoins)
router('/deduct').post(protect, authorize('admin', 'user', 'renter'), deductCoins)
    
module.exports = router;