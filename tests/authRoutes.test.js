const request = require('supertest');
const express = require('express');
const setupUserRoutes = require('../src/api/routes/userRoutes');

jest.mock('../src/api/middleware/authMiddleware', () => ({
    isAuthenticated: jest.fn((req, res, next) => next()),
    gerenteAuthorized: jest.fn((req, res, next) => next())
}));

describe('🔹 AuthRoutes', () => {
    let app;
    let mockUserController;

    beforeEach(() => {
        mockUserController = {
            login: jest.fn((req, res) => res.status(200).json({ message: 'OK' })),
            logout: jest.fn((req, res) => res.status(200).json({ message: 'Closed session' }))
        };

        app = express();
        app.use(express.json());
        app.use('/api/users', setupUserRoutes(mockUserController));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('📌 POST /login', () => {

        it('Se llama al método del controlador login', async () => {

            const loginData = {
                email: 'test@example.com',
                password: 'password123'
            };

            const response = await request(app).post('/api/users/login').send(loginData);

            expect(response.status).toBe(200);
            expect(mockUserController.login).toHaveBeenCalled();
            expect(response.body).toEqual({ message: 'OK' });
        });
    });

    describe('📌 GET /logout', () => {

        it('Se llama al método del controlador logout', async () => {

            const response = await request(app).get('/api/users/logout');

            expect(response.status).toBe(200);
            expect(mockUserController.logout).toHaveBeenCalled();
            expect(response.body).toEqual({ message: 'Closed session' });
        });
    });
});