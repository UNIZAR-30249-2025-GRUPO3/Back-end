const request = require('supertest');
const express = require('express');
const setupSpaceRoutes = require('../src/api/routes/spaceRoutes');
const { isAuthenticated, gerenteAuthorized } = require('../src/api/middleware/authMiddleware');

jest.mock('../src/api/middleware/authMiddleware', () => ({
    isAuthenticated: jest.fn((req, res, next) => next()),
    gerenteAuthorized: jest.fn((req, res, next) => next())
}));

describe('🔹 SpaceRoutes', () => {
    let app;
    let mockSpaceController;

    beforeEach(() => {
        mockSpaceController = {
            createSpace: jest.fn((req, res) => res.status(201).json({
                id: 'space123',
                name: 'Aula 1.01',
                floor: 1,
                capacity: 40,
                spaceType: 'aula'
            })),
            getSpaceById: jest.fn((req, res) => res.status(200).json({
                id: 'space123',
                name: 'Aula 1.01',
                floor: 1,
                capacity: 40,
                spaceType: 'aula'
            })),
            updateSpace: jest.fn((req, res) => res.status(200).json({
                id: 'space123',
                name: 'Aula 1.01 (Actualizada)',
                floor: 1,
                capacity: 45,
                spaceType: 'aula',
                updated: true
            })),
            deleteSpace: jest.fn((req, res) => res.status(200).json({
                id: 'space123',
                deleted: true
            })),
            getAllSpaces: jest.fn((req, res) => res.status(200).json([
                { id: 'space123', name: 'Aula 1.01', floor: 1 },
                { id: 'space456', name: 'Laboratorio 2.03', floor: 2 }
            ])),
            findSpacesByFloor: jest.fn((req, res) => res.status(200).json([
                { id: 'space123', name: 'Aula 1.01', floor: 1 },
                { id: 'space789', name: 'Seminario 1.02', floor: 1 }
            ])),
            findSpacesByCategory: jest.fn((req, res) => res.status(200).json([
                { id: 'space123', name: 'Aula 1.01', reservationCategory: 'aula' },
                { id: 'space456', name: 'Aula 2.01', reservationCategory: 'aula' }
            ])),
            findSpacesByDepartment: jest.fn((req, res) => res.status(200).json([
                { id: 'space123', name: 'Despacho 3.01', assignmentTarget: { type: 'department', targets: ['informática e ingeniería de sistemas'] } }
            ])),
        };

        app = express();
        app.use(express.json());
        app.use('/api/spaces', setupSpaceRoutes(mockSpaceController));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('📌 POST /', () => {
        it('Se llama al método del controlador createSpace con autenticación', async () => {
            const spaceData = {
                name: 'Aula 1.01',
                floor: 1,
                capacity: 40,
                spaceType: 'aula',
                isReservable: true,
                reservationCategory: 'aula',
                assignmentTarget: {
                    type: 'eina',
                    targets: []
                }
            };

            const response = await request(app).post('/api/spaces').send(spaceData);

            expect(response.status).toBe(201);
            expect(isAuthenticated).toHaveBeenCalled();
            expect(gerenteAuthorized).toHaveBeenCalled();
            expect(mockSpaceController.createSpace).toHaveBeenCalled();
            expect(response.body).toHaveProperty('id', 'space123');
        });
    });

    describe('📌 GET /:id', () => {
        it('Se llama al método del controlador getSpaceById', async () => {
            const response = await request(app).get('/api/spaces/space123');

            expect(response.status).toBe(200);
            expect(mockSpaceController.getSpaceById).toHaveBeenCalled();
            expect(response.body).toHaveProperty('id', 'space123');
            expect(response.body).toHaveProperty('name', 'Aula 1.01');
        });
    });

    describe('📌 PUT /:id', () => {
        it('Se llama al método del controlador updateSpace con autenticación', async () => {
            const updateData = {
                name: 'Aula 1.01 (Actualizada)',
                capacity: 45
            };

            const response = await request(app).put('/api/spaces/space123').send(updateData);

            expect(response.status).toBe(200);
            expect(isAuthenticated).toHaveBeenCalled();
            expect(gerenteAuthorized).toHaveBeenCalled();
            expect(mockSpaceController.updateSpace).toHaveBeenCalled();
            expect(response.body).toHaveProperty('updated', true);
            expect(response.body).toHaveProperty('capacity', 45);
        });
    });

    describe('📌 DELETE /:id', () => {
        it('Se llama al método del controlador deleteSpace con autenticación', async () => {
            const response = await request(app).delete('/api/spaces/space123');

            expect(response.status).toBe(200);
            expect(isAuthenticated).toHaveBeenCalled();
            expect(gerenteAuthorized).toHaveBeenCalled();
            expect(mockSpaceController.deleteSpace).toHaveBeenCalled();
            expect(response.body).toHaveProperty('deleted', true);
        });
    });

    describe('📌 GET /', () => {
        it('Se llama al método del controlador getAllSpaces', async () => {
            const response = await request(app).get('/api/spaces');

            expect(response.status).toBe(200);
            expect(mockSpaceController.getAllSpaces).toHaveBeenCalled();
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(2);
        });
    });

    describe('📌 GET /floor/:floor', () => {
        it('Se llama al método del controlador findSpacesByFloor', async () => {
            const response = await request(app).get('/api/spaces/floor/1');

            expect(response.status).toBe(200);
            expect(mockSpaceController.findSpacesByFloor).toHaveBeenCalled();
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(2);
            expect(response.body[0].floor).toBe(1);
        });
    });

    describe('📌 GET /category/:category', () => {
        it('Se llama al método del controlador findSpacesByCategory', async () => {
            const response = await request(app).get('/api/spaces/category/aula');

            expect(response.status).toBe(200);
            expect(mockSpaceController.findSpacesByCategory).toHaveBeenCalled();
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body[0].reservationCategory).toBe('aula');
        });
    });

    describe('📌 GET /department/:department', () => {
        it('Se llama al método del controlador findSpacesByDepartment', async () => {
            const department = 'informática e ingeniería de sistemas';
            const response = await request(app).get(`/api/spaces/department/${encodeURIComponent(department)}`);

            expect(response.status).toBe(200);
            expect(mockSpaceController.findSpacesByDepartment).toHaveBeenCalled();
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body[0].assignmentTarget.type).toBe('department');
            expect(response.body[0].assignmentTarget.targets).toContain(department);
        });
    });
});