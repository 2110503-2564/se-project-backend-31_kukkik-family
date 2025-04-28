const express = require('express')
const { getCoins, addCoins, deductCoins, redeemCoins, getQR, transferNetRevenue, getRedeemStatus } = require('../controllers/coins');

const router = express.Router();

const {protect, authorize} = require('../middleware/auth');

router.route('/').get(protect, authorize('admin', 'user', 'renter'), getCoins)
router.route('/add').put(protect, authorize('admin', 'user', 'renter'), addCoins)
router.route('/deduct').put(protect, authorize('admin', 'user', 'renter'), deductCoins)
router.route('/getQR').post(protect, authorize('admin', 'user', 'renter'), getQR)
router.route('/confirm').put(protect, authorize('admin', 'user', 'renter'), transferNetRevenue, addCoins)
router.route('/redeem/:code').get(redeemCoins, addCoins)
router.route('/redeem/:code/status').get(getRedeemStatus)

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Coins
 *   description: Coins management
 */

/**
 * @swagger
 * /coins/:
 *   get:
 *     summary: Get user's coins
 *     tags: [Coins]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Coins retrieved successfully
 */

/**
 * @swagger
 * /coins/add:
 *   put:
 *     summary: Add coins to a user
 *     tags: [Coins]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               coin:
 *                 type: number
 *                 description: Amount of coins to add
 *     responses:
 *       200:
 *         description: Coins added successfully
 */

/**
 * @swagger
 * /coins/deduct:
 *   put:
 *     summary: Deduct coins from a user
 *     tags: [Coins]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               coin:
 *                 type: number
 *                 description: Amount of coins to deduct
 *     responses:
 *       200:
 *         description: Coins deducted successfully
 */

/**
 * @swagger
 * /coins/getQR:
 *   post:
 *     summary: Generate a QR code for a user to add coins
 *     tags: [Coins]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               coin:
 *                 type: integer
 *                 description: The amount of coins to add to the user's account
 *     responses:
 *       200:
 *         description: QR code generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 qrCode:
 *                   type: string
 *                   description: The generated QR code string
 *       400:
 *         description: Bad request (e.g., missing 'coin' parameter)
 *       401:
 *         description: Unauthorized (Invalid or missing token)
 *       500:
 *         description: Internal server error (e.g., unable to generate QR code)
 */


/**
 * @swagger
 * /coins/confirm:
 *   put:
 *     summary: Confirm the transfer of net revenue and add coins to the user's account
 *     tags: [Coins]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bookingId:
 *                 type: string
 *                 description: The ID of the booking for which the transfer is being confirmed
 *     responses:
 *       200:
 *         description: Transfer confirmed and coins added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 coin:
 *                   type: number
 *                   description: The net revenue (coin) transferred to the user
 *       400:
 *         description: Bad request (e.g., missing or invalid bookingId, incorrect booking status)
 *       401:
 *         description: Unauthorized (if the user is not authorized to confirm the booking)
 *       404:
 *         description: Booking not found (if the provided bookingId does not exist)
 *       500:
 *         description: Internal server error (e.g., issues during the revenue transfer process)
 */


/**
 * @swagger
 * /coins/redeem/{code}:
 *   get:
 *     summary: Redeem coins using a code
 *     tags: [Coins]
 *     parameters:
 *       - in: path
 *         name: code
 *         schema:
 *           type: string
 *         required: true
 *         description: The redeem code used to redeem coins
 *     responses:
 *       200:
 *         description: Coins redeemed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 coin:
 *                   type: number
 *                   description: The amount of coins redeemed
 *       400:
 *         description: Bad request (e.g., redeem code expired or invalid)
 *       404:
 *         description: Redeem code not found
 *       500:
 *         description: Internal server error (if an issue occurs during redemption)
 */


/**
 * @swagger
 * /coins/redeem/{code}/status:
 *   get:
 *     summary: Get redeem status by code
 *     tags: [Coins]
 *     parameters:
 *       - in: path
 *         name: code
 *         schema:
 *           type: string
 *         required: true
 *         description: The redeem code whose status needs to be checked
 *     responses:
 *       200:
 *         description: Redeem status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 status:
 *                   type: string
 *                   description: The status of the redeem code (e.g., 'valid', 'expired', 'invalid')
 *       404:
 *         description: Redeem code not found
 *       500:
 *         description: Internal server error if there’s an issue retrieving the status
 */
