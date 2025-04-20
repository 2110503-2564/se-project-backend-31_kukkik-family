const { message } = require('statuses');
const Booking = require('../models/Booking');
const CarProvider = require('../models/CarProvider');

// @desc    Get all bookings
// @route   GET /api/v1/bookings
// @access  Private (User sees their own, Admin sees all)
exports.getBookings = async (req, res, next) => {
    try {
        let query;

        if (req.user.role !== 'admin') {
            //allow the registered user to view his/her rental car bookings.
            query = Booking.find({ user: req.user.id }).populate({
                path: 'carProvider',
                select: 'name address tel picture'
            });
        } else {
            // allow the admin to view any rental car bookings.
            if (req.params.carProviderId) {
                query = Booking.find({ carProvider: req.params.carProviderId }).populate({
                    path: 'carProvider',
                    select: 'name address tel picture'
                });
            } else {
                query = Booking.find().populate({
                    path: 'carProvider',
                    select: 'name address tel picture'
                });
            }
        }

        const bookings = await query;

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Cannot fetch Bookings"
        });
    }
};

// @desc    Get single booking
// @route   GET /api/v1/bookings/:id
// @access  Private
exports.getBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id).populate({
            path: 'carProvider',
            select: 'name address tel picture'
        });

        if (!booking) {
            return res.status(404).json({ success: false, message: `No booking found with ID ${req.params.id}` });
        }

        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Cannot fetch Booking" });
    }
};

// @desc    Add booking
// @route   POST /api/v1/carProviders/:carProviderId/bookings
// @access  Private
exports.addBooking = async (req, res, next) => {
    try {
        req.body.carProvider = req.params.carProviderId;

        const carProvider = await CarProvider.findById(req.params.carProviderId);

        if (!carProvider) {
            return res.status(404).json({ success: false, message: `No car provider with ID ${req.params.carProviderId}` });
        }

        // Check if car is available before booking
        if (carProvider.status !== 'available') {
            return res.status(400).json({
                success: false,
                message: `Car with ID ${req.params.carProviderId} is not available for booking`
            });
        }

        //add user Id to req.body
        req.body.user = req.user.id;
        

        //Check if existed appointment
        const existingBookings = await Booking.find({ user: req.user.id });

        //If the user is not an admin, they can only create 3 appointments
        if (existingBookings.length >= 3 && req.user.role !== 'admin') {
            return res.status(400).json({
                success: false,
                message: `User with ID ${req.user.id} has already booked 3 cars`
            });
        }

         // Create booking
        const booking = await Booking.create(req.body);

        // Update car status to "rented"
        await CarProvider.findByIdAndUpdate(req.params.carProviderId, {
            status: 'rented'
        });

        res.status(201).json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Cannot create Booking" });
    }
};

// @desc    Update booking
// @route   PUT /api/v1/bookings/:id
// @access  Private
exports.updateBooking = async (req, res, next) => {
    try {
        let booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: `No booking with ID ${req.params.id}`
            });
        }

        if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: `User ${req.user.id} is not authorized to update this booking`
            });
        }
        

        booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },  // Ensures Mongoose properly updates fields
            {
                new: true,
                runValidators: true,
                context: 'query' // This ensures proper validation
            }
        );

        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Cannot update Booking"
        });
    }
};

// @desc    Delete booking
// @route   DELETE /api/v1/bookings/:id
// @access  Private
exports.deleteBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: `No booking with ID ${req.params.id}`
            });
        }

        if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: `User ${req.user.id} is not authorized to delete this booking`
            });
        }

        await booking.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Cannot delete Booking"
        });
    }
};

// @desc GET booking status
// @route GET /api/v1/bookings/:id/status
// @access Private
exports.getBookingStatus = async (req, res) => {
    try {
      const booking = await Booking.findById(req.params.id).select('status');
  
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
  
      res.status(200).json({ success: true, status: booking.status });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  };
  

// @desc UPDATE booking status
// @route PATCH /api/v1/bookings/:id/status
// @access Private
exports.updateBookingStatus = async (req, res) => {
    const { status } = req.body;
    const allowedStatuses = ['rented', 'received', 'returned'];
  
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of ${allowedStatuses.join(', ')}`,
      });
    }
  
    try {
      const booking = await Booking.findById(req.params.id);
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
  
      booking.status = status;
      await booking.save();
  
      res.status(200).json({ success: true, status: booking.status });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  };
  