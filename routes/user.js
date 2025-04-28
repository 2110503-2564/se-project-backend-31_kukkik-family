const express = require('express');
const {getAllUsers,getUser, deleteUser, updateUser, getAllPendingRenterRegistrations, updatePendingRenterRegistration} = require('../controllers/user');


const router=express.Router();

const {protect, authorize} = require('../middleware/auth');

router.route('/')
    .get(protect,authorize('admin'), getAllUsers)
router.route('/renter-requests')
    .get(protect, authorize('admin'), getAllPendingRenterRegistrations)
router.route('/renter-requests/:id')
    .put(protect, authorize('admin'), updatePendingRenterRegistration)
router.route('/:id')
    .get(protect,authorize('admin'), getUser)
    .delete(protect,authorize('admin','user'), deleteUser)
    .put(protect,authorize('admin','renter'), updateUser)

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and renter registration
 */

/**
 * @swagger
 * /users/:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 */

/**
 * @swagger
 * /users/renter-requests:
 *   get:
 *     summary: Get all pending renter registration requests
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending renter requests retrieved successfully
 */

/**
 * @swagger
 * /users/renter-requests/{id}:
 *   put:
 *     summary: Update a pending renter registration request
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the pending renter user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [accept, deny]
 *                 description: Action to perform on the pending renter (accept or deny)
 *     responses:
 *       200:
 *         description: Pending renter request updated successfully
 */

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 */

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Fields to update (any fields of the user schema)
 *     responses:
 *       200:
 *         description: User updated successfully
 */

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
