const request = require('supertest');
const express = require('express');
const setupUserRoutes = require('../src/api/routes/userRoutes');
const { isAuthenticated, gerenteAuthorized } = require('../src/api/middleware/authMiddleware');

jest.mock('../src/api/middleware/authMiddleware', () => ({
    isAuthenticated: jest.fn((req, res, next) => next()),
    gerenteAuthorized: jest.fn((req, res, next) => next())
}));

describe('🔹 UserRoutes', () => {
    let app;
    let mockUserController;

    beforeEach(() => {
        mockUserController = {
            createUser: jest.fn((req, res) => res.status(201).json({ id: '123' })),
            getUserById: jest.fn((req, res) => res.status(200).json({ id: '123' })),
            updateUser: jest.fn((req, res) => res.status(200).json({ id: '123', updated: true })),
            deleteUser: jest.fn((req, res) => res.status(204).json({})),
            getAllUsers: jest.fn((req, res) => res.status(200).json([{ id: '123' }])),
        };

    app = express();
    app.use(express.json());
    app.use('/api/users', setupUserRoutes(mockUserController));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('📌 POST /', () => {
        it('Se llama al método del controlador createUser', async () => {

            const userData = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
            role: ['estudiante'],
            department: 'informática e ingeniería de sistemas'
            };

            const response = await request(app).post('/api/users').send(userData);

            expect(response.status).toBe(201);
            expect(mockUserController.createUser).toHaveBeenCalled();
            expect(response.body).toEqual({ id: '123' });
        });
    });

    describe('📌 GET /search/:id', () => {
        it('Se llama al método del controlador getUserById', async () => {

            const response = await request(app).get('/api/users/search/123');

            expect(response.status).toBe(200);
            expect(mockUserController.getUserById).toHaveBeenCalled();
            expect(response.body).toEqual({ id: '123' });
        });
    });

    describe('📌 PUT /:id', () => {
        it('Se llama al método del controlador updateUser con autenticación', async () => {
            const updateData = {
                name: 'Updated Name',
                email: 'updated@example.com'
            };

            const response = await request(app).put('/api/users/123').send(updateData);

            expect(response.status).toBe(200);
            expect(isAuthenticated).toHaveBeenCalled();
            expect(gerenteAuthorized).toHaveBeenCalled();
            expect(mockUserController.updateUser).toHaveBeenCalled();
            expect(response.body).toEqual({ id: '123', updated: true });
        });
    });

    describe('📌 DELETE /:id', () => {
        it('Se llama al método del controlador deleteUser con autenticación', async () => {

            const response = await request(app).delete('/api/users/123');

            expect(response.status).toBe(204);
            expect(isAuthenticated).toHaveBeenCalled();
            expect(gerenteAuthorized).toHaveBeenCalled();
            expect(mockUserController.deleteUser).toHaveBeenCalled();
        });
    });

    describe('📌 GET /', () => {
        it('Se llama al método del controlador getAllUsers', async () => {
            const response = await request(app).get('/api/users');

            expect(response.status).toBe(200);
            expect(mockUserController.getAllUsers).toHaveBeenCalled();
            expect(response.body).toEqual([{ id: '123' }]);
        });
    });

});