const request = require('supertest');
const express = require('express');
const setupBuildingRoutes = require('../src/api/routes/buildingRoutes');
const { isAuthenticated, gerenteAuthorized } = require('../src/api/middleware/authMiddleware');

jest.mock('../src/api/middleware/authMiddleware', () => ({
    isAuthenticated: jest.fn((req, res, next) => next()),
    gerenteAuthorized: jest.fn((req, res, next) => next())
}));

describe('🔹 BuildingRoutes', () => {
    let app;
    let mockBuildingController;

    beforeEach(() => {
        mockBuildingController = {
            getBuildingInfo: jest.fn((req, res) => res.status(200).json({
                id: 'ada-byron',
                name: 'Edificio Ada Byron',
                floors: 4,
                occupancyPercentage: 100,
                openingHours: {
                    weekdays: { open: '08:00', close: '21:00' },
                    saturday: { open: '09:00', close: '14:00' },
                    sunday: { open: null, close: null }
                }
            })),
            getOccupancyPercentage: jest.fn((req, res) => res.status(200).json({ occupancyPercentage: 100 })),
            getOpeningHours: jest.fn((req, res) => res.status(200).json({
                openingHours: {
                    weekdays: { open: '08:00', close: '21:00' },
                    saturday: { open: '09:00', close: '14:00' },
                    sunday: { open: null, close: null }
                }
            })),
            updateOccupancyPercentage: jest.fn((req, res) => res.status(200).json({
                success: true,
                occupancyPercentage: 75
            })),
            updateOpeningHours: jest.fn((req, res) => res.status(200).json({
                success: true,
                openingHours: {
                    weekdays: { open: '08:00', close: '21:00' },
                    saturday: { open: '10:00', close: '15:00' },
                    sunday: { open: null, close: null }
                }
            })),
        };

        app = express();
        app.use(express.json());
        app.use('/api/building', setupBuildingRoutes(mockBuildingController));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('📌 GET /', () => {
        it('Se llama al método del controlador getBuildingInfo', async () => {
            const response = await request(app).get('/api/building');

            expect(response.status).toBe(200);
            expect(mockBuildingController.getBuildingInfo).toHaveBeenCalled();
            expect(response.body).toHaveProperty('id', 'ada-byron');
            expect(response.body).toHaveProperty('name', 'Edificio Ada Byron');
            expect(response.body).toHaveProperty('floors', 4);
            expect(response.body).toHaveProperty('occupancyPercentage', 100);
            expect(response.body).toHaveProperty('openingHours');
        });
    });

    describe('📌 GET /occupancy', () => {
        it('Se llama al método del controlador getOccupancyPercentage', async () => {
            const response = await request(app).get('/api/building/occupancy');

            expect(response.status).toBe(200);
            expect(mockBuildingController.getOccupancyPercentage).toHaveBeenCalled();
            expect(response.body).toHaveProperty('occupancyPercentage', 100);
        });
    });

    describe('📌 GET /hours', () => {
        it('Se llama al método del controlador getOpeningHours', async () => {
            const response = await request(app).get('/api/building/hours');

            expect(response.status).toBe(200);
            expect(mockBuildingController.getOpeningHours).toHaveBeenCalled();
            expect(response.body).toHaveProperty('openingHours');
            expect(response.body.openingHours).toHaveProperty('weekdays');
            expect(response.body.openingHours).toHaveProperty('saturday');
            expect(response.body.openingHours).toHaveProperty('sunday');
        });
    });

    describe('📌 PUT /occupancy', () => {
        it('Se llama al método del controlador updateOccupancyPercentage con autenticación', async () => {
            const updateData = {
                percentage: 75
            };

            const response = await request(app).put('/api/building/occupancy').send(updateData);

            expect(response.status).toBe(200);
            expect(isAuthenticated).toHaveBeenCalled();
            expect(gerenteAuthorized).toHaveBeenCalled();
            expect(mockBuildingController.updateOccupancyPercentage).toHaveBeenCalled();
            expect(response.body).toEqual({
                success: true,
                occupancyPercentage: 75
            });
        });
    });

    describe('📌 PUT /hours', () => {
        it('Se llama al método del controlador updateOpeningHours con autenticación', async () => {
            const updateData = {
                day: 'saturday',
                hours: {
                    open: '10:00',
                    close: '15:00'
                }
            };

            const response = await request(app).put('/api/building/hours').send(updateData);

            expect(response.status).toBe(200);
            expect(isAuthenticated).toHaveBeenCalled();
            expect(gerenteAuthorized).toHaveBeenCalled();
            expect(mockBuildingController.updateOpeningHours).toHaveBeenCalled();
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('openingHours');
            expect(response.body.openingHours.saturday).toEqual({ open: '10:00', close: '15:00' });
        });
    });
});