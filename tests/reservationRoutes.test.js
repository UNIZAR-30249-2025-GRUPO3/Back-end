const request = require('supertest');
const express = require('express');
const setupReservationRoutes = require('../src/api/routes/reservationRoutes');
const { isAuthenticated } = require('../src/api/middleware/authMiddleware');

jest.mock('../src/api/middleware/authMiddleware', () => ({
    isAuthenticated: jest.fn((req, res, next) => next())
}));

describe('🔹 ReservationRoutes', () => {
    let app;
    let mockReservationController;

    beforeEach(() => {
        mockReservationController = {
            createReservation: jest.fn((req, res) => res.status(201).json({
                id: 'reservation123',
                userId: 'user456',
                spaceIds: ['space123'],
                usageType: 'docencia',
                maxAttendees: 20,
                startTime: '2025-04-21T10:00:00Z',
                duration: 60,
                category: 'aula',
                status: 'valid'
            })),
            getAllReservation: jest.fn((req, res) => res.status(200).json([
                { id: 'reservation123', userId: 'user456', spaceIds: ['space123'] },
                { id: 'reservation456', userId: 'user789', spaceIds: ['space456'] }
            ])),
            getReservationById: jest.fn((req, res) => res.status(200).json({
                id: 'reservation123',
                userId: 'user456',
                spaceIds: ['space123'],
                usageType: 'docencia',
                status: 'valid'
            })),
            deleteReservation: jest.fn((req, res) => res.status(200).json({
                id: 'reservation123',
                deleted: true
            })),
            getReservationsByUser: jest.fn((req, res) => res.status(200).json([
                { id: 'reservation123', userId: 'user456', spaceIds: ['space123'] },
                { id: 'reservation789', userId: 'user456', spaceIds: ['space789'] }
            ])),
            validateReservation: jest.fn((req, res) => res.status(200).json({
                id: 'reservation123',
                userId: 'user456',
                usageType: 'gestion',
                status: 'valid',
                updated: true
            })),
            invalidateReservation: jest.fn((req, res) => res.status(200).json({
                id: 'reservation123',
                status: 'potentially_invalid',
                updated: true
            }))
        };

        app = express();
        app.use(express.json());
        app.use('/api/reservations', setupReservationRoutes(mockReservationController));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('📌 POST /', () => {
        it('Se llama al método del controlador createReservation con autenticación', async () => {
            const reservationData = {
                userId: 'user456',
                spaceIds: ['space123'],
                usageType: 'docencia',
                maxAttendees: 20,
                startTime: '2025-04-21T10:00:00Z',
                duration: 60,
                category: 'aula'
            };

            const response = await request(app).post('/api/reservations').send(reservationData);

            expect(response.status).toBe(201);
            expect(isAuthenticated).toHaveBeenCalled();
            expect(mockReservationController.createReservation).toHaveBeenCalled();
            expect(response.body).toHaveProperty('id', 'reservation123');
            expect(response.body).toHaveProperty('status', 'valid');
        });
    });

    describe('📌 GET /', () => {
        it('Se llama al método del controlador getAllReservation con autenticación', async () => {
            const response = await request(app).get('/api/reservations');

            expect(response.status).toBe(200);
            expect(isAuthenticated).toHaveBeenCalled();
            expect(mockReservationController.getAllReservation).toHaveBeenCalled();
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(2);
        });
    });

    describe('📌 GET /:id', () => {
        it('Se llama al método del controlador getReservationById con autenticación', async () => {
            const response = await request(app).get('/api/reservations/reservation123');

            expect(response.status).toBe(200);
            expect(isAuthenticated).toHaveBeenCalled();
            expect(mockReservationController.getReservationById).toHaveBeenCalled();
            expect(response.body).toHaveProperty('id', 'reservation123');
            expect(response.body).toHaveProperty('status', 'valid');
        });
    });

    describe('📌 DELETE /:id', () => {
        it('Se llama al método del controlador deleteReservation con autenticación', async () => {
            const response = await request(app).delete('/api/reservations/reservation123');

            expect(response.status).toBe(200);
            expect(isAuthenticated).toHaveBeenCalled();
            expect(mockReservationController.deleteReservation).toHaveBeenCalled();
            expect(response.body).toHaveProperty('deleted', true);
        });
    });

    describe('📌 GET /user/:userId', () => {
        it('Se llama al método del controlador getReservationsByUser con autenticación', async () => {
            const response = await request(app).get('/api/reservations/user/user456');

            expect(response.status).toBe(200);
            expect(isAuthenticated).toHaveBeenCalled();
            expect(mockReservationController.getReservationsByUser).toHaveBeenCalled();
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(2);
            expect(response.body[0].userId).toBe('user456');
        });
    });

    describe('📌 PUT /:id', () => {
        it('Se llama al método del controlador validateReservation con autenticación', async () => {
            const updateData = {
                userId: 'user456',
                spaceIds: ['space123'],
                usageType: 'gestion',
                maxAttendees: 10,
                startTime: '2025-04-21T14:00:00Z',
                duration: 90,
                category: 'sala común'
            };

            const response = await request(app).put('/api/reservations/reservation123').send(updateData);

            expect(response.status).toBe(200);
            expect(isAuthenticated).toHaveBeenCalled();
            expect(mockReservationController.validateReservation).toHaveBeenCalled();
            expect(response.body).toHaveProperty('updated', true);
            expect(response.body).toHaveProperty('usageType', 'gestion');
        });
    });

    describe('📌 PUT /invalidate/:id', () => {
        it('Se llama al método del controlador invalidateReservation con autenticación', async () => {
            const response = await request(app).put('/api/reservations/invalidate/reservation123');

            expect(response.status).toBe(200);
            expect(isAuthenticated).toHaveBeenCalled();
            expect(mockReservationController.invalidateReservation).toHaveBeenCalled();
            expect(response.body).toHaveProperty('updated', true);
            expect(response.body).toHaveProperty('status', 'potentially_invalid');
        });
    });
});