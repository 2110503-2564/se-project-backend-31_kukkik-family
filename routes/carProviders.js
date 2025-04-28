const express = require('express');
const router = express.Router();
const { getCarProviders, getCarProvider, createCarProvider, updateCarProvider, deleteCarProvider, likeCarProvider, getCarStatus, updateCarStatus, topSalesCar, getTopSalesCar, getAllRenterCars } = require('../controllers/carProviders');

const bookingRouter = require('./bookings');

const { protect, authorize } = require('../middleware/auth');

router.use('/:carProviderId/bookings/', bookingRouter);

router.route('/').get(getCarProviders).post(protect, authorize('admin', 'renter'), createCarProvider);
router.route('/top-sales').get(protect, authorize('admin', 'renter'), getTopSalesCar);
router.route('/renter/:renterId').get(getAllRenterCars);
router.route('/:id').get(getCarProvider).put(protect, authorize('admin'), updateCarProvider).delete(protect, authorize('admin'), deleteCarProvider);
router.route('/:id/like').post(protect, authorize('user', 'admin'), likeCarProvider);
// router.route('/:id/status')
//   .get(protect, authorize('user', 'admin'), getCarStatus) 
//   .put(protect, authorize('user', 'admin'), updateCarStatus);

module.exports = router;
