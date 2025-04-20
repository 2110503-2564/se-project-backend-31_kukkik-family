const request = require('supertest');
const app = require('../app');
const Booking = require('../models/Booking');
const CarProvider = require('../models/CarProvider');

jest.mock('../models/Booking');
jest.mock('../models/CarProvider');

const mockUser = { id: 'user123', role: 'user' };
const mockAdmin = { id: 'admin123', role: 'admin' };

const mockBooking = {
  _id: 'booking123',
  user: mockUser.id,
  carProvider: 'provider123',
  status: 'pending',
  deleteOne: jest.fn(),
  save: jest.fn(),
};

const mockCarProvider = {
  _id: 'provider123',
  status: 'available'
};

describe('Booking Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getBookings', () => {
    it('should get user bookings (non-admin)', async () => {
      Booking.find.mockReturnValue({ populate: jest.fn().mockResolvedValue([mockBooking]) });
      const res = await request(app).get('/api/v1/bookings').set('user', JSON.stringify(mockUser));
      expect(res.statusCode).toBe(200);
    });

    it('should get all bookings (admin)', async () => {
      Booking.find.mockReturnValue({ populate: jest.fn().mockResolvedValue([mockBooking]) });
      const res = await request(app).get('/api/v1/bookings').set('user', JSON.stringify(mockAdmin));
      expect(res.statusCode).toBe(200);
    });

    it('handles internal error', async () => {
      Booking.find.mockImplementation(() => { throw new Error('fail'); });
      const res = await request(app).get('/api/v1/bookings').set('user', JSON.stringify(mockAdmin));
      expect(res.statusCode).toBe(500);
    });
  });

  describe('getBooking', () => {
    it('should return booking by ID', async () => {
      Booking.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(mockBooking) });
      const res = await request(app).get('/api/v1/bookings/booking123');
      expect(res.statusCode).toBe(200);
    });

    it('should return 404 if booking not found', async () => {
      Booking.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
      const res = await request(app).get('/api/v1/bookings/booking123');
      expect(res.statusCode).toBe(404);
    });

    it('handles internal error', async () => {
      Booking.findById.mockImplementation(() => { throw new Error('fail'); });
      const res = await request(app).get('/api/v1/bookings/booking123');
      expect(res.statusCode).toBe(500);
    });
  });

  describe('addBooking', () => {
    it('creates a booking and updates carProvider', async () => {
      CarProvider.findById.mockResolvedValue(mockCarProvider);
      Booking.find.mockResolvedValue([]);
      Booking.create.mockResolvedValue(mockBooking);
      CarProvider.findByIdAndUpdate.mockResolvedValue();

      const res = await request(app)
        .post('/api/v1/carProviders/provider123/bookings')
        .set('user', JSON.stringify(mockUser))
        .send({});

      expect(res.statusCode).toBe(201);
    });

    it('rejects if carProvider not found', async () => {
      CarProvider.findById.mockResolvedValue(null);
      const res = await request(app)
        .post('/api/v1/carProviders/provider123/bookings')
        .set('user', JSON.stringify(mockUser));
      expect(res.statusCode).toBe(404);
    });

    it('rejects if carProvider not available', async () => {
      CarProvider.findById.mockResolvedValue({ ...mockCarProvider, status: 'rented' });
      const res = await request(app)
        .post('/api/v1/carProviders/provider123/bookings')
        .set('user', JSON.stringify(mockUser));
      expect(res.statusCode).toBe(400);
    });

    it('rejects if user has 3 bookings', async () => {
      CarProvider.findById.mockResolvedValue(mockCarProvider);
      Booking.find.mockResolvedValue([{}, {}, {}]);
      const res = await request(app)
        .post('/api/v1/carProviders/provider123/bookings')
        .set('user', JSON.stringify(mockUser));
      expect(res.statusCode).toBe(400);
    });

    it('handles internal error', async () => {
      CarProvider.findById.mockImplementation(() => { throw new Error('fail'); });
      const res = await request(app)
        .post('/api/v1/carProviders/provider123/bookings')
        .set('user', JSON.stringify(mockUser));
      expect(res.statusCode).toBe(500);
    });
  });

  describe('updateBooking', () => {
    it('updates booking as owner', async () => {
      Booking.findById.mockResolvedValue({ ...mockBooking, user: mockUser.id });
      Booking.findByIdAndUpdate.mockResolvedValue(mockBooking);

      const res = await request(app)
        .put('/api/v1/bookings/booking123')
        .set('user', JSON.stringify(mockUser))
        .send({});

      expect(res.statusCode).toBe(200);
    });

    it('rejects update by unauthorized user', async () => {
      Booking.findById.mockResolvedValue({ ...mockBooking, user: 'anotherUser' });

      const res = await request(app)
        .put('/api/v1/bookings/booking123')
        .set('user', JSON.stringify(mockUser));

      expect(res.statusCode).toBe(403);
    });

    it('handles not found', async () => {
      Booking.findById.mockResolvedValue(null);
      const res = await request(app)
        .put('/api/v1/bookings/booking123')
        .set('user', JSON.stringify(mockUser));
      expect(res.statusCode).toBe(404);
    });

    it('handles error', async () => {
      Booking.findById.mockImplementation(() => { throw new Error('fail'); });
      const res = await request(app)
        .put('/api/v1/bookings/booking123')
        .set('user', JSON.stringify(mockUser));
      expect(res.statusCode).toBe(500);
    });
  });

  describe('deleteBooking', () => {
    it('deletes booking as owner', async () => {
      Booking.findById.mockResolvedValue({ ...mockBooking, deleteOne: jest.fn(), user: mockUser.id });
      const res = await request(app)
        .delete('/api/v1/bookings/booking123')
        .set('user', JSON.stringify(mockUser));
      expect(res.statusCode).toBe(200);
    });

    it('rejects unauthorized delete', async () => {
      Booking.findById.mockResolvedValue({ ...mockBooking, user: 'otherUser' });
      const res = await request(app)
        .delete('/api/v1/bookings/booking123')
        .set('user', JSON.stringify(mockUser));
      expect(res.statusCode).toBe(403);
    });

    it('handles not found', async () => {
      Booking.findById.mockResolvedValue(null);
      const res = await request(app)
        .delete('/api/v1/bookings/booking123')
        .set('user', JSON.stringify(mockUser));
      expect(res.statusCode).toBe(404);
    });

    it('handles error', async () => {
      Booking.findById.mockImplementation(() => { throw new Error('fail'); });
      const res = await request(app)
        .delete('/api/v1/bookings/booking123')
        .set('user', JSON.stringify(mockUser));
      expect(res.statusCode).toBe(500);
    });
  });

  describe('getBookingStatus', () => {
    it('returns booking status', async () => {
      Booking.findById.mockResolvedValue({ status: 'rented' });
      const res = await request(app).get('/api/bookings/booking123/status');
      expect(res.statusCode).toBe(200);
    });

    it('handles not found', async () => {
      Booking.findById.mockResolvedValue(null);
      const res = await request(app).get('/api/bookings/booking123/status');
      expect(res.statusCode).toBe(404);
    });

    it('handles error', async () => {
      Booking.findById.mockImplementation(() => { throw new Error('fail'); });
      const res = await request(app).get('/api/bookings/booking123/status');
      expect(res.statusCode).toBe(500);
    });
  });

  describe('updateBookingStatus', () => {
    it('updates valid status', async () => {
      const saveMock = jest.fn();
      Booking.findById.mockResolvedValue({ ...mockBooking, save: saveMock });
      const res = await request(app)
        .patch('/api/bookings/booking123/status')
        .send({ status: 'returned' });
      expect(res.statusCode).toBe(200);
    });

    it('rejects invalid status', async () => {
      const res = await request(app)
        .patch('/api/bookings/booking123/status')
        .send({ status: 'invalid' });
      expect(res.statusCode).toBe(400);
    });

    it('handles not found', async () => {
      Booking.findById.mockResolvedValue(null);
      const res = await request(app)
        .patch('/api/bookings/booking123/status')
        .send({ status: 'rented' });
      expect(res.statusCode).toBe(404);
    });

    it('handles error', async () => {
      Booking.findById.mockImplementation(() => { throw new Error('fail'); });
      const res = await request(app)
        .patch('/api/bookings/booking123/status')
        .send({ status: 'rented' });
      expect(res.statusCode).toBe(500);
    });
  });
});
