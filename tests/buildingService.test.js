const BuildingService = require('../src/core/aplicacion/BuildingService');
const messageBroker = require('../src/core/infraestructura/messageBroker');
const Building = require('../src/core/dominio/Building');

jest.mock('../src/core/infraestructura/messageBroker');

describe('🔹 BuildingService', () => {
    let buildingService;
    
    beforeEach(() => {
        jest.clearAllMocks();
        
        buildingService = new BuildingService({ initializeConsumer: false });
        
        messageBroker.connect.mockResolvedValue();
        messageBroker.consume.mockImplementation((queue, callback) => {
            return Promise.resolve({ consumerTag: 'mock-consumer-tag' });
        });
        messageBroker.sendResponse.mockResolvedValue();
        
        messageBroker.channel = {
            assertQueue: jest.fn().mockResolvedValue()
        };
    });
    
    describe('📌 handleGetBuildingInfo', () => {
        it('Devuelve la información completa del edificio', async () => {
            const result = await buildingService.handleGetBuildingInfo();
            
            expect(result).toEqual({
                id: 'ada-byron',
                name: 'Edificio Ada Byron',
                floors: 4,
                occupancyPercentage: 100,
                openingHours: {
                    weekdays: { open: '08:00', close: '21:00' },
                    saturday: { open: '09:00', close: '14:00' },
                    sunday: { open: null, close: null }
                }
            });
        });
    });
    
    describe('📌 handleGetOccupancyPercentage', () => {
        it('Devuelve el porcentaje de ocupación del edificio', async () => {
            const result = await buildingService.handleGetOccupancyPercentage();
            
            expect(result).toEqual({
                occupancyPercentage: 100
            });
        });
    });
    
    describe('📌 handleGetOpeningHours', () => {
        it('Devuelve los horarios de apertura del edificio', async () => {
            const result = await buildingService.handleGetOpeningHours();
            
            expect(result).toEqual({
                openingHours: {
                    weekdays: { open: '08:00', close: '21:00' },
                    saturday: { open: '09:00', close: '14:00' },
                    sunday: { open: null, close: null }
                }
            });
        });
    });
    
    describe('📌 handleUpdateOccupancyPercentage', () => {
        it('Actualiza correctamente el porcentaje de ocupación', async () => {
            const newPercentage = 75;
            const result = await buildingService.handleUpdateOccupancyPercentage({ percentage: newPercentage });
            
            expect(buildingService.building._maxOccupancyPercentage).toBe(newPercentage);
            expect(result).toEqual({
                success: true,
                occupancyPercentage: newPercentage
            });
        });
        
        it('Da error cuando el porcentaje no es un número', async () => {
            await expect(buildingService.handleUpdateOccupancyPercentage({ percentage: 'no-número' }))
                .rejects.toThrow('Se requiere un porcentaje válido');
        });
        
        it('Da error cuando no se proporciona un porcentaje', async () => {
            await expect(buildingService.handleUpdateOccupancyPercentage({}))
                .rejects.toThrow('Se requiere un porcentaje válido');
            
            await expect(buildingService.handleUpdateOccupancyPercentage(null))
                .rejects.toThrow('Se requiere un porcentaje válido');
        });
        
        it('Da error cuando el porcentaje está fuera del rango 0-100', async () => {
            await expect(buildingService.handleUpdateOccupancyPercentage({ percentage: -10 }))
                .rejects.toThrow('El porcentaje debe estar entre 0 y 100');
                
            await expect(buildingService.handleUpdateOccupancyPercentage({ percentage: 110 }))
                .rejects.toThrow('El porcentaje debe estar entre 0 y 100');
        });
        
        it('Actualiza correctamente a valores límite', async () => {
            let result = await buildingService.handleUpdateOccupancyPercentage({ percentage: 0 });
            expect(buildingService.building._maxOccupancyPercentage).toBe(0);
            expect(result).toEqual({
                success: true,
                occupancyPercentage: 0
            });
            
            result = await buildingService.handleUpdateOccupancyPercentage({ percentage: 100 });
            expect(buildingService.building._maxOccupancyPercentage).toBe(100);
            expect(result).toEqual({
                success: true,
                occupancyPercentage: 100
            });
        });
    });
    
    describe('📌 handleUpdateOpeningHours', () => {
        it('Actualiza correctamente los horarios de un día específico', async () => {
            const newHours = {
                day: 'weekdays',
                hours: {
                    open: '07:00',
                    close: '20:00'
                }
            };
            
            const result = await buildingService.handleUpdateOpeningHours(newHours);
            
            expect(buildingService.building._openingHours.weekdays).toEqual({
                open: '07:00',
                close: '20:00'
            });
            
            expect(result).toEqual({
                success: true,
                openingHours: {
                    weekdays: { open: '07:00', close: '20:00' },
                    saturday: { open: '09:00', close: '14:00' },
                    sunday: { open: null, close: null }
                }
            });
        });
        
        it('Actualiza correctamente cuando se proporciona sólo un campo de hora', async () => {
            const updateOpenOnly = {
                day: 'weekdays',
                hours: {
                    open: '07:30'
                }
            };
            
            let result = await buildingService.handleUpdateOpeningHours(updateOpenOnly);
            
            expect(buildingService.building._openingHours.weekdays).toEqual({
                open: '07:30',
                close: '21:00'
            });
            
            const updateCloseOnly = {
                day: 'saturday',
                hours: {
                    close: '15:30'
                }
            };
            
            result = await buildingService.handleUpdateOpeningHours(updateCloseOnly);
            
            expect(buildingService.building._openingHours.saturday).toEqual({
                open: '09:00',
                close: '15:30'
            });
        });
        
        it('Establece correctamente horarios nulos para días cerrados', async () => {
            const closedDay = {
                day: 'sunday',
                hours: {
                    open: null,
                    close: null
                }
            };
            
            const result = await buildingService.handleUpdateOpeningHours(closedDay);
            
            expect(buildingService.building._openingHours.sunday).toEqual({
                open: null,
                close: null
            });
            
            expect(result.openingHours.sunday).toEqual({
                open: null,
                close: null
            });
        });
        
        it('Da error cuando no se proporcionan los datos requeridos', async () => {
            await expect(buildingService.handleUpdateOpeningHours(null))
                .rejects.toThrow('Se requieren datos válidos para actualizar horarios');
            
            await expect(buildingService.handleUpdateOpeningHours({}))
                .rejects.toThrow('Se requieren datos válidos para actualizar horarios');
            
            await expect(buildingService.handleUpdateOpeningHours({ day: 'weekdays' }))
                .rejects.toThrow('Se requieren datos válidos para actualizar horarios');
            
            await expect(buildingService.handleUpdateOpeningHours({ hours: { open: '08:00' } }))
                .rejects.toThrow('Se requieren datos válidos para actualizar horarios');
        });
        
        it('Da error cuando se proporciona un día inválido', async () => {
            const invalidDay = {
                day: 'friday',
                hours: {
                    open: '08:00',
                    close: '15:00'
                }
            };
            
            await expect(buildingService.handleUpdateOpeningHours(invalidDay))
                .rejects.toThrow('Día no válido. Debe ser weekdays, saturday o sunday');
        });
        
        it('Da error cuando se proporciona un formato de hora inválido', async () => {
            const invalidTimeFormat = {
                day: 'weekdays',
                hours: {
                    open: '8:00',
                    close: '20:00'
                }
            };
            
            await expect(buildingService.handleUpdateOpeningHours(invalidTimeFormat))
                .rejects.toThrow('Formato de hora inválido. Debe ser HH:MM o null');
            
            const invalidCloseFormat = {
                day: 'weekdays',
                hours: {
                    open: '08:00',
                    close: '24:00'
                }
            };
            
            await expect(buildingService.handleUpdateOpeningHours(invalidCloseFormat))
                .rejects.toThrow('Formato de hora inválido. Debe ser HH:MM o null');
        });
    });
    
    describe('📌 setupConsumers', () => {
        it('Se conecta al broker y hace setup de los consumidores', async () => {
            await buildingService.setupConsumers();
            
            expect(messageBroker.connect).toHaveBeenCalled();
            expect(messageBroker.channel.assertQueue).toHaveBeenCalledWith(
                buildingService.queueName, 
                { durable: true }
            );
            expect(messageBroker.consume).toHaveBeenCalledWith(
                buildingService.queueName, 
                expect.any(Function)
            );
        });
        
        it('Maneja errores de conexión', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            messageBroker.connect.mockRejectedValue(new Error('Connection error'));
            
            await buildingService.setupConsumers();
            
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining('Error en setupConsumers'), 
                expect.any(Error)
            );
        });
    });
});