const CarProvider = require('../models/CarProvider');
const Booking = require('../models/Booking');
const User = require('../models/User');

// @desc Get all car providers
// @route GET /api/v1/carProviders
// @access Public
exports.getCarProviders = async (req, res, next) => {
    let query;
    console.log(req.query);
    
    // Create a clean query object without special parameters
    const reqQuery = {};
    
    // Handle province filter
    if (req.query.province) {
        reqQuery.province = req.query.province;
    }

    // Handle price range filtering
    if (req.query.minprice || req.query.maxprice) {
        reqQuery.dailyrate = {};
        if (req.query.minprice) {
            const minPrice = Number(req.query.minprice);
            if (!isNaN(minPrice)) reqQuery.dailyrate.$gte = minPrice;
        }
        if (req.query.maxprice) {
            const maxPrice = Number(req.query.maxprice);
            if (!isNaN(maxPrice)) reqQuery.dailyrate.$lte = maxPrice;
        }
    }

    // Handle seat range filtering
    if (req.query.minseat || req.query.maxseat) {
        reqQuery.seat = {};
        if (req.query.minseat) {
            const minSeat = Number(req.query.minseat);
            if (!isNaN(minSeat)) reqQuery.seat.$gte = minSeat;
        }
        if (req.query.maxseat) {
            const maxSeat = Number(req.query.maxseat);
            if (!isNaN(maxSeat)) reqQuery.seat.$lte = maxSeat;
        }
    }

    console.log('Final query:', reqQuery);
    query = CarProvider.find(reqQuery).populate('booking');

    if (req.query.select) {
        const fields = req.query.select.split(',').join(' ');
        query = query.select(fields);
    }

    // Sorting logic
    if (req.query.relevance) {
        query = query.sort({ score: { $meta: "textScore" } });
        query = query.find({ $text: { $search: req.query.relevance } });
    } else if (req.query.toplike) {
        query = query.sort({ like: req.query.toplike === 'true' ? -1 : 1 });
    } else if (req.query.seat) {
        query = query.sort({ seat: req.query.seat === 'high' ? -1 : 1 });
    } else if (req.query.price) {
        query = query.sort({ dailyrate: req.query.price === 'high' ? -1 : 1 });
    } else {
        query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    try {
        const total = await CarProvider.countDocuments();
        query = query.skip(startIndex).limit(limit);

        // Execute query
        const carProviders = await query;

        // Pagination result
        const pagination = {};

        if (endIndex < total) {
            pagination.next = {
                page: page + 1,
                limit
            };
        }

        if (startIndex > 0) {
            pagination.prev = {
                page: page - 1,
                limit
            };
        }

        res.status(200).json({
            success: true,
            count: carProviders.length,
            pagination,
            data: carProviders
        });
    } catch (err) {
        console.error(err);  // Log the error to see more details
        res.status(400).json({
            success: false,
            error: err.message || 'Server error'  // Return error message for debugging
        });
    }
};


// @desc Get single car provider by ID
// @route GET /api/v1/carProviders/:id
// @access Public
exports.getCarProvider = async (req, res, next) => {
    try {
        const carProvider = await CarProvider.findById(req.params.id);
        if (!carProvider) {
            return res.status(400).json({ success: false });
        }
        res.status(200).json({
            success: true,
            data: carProvider
        });
    } catch (err) {
        res.status(400).json({ success: false });
    }
};


// @desc Create car provider
// @route POST /api/v1/carProviders
// @access Private
exports.createCarProvider = async (req, res, next) => {

    const carProvider = await CarProvider.create({
        ...req.body,
        like: 0,
        renter: req.user.id
    });

    await User.findByIdAndUpdate(req.user.id, {
        $push: { rentalCars: carProvider._id }
    });
    
    res.status(201).json({
        success: true,
        data: carProvider
    });
};

// @desc Update car provider
// @route PUT /api/v1/carProviders/:id
// @access Private
exports.updateCarProvider = async (req, res, next) => {
    try {
        const carProvider = await CarProvider.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!carProvider) {
            return res.status(400).json({ success: false });
        }
        res.status(200).json({
            success: true,
            data: carProvider
        });
    } catch (err) {
        res.status(400).json({ success: false });
    }
};

// @desc Delete car provider
// @route DELETE /api/v1/carProviders/:id
// @access Private
exports.deleteCarProvider = async (req, res, next) => {
    try {
        const carProvider = await CarProvider.findById(req.params.id);
        if (!carProvider) {
            return res.status(400).json({ success: false });
        }

        await Booking.deleteMany({ carProvider: req.params.id });
        await CarProvider.deleteOne({ _id: req.params.id });
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        res.status(400).json({ success: false });
    }
};

// @desc Like a car provider
// @route POST /api/v1/carProviders/:id/like
// @access Private
exports.likeCarProvider = async (req, res, next) => {
    try {
        const carProvider = await CarProvider.findById(req.params.id);
        if (!carProvider) {
            return res.status(404).json({
                success: false,
                error: 'Car provider not found'
            });
        }

        // Get user from request (assuming user is added by auth middleware)
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Check if user has already liked this car
        if (user.likedCars.includes(req.params.id)) {
            return res.status(400).json({
                success: false,
                error: 'You have already liked this car'
            });
        }

        // Add car to user's liked cars
        user.likedCars.push(req.params.id);
        await user.save();

        // Increment car's like count safely
        carProvider.like = (carProvider.like || 0) + 1;
        await carProvider.save();

        res.status(200).json({
            success: true,
            data: {
                carProvider,
                message: 'Car liked successfully'
            }
        });
    } catch (err) {
        console.error(err);
        res.status(400).json({
            success: false,
            error: err.message || 'Server error'
        });
    }
};

// @desc GET a car status
// @route GET /api/v1/carProviders/:id/status
// @access Private
exports.getCarStatus = async (req, res) => {
    try {
      const car = await CarProvider.findById(req.params.id).select('status');
  
      if (!car) {
        return res.status(404).json({ success: false, message: 'Car not found' });
      }
  
      res.status(200).json({
        success: true,
        status: car.status
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
};

// @desc UPDATE a car status
// @route PUT /api/v1/carProviders/:id/status
// @access Private
exports.updateCarStatus = async (req, res) => {
    const { status } = req.body;
  
    const allowedStatuses = ['available', 'rented', 'received', 'returned'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}`
      });
    }
  
    try {
      const car = await CarProvider.findById(req.params.id);

      if (!car) {
        return res.status(404).json({ success: false, message: 'Car not found' });
      }

      const currentStatus = car.status;

    const validTransitions = {
        available: ['rented'],       // available -> rented
        rented: ['received'],// rented -> received
        received: ['returned'],      // received -> returned
        returned: ['available'],     // returned -> available
      };

      // check transition
      if (!validTransitions[currentStatus].includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status transition from '${currentStatus}' to '${status}'`
        });
      }

      // update status
      car.status = status;
      await car.save();

      res.status(200).json({
        success: true,
        message: `Status updated to '${status}'`,
        status: car.status
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
};

// @desc get top X sales car default to 3
// @route GET /api/v1/carProviders/top-sales
// @access Private
exports.getTopSalesCar = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 3;

        const topCars = await CarProvider.find({
            renter: req.user.id
          })
          .sort({ sale: -1 })
          .limit(limit);
        
        if (topCars.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'No cars found for this renter.',
          });
        }
    
        res.status(200).json({
            success: true,
            count: topCars.length,
            data: topCars
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc get renter's all cars
// @route GET /api/v1/carProviders/renter/:renterId
// @access Public
exports.getAllRenterCars = async (req, res, next) => {
    try {
        const renterId = req.params.renterId;

        const user = await User.findById(renterId)
            .populate({
                path: 'rentalCars'
            })
        
        if(!user)
            return res.status(404).json({
                success: false,
                message: 'Renter not found'
            });

        res.status(200).json({
            success: true,
            name: user.name,
            email: user.email,
            tel: user.tel,
            count: user.rentalCars.length,
            data: user.rentalCars
        })
    } catch(err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
}