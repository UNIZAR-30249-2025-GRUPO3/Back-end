const SpaceService = require('../src/core/aplicacion/SpaceService');
const messageBroker = require('../src/core/infraestructura/messageBroker');

jest.mock('../src/core/infraestructura/messageBroker');
jest.mock('../src/core/infraestructura/BD_SpaceRepository');
jest.mock('../src/core/aplicacion/BuildingService');
jest.mock('../src/core/aplicacion/UserService');

describe('🔹 SpaceService', () => {
    let spaceService;
    
    beforeEach(() => {
        jest.clearAllMocks();
        
        spaceService = new SpaceService();
  
        messageBroker.connect.mockResolvedValue();
        messageBroker.consume.mockImplementation((queue, callback) => {
            return Promise.resolve({ consumerTag: 'mock-consumer-tag' });
        });
        messageBroker.sendResponse.mockResolvedValue();
        
        spaceService.buildingService.handleGetOccupancyPercentage.mockResolvedValue({
            occupancyPercentage: 80
        });
        
        spaceService.buildingService.handleGetOpeningHours.mockResolvedValue({
            openingHours: {
                weekdays: { open: "08:00", close: "21:00" },
                saturday: { open: "09:00", close: "14:00" },
                sunday: { open: null, close: null }
            }
        });
        
        spaceService.buildingService.handleGetBuildingInfo.mockResolvedValue({
            occupancyPercentage: 80,
            openingHours: {
                weekdays: { open: "08:00", close: "21:00" },
                saturday: { open: "09:00", close: "14:00" },
                sunday: { open: null, close: null }
            }
        });
        
        // Mock de UserService
        spaceService.userService.handleGetUserById.mockImplementation(({ id }) => {
            if (id === 'valid-user-id') {
                return Promise.resolve({
                    id: 'valid-user-id',
                    name: 'Test User',
                    email: 'test@example.com',
                    role: ['docente-investigador']
                });
            } else if (id === 'investigador-id') {
                return Promise.resolve({
                    id: 'investigador-id',
                    name: 'Investigador',
                    email: 'investigador@example.com',
                    role: ['investigador contratado']
                });
            } else if (id === 'invalid-role-id') {
                return Promise.resolve({
                    id: 'invalid-role-id',
                    name: 'Invalid Role',
                    email: 'invalid@example.com',
                    role: ['estudiante']
                });
            } else {
                return Promise.reject(new Error('Usuario no encontrado'));
            }
        });
    });
    
    describe('📌 handleCreateSpace', () => {
        const validSpaceData = {
            name: 'Aula 1.01',
            floor: 1,
            capacity: 50,
            spaceType: 'aula',
            isReservable: true,
            reservationCategory: 'aula',
            assignmentTarget: {
                type: 'eina',
                targets: []
            },
            maxUsagePercentage: 70,
            customSchedule: {
                weekdays: { open: "08:00", close: "20:00" },
                saturday: { open: "09:00", close: "14:00" },
                sunday: { open: null, close: null }
            }
        };
        
        it('Crea un espacio correctamente', async () => {
            const savedSpace = { ...validSpaceData, id: 'space123' };
            spaceService.spaceRepository.save.mockResolvedValue(savedSpace);
            
            const result = await spaceService.handleCreateSpace(validSpaceData);
            
            expect(spaceService.spaceRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                name: validSpaceData.name,
                floor: validSpaceData.floor,
                capacity: validSpaceData.capacity,
                spaceType: validSpaceData.spaceType
            }));
            expect(result).toEqual(savedSpace);
        });
        
        it('Crea un espacio con valores del edificio cuando son nulos', async () => {
            const spaceDataWithNulls = {
                ...validSpaceData,
                maxUsagePercentage: null,
                customSchedule: null
            };
            
            const savedSpace = { 
                ...spaceDataWithNulls, 
                id: 'space123',
                maxUsagePercentage: 80,
                customSchedule: {
                    weekdays: { open: "08:00", close: "21:00" },
                    saturday: { open: "09:00", close: "14:00" },
                    sunday: { open: null, close: null }
                }
            };
            
            spaceService.spaceRepository.save.mockResolvedValue(savedSpace);
            
            const result = await spaceService.handleCreateSpace(spaceDataWithNulls);
            
            expect(spaceService.buildingService.handleGetOccupancyPercentage).toHaveBeenCalled();
            expect(spaceService.buildingService.handleGetOpeningHours).toHaveBeenCalled();
            expect(result).toEqual(savedSpace);
        });
        
        it('Valida correctamente la asignación a un docente-investigador', async () => {
            const spaceWithPersonAssignment = {
                ...validSpaceData,
                spaceType: 'despacho',
                isReservable: false,
                reservationCategory: null,
                assignmentTarget: {
                    type: 'person',
                    targets: ['valid-user-id']
                }
            };
            
            const savedSpace = { ...spaceWithPersonAssignment, id: 'space123' };
            spaceService.spaceRepository.save.mockResolvedValue(savedSpace);
            
            const result = await spaceService.handleCreateSpace(spaceWithPersonAssignment);
            
            expect(spaceService.userService.handleGetUserById).toHaveBeenCalledWith({ id: 'valid-user-id' });
            expect(result).toEqual(savedSpace);
        });
        
        it('Valida correctamente la asignación a un investigador contratado', async () => {
            const spaceWithPersonAssignment = {
                ...validSpaceData,
                spaceType: 'despacho',
                isReservable: false,
                reservationCategory: null,
                assignmentTarget: {
                    type: 'person',
                    targets: ['investigador-id']
                }
            };
            
            const savedSpace = { ...spaceWithPersonAssignment, id: 'space123' };
            spaceService.spaceRepository.save.mockResolvedValue(savedSpace);
            
            const result = await spaceService.handleCreateSpace(spaceWithPersonAssignment);
            
            expect(spaceService.userService.handleGetUserById).toHaveBeenCalledWith({ id: 'investigador-id' });
            expect(result).toEqual(savedSpace);
        });
        
        it('Da error cuando el nombre está vacío', async () => {
            const invalidSpaceData = {
                ...validSpaceData,
                name: ''
            };
            
            await expect(spaceService.handleCreateSpace(invalidSpaceData))
                .rejects.toThrow('El nombre del espacio es obligatorio.');
        });
        
        it('Da error cuando la planta no se especifica', async () => {
            const invalidSpaceData = {
                ...validSpaceData,
                floor: null
            };
            
            await expect(spaceService.handleCreateSpace(invalidSpaceData))
                .rejects.toThrow('La planta del espacio es obligatoria.');
        });
        
        it('Da error cuando la capacidad es 0 o negativa', async () => {
            const invalidSpaceData = {
                ...validSpaceData,
                capacity: 0
            };
            
            await expect(spaceService.handleCreateSpace(invalidSpaceData))
                .rejects.toThrow('La capacidad debe ser un número positivo.');
        });
        
        it('Da error cuando el tipo de espacio no se especifica', async () => {
            const invalidSpaceData = {
                ...validSpaceData,
                spaceType: null
            };
            
            await expect(spaceService.handleCreateSpace(invalidSpaceData))
                .rejects.toThrow('El tipo de espacio es obligatorio.');
        });
        
        it('Da error cuando se intenta crear un despacho reservable', async () => {
            const invalidSpaceData = {
                ...validSpaceData,
                spaceType: 'despacho',
                assignmentTarget: {
                    type: 'department',
                    targets: ['informática e ingeniería de sistemas']
                },
                isReservable: true,
                reservationCategory: 'despacho'
            };
            
            await expect(spaceService.handleCreateSpace(invalidSpaceData))
                .rejects.toThrow('Los despachos no pueden hacerse reservables.');
        });
        
        it('Da error cuando un aula no está asignado a la EINA', async () => {
            const invalidSpaceData = {
                ...validSpaceData,
                reservationCategory: 'aula',
                assignmentTarget: {
                    type: 'department',
                    targets: ['informática e ingeniería de sistemas']
                }
            };
            
            await expect(spaceService.handleCreateSpace(invalidSpaceData))
                .rejects.toThrow('Un espacio con categoría aula debe estar asignado a la EINA.');
        });
        
        it('Da error cuando se asigna a un usuario con rol no permitido', async () => {
            const invalidSpaceData = {
                ...validSpaceData,
                spaceType: 'despacho',
                isReservable: false,
                reservationCategory: null,
                assignmentTarget: {
                    type: 'person',
                    targets: ['invalid-role-id']
                }
            };
            
            await expect(spaceService.handleCreateSpace(invalidSpaceData))
                .rejects.toThrow('La asignación de usuarios no es válida');
        });
        
        it('Da error cuando se asigna a un usuario que no existe', async () => {
            const invalidSpaceData = {
                ...validSpaceData,
                spaceType: 'despacho',
                isReservable: false,
                reservationCategory: null,
                assignmentTarget: {
                    type: 'person',
                    targets: ['nonexistent-id']
                }
            };
            
            await expect(spaceService.handleCreateSpace(invalidSpaceData))
                .rejects.toThrow('La asignación de usuarios no es válida');
        });
    });
    
    describe('📌 handleGetSpaceById', () => {
        const existingSpace = {
            id: 'space123',
            name: 'Aula 1.01',
            floor: 1,
            capacity: 50,
            spaceType: 'aula',
            isReservable: true,
            reservationCategory: 'aula',
            assignmentTarget: {
                type: 'eina',
                targets: []
            },
            maxUsagePercentage: 70,
            customSchedule: {
                weekdays: { open: "08:00", close: "20:00" },
                saturday: { open: "09:00", close: "14:00" },
                sunday: { open: null, close: null }
            }
        };
        
        it('Obtiene un espacio por ID correctamente', async () => {
            spaceService.spaceRepository.findById.mockResolvedValue(existingSpace);
            
            const result = await spaceService.handleGetSpaceById({ id: 'space123' });
            
            expect(spaceService.spaceRepository.findById).toHaveBeenCalledWith('space123');
            expect(result).toEqual(existingSpace);
        });
        
        it('Completa información del edificio para valores nulos', async () => {
            const spaceWithNulls = {
                ...existingSpace,
                maxUsagePercentage: null,
                customSchedule: null
            };
            
            spaceService.spaceRepository.findById.mockResolvedValue(spaceWithNulls);
            
            const result = await spaceService.handleGetSpaceById({ id: 'space123' });
            
            expect(spaceService.buildingService.handleGetOccupancyPercentage).toHaveBeenCalled();
            expect(spaceService.buildingService.handleGetOpeningHours).toHaveBeenCalled();
            expect(result.maxUsagePercentage).toBe(80);
            expect(result.customSchedule).toEqual({
                weekdays: { open: "08:00", close: "21:00" },
                saturday: { open: "09:00", close: "14:00" },
                sunday: { open: null, close: null }
            });
        });
        
        it('Da error cuando no se proporciona un ID', async () => {
            await expect(spaceService.handleGetSpaceById({}))
                .rejects.toThrow('El campo "id" es requerido');
        });
        
        it('Da error cuando el espacio no se encuentra', async () => {
            spaceService.spaceRepository.findById.mockResolvedValue(null);
            
            await expect(spaceService.handleGetSpaceById({ id: 'nonexistent' }))
                .rejects.toThrow('Espacio no encontrado');
        });
    });
    
    describe('📌 handleGetAllSpaces', () => {
        const spaces = [
            {
                id: 'space1',
                name: 'Aula 1.01',
                floor: 1,
                capacity: 50,
                spaceType: 'aula',
                maxUsagePercentage: 70,
                customSchedule: { weekdays: { open: "08:00", close: "20:00" } }
            },
            {
                id: 'space2',
                name: 'Laboratorio 2.05',
                floor: 2,
                capacity: 25,
                spaceType: 'laboratorio',
                maxUsagePercentage: null,
                customSchedule: null
            }
        ];
        
        it('Obtiene todos los espacios correctamente', async () => {
            spaceService.spaceRepository.findAll.mockResolvedValue(spaces);
            
            const result = await spaceService.handleGetAllSpaces({});
            
            expect(spaceService.spaceRepository.findAll).toHaveBeenCalledWith({});
            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('space1');
            expect(result[1].id).toBe('space2');
        });
        
        it('Aplica filtros en la búsqueda', async () => {
            const filters = { floor: 1 };
            spaceService.spaceRepository.findAll.mockResolvedValue([spaces[0]]);
            
            const result = await spaceService.handleGetAllSpaces({ filters });
            
            expect(spaceService.spaceRepository.findAll).toHaveBeenCalledWith(filters);
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('space1');
        });
        
        it('Completa información del edificio para valores nulos', async () => {
            spaceService.spaceRepository.findAll.mockResolvedValue(spaces);
            
            const result = await spaceService.handleGetAllSpaces({});
            
            expect(spaceService.buildingService.handleGetBuildingInfo).toHaveBeenCalled();
            expect(result[0].maxUsagePercentage).toBe(70);
            expect(result[1].maxUsagePercentage).toBe(80);
            expect(result[1].customSchedule).toEqual({
                weekdays: { open: "08:00", close: "21:00" },
                saturday: { open: "09:00", close: "14:00" },
                sunday: { open: null, close: null }
            });
        });
    });
    
    describe('📌 handleUpdateSpace', () => {
        const existingSpace = {
            id: 'space123',
            name: 'Aula 1.01',
            floor: 1,
            capacity: 50,
            spaceType: 'aula',
            isReservable: true,
            reservationCategory: 'aula',
            assignmentTarget: {
                type: 'eina',
                targets: []
            },
            maxUsagePercentage: 70,
            customSchedule: {
                weekdays: { open: "08:00", close: "20:00" }
            },
            idSpace: "CRE.prueba",
            toObject: function() {
                const { toObject, ...rest } = this;
                return rest;
            }
        };
        
        it('Actualiza un espacio correctamente', async () => {
            const updateFields = {
                name: 'Aula 1.01 (Actualizada)',
                capacity: 60,
                reservationCategory: 'aula'
            };
            
            const updatedSpace = {
                ...existingSpace,
                ...updateFields
            };
            delete updatedSpace.toObject;
            
            spaceService.spaceRepository.findById.mockResolvedValue(existingSpace);
            spaceService.spaceRepository.update.mockResolvedValue(updatedSpace);
            
            const result = await spaceService.handleUpdateSpace({
                id: existingSpace.id,
                updateFields
            });
            
            expect(spaceService.spaceRepository.findById).toHaveBeenCalledWith(existingSpace.id);
            expect(spaceService.spaceRepository.update).toHaveBeenCalledWith(expect.objectContaining({
                id: existingSpace.id,
                name: updateFields.name,
                capacity: updateFields.capacity
            }));
            expect(result.name).toBe('Aula 1.01 (Actualizada)');
            expect(result.capacity).toBe(60);
        });
        
        it('Completa información del edificio para valores nulos al actualizar', async () => {
            const updateFields = {
                maxUsagePercentage: null,
                customSchedule: null,
                reservationCategory: 'aula'
            };
            
            const spaceObj = existingSpace.toObject();
            const updatedSpace = {
                ...spaceObj,
                ...updateFields,
                maxUsagePercentage: 80,
                customSchedule: {
                    weekdays: { open: "08:00", close: "21:00" },
                    saturday: { open: "09:00", close: "14:00" },
                    sunday: { open: null, close: null }
                }
            };
            
            spaceService.spaceRepository.findById.mockResolvedValue(existingSpace);
            spaceService.spaceRepository.update.mockResolvedValue(updatedSpace);
            
            const result = await spaceService.handleUpdateSpace({
                id: existingSpace.id,
                updateFields
            });
            
            expect(spaceService.buildingService.handleGetOccupancyPercentage).toHaveBeenCalled();
            expect(spaceService.buildingService.handleGetOpeningHours).toHaveBeenCalled();
            expect(result.maxUsagePercentage).toBe(80);
            expect(result.customSchedule).toEqual({
                weekdays: { open: "08:00", close: "21:00" },
                saturday: { open: "09:00", close: "14:00" },
                sunday: { open: null, close: null }
            });
        });
        
        it('Da error cuando no se proporciona un ID', async () => {
            await expect(spaceService.handleUpdateSpace({
                updateFields: { name: 'Nuevo nombre' }
            })).rejects.toThrow('El campo "id" es requerido');
        });
        
        it('Da error cuando no se proporciona ningún campo para actualizar', async () => {
            await expect(spaceService.handleUpdateSpace({
                id: 'space123',
                updateFields: {}
            })).rejects.toThrow('Se requieren campos para actualizar');
            
            await expect(spaceService.handleUpdateSpace({
                id: 'space123'
            })).rejects.toThrow('Se requieren campos para actualizar');
        });
        
        it('Da error cuando el espacio no se encuentra', async () => {
            spaceService.spaceRepository.findById.mockResolvedValue(null);
            
            await expect(spaceService.handleUpdateSpace({
                id: 'nonexistent',
                updateFields: { name: 'Nuevo nombre' }
            })).rejects.toThrow('Espacio no encontrado');
        });
        
        it('Da error al actualizar con un nombre vacío', async () => {
            const updateFields = {
                name: ''
            };
            
            spaceService.spaceRepository.findById.mockResolvedValue(existingSpace);
            
            await expect(spaceService.handleUpdateSpace({
                id: existingSpace.id,
                updateFields
            })).rejects.toThrow('El nombre del espacio es obligatorio.');
        });
        
        it('Da error al asignar a un usuario con rol no permitido', async () => {
            const updateFields = {
                assignmentTarget: {
                    type: 'person',
                    targets: ['invalid-role-id']
                }
            };
            
            spaceService.spaceRepository.findById.mockResolvedValue(existingSpace);
            
            await expect(spaceService.handleUpdateSpace({
                id: existingSpace.id,
                updateFields
            })).rejects.toThrow('La asignación de usuarios no es válida');
        });
    });
    
    describe('📌 handleDeleteSpace', () => {
        const existingSpace = {
            id: 'space123',
            name: 'Aula 1.01',
            floor: 1,
            capacity: 50,
            spaceType: 'aula'
        };
        
        it('Elimina un espacio correctamente', async () => {
            spaceService.spaceRepository.findById.mockResolvedValue(existingSpace);
            spaceService.spaceRepository.delete.mockResolvedValue({ acknowledged: true, deletedCount: 1 });
            
            const result = await spaceService.handleDeleteSpace({ id: 'space123' });
            
            expect(spaceService.spaceRepository.findById).toHaveBeenCalledWith('space123');
            expect(spaceService.spaceRepository.delete).toHaveBeenCalledWith('space123');
            expect(result).toEqual({
                id: 'space123',
                name: 'Aula 1.01',
                deletedAt: expect.any(String)
            });
        });
        
        it('Da error cuando no se proporciona un ID', async () => {
            await expect(spaceService.handleDeleteSpace({}))
                .rejects.toThrow('El campo "id" es requerido');
        });
        
        it('Da error cuando el espacio no se encuentra', async () => {
            spaceService.spaceRepository.findById.mockResolvedValue(null);
            
            await expect(spaceService.handleDeleteSpace({ id: 'nonexistent' }))
                .rejects.toThrow('Espacio no encontrado');
        });
    });
    
    describe('📌 handleFindSpacesByFloor', () => {
        const spaces = [
            {
                id: 'space1',
                name: 'Aula 1.01',
                floor: 1,
                capacity: 50,
                spaceType: 'aula'
            },
            {
                id: 'space2',
                name: 'Aula 1.02',
                floor: 1,
                capacity: 40,
                spaceType: 'aula'
            }
        ];
        
        it('Encuentra espacios por planta correctamente', async () => {
            spaceService.spaceRepository.findByFloor.mockResolvedValue(spaces);
            
            const result = await spaceService.handleFindSpacesByFloor({ floor: 1 });
            
            expect(spaceService.spaceRepository.findByFloor).toHaveBeenCalledWith(1);
            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('space1');
            expect(result[1].id).toBe('space2');
        });
        
        it('Completa información del edificio para valores nulos', async () => {
            const spacesWithNulls = spaces.map(space => ({
                ...space,
                maxUsagePercentage: null,
                customSchedule: null
            }));
            
            spaceService.spaceRepository.findByFloor.mockResolvedValue(spacesWithNulls);
            
            const result = await spaceService.handleFindSpacesByFloor({ floor: 1 });
            
            expect(spaceService.buildingService.handleGetBuildingInfo).toHaveBeenCalled();
            expect(result[0].maxUsagePercentage).toBe(80);
            expect(result[0].customSchedule).toEqual({
                weekdays: { open: "08:00", close: "21:00" },
                saturday: { open: "09:00", close: "14:00" },
                sunday: { open: null, close: null }
            });
        });
        
        it('Da error cuando no se especifica la planta', async () => {
            await expect(spaceService.handleFindSpacesByFloor({}))
                .rejects.toThrow('Se requiere especificar una planta');
            
            await expect(spaceService.handleFindSpacesByFloor(null))
                .rejects.toThrow('Se requiere especificar una planta');
        });
    });

    describe('📌 handleFindSpacesByCategory', () => {
        const spaces = [
            {
                id: 'space1',
                name: 'Aula 1.01',
                floor: 1,
                capacity: 50,
                spaceType: 'aula',
                reservationCategory: 'aula'
            },
            {
                id: 'space2',
                name: 'Seminario 2.03',
                floor: 2,
                capacity: 20,
                spaceType: 'seminario',
                reservationCategory: 'aula'
            }
        ];
        
        it('Encuentra espacios por categoría correctamente', async () => {
            spaceService.spaceRepository.findByCategory.mockResolvedValue(spaces);
            
            const result = await spaceService.handleFindSpacesByCategory({ category: 'aula' });
            
            expect(spaceService.spaceRepository.findByCategory).toHaveBeenCalledWith('aula');
            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('space1');
            expect(result[1].id).toBe('space2');
        });
        
        it('Completa información del edificio para valores nulos', async () => {
            const spacesWithNulls = spaces.map(space => ({
                ...space,
                maxUsagePercentage: null,
                customSchedule: null
            }));
            
            spaceService.spaceRepository.findByCategory.mockResolvedValue(spacesWithNulls);
            
            const result = await spaceService.handleFindSpacesByCategory({ category: 'aula' });
            
            expect(spaceService.buildingService.handleGetBuildingInfo).toHaveBeenCalled();
            expect(result[0].maxUsagePercentage).toBe(80);
            expect(result[0].customSchedule).toEqual({
                weekdays: { open: "08:00", close: "21:00" },
                saturday: { open: "09:00", close: "14:00" },
                sunday: { open: null, close: null }
            });
        });
        
        it('Da error cuando no se especifica la categoría', async () => {
            await expect(spaceService.handleFindSpacesByCategory({}))
                .rejects.toThrow('Se requiere especificar una categoría');
            
            await expect(spaceService.handleFindSpacesByCategory(null))
                .rejects.toThrow('Se requiere especificar una categoría');
        });
    });
    
    describe('📌 handleFindSpacesByDepartment', () => {
        const spaces = [
            {
                id: 'space3',
                name: 'Laboratorio 3.01',
                floor: 3,
                capacity: 30,
                spaceType: 'laboratorio',
                assignmentTarget: {
                    type: 'department',
                    targets: ['informática e ingeniería de sistemas']
                }
            },
            {
                id: 'space4',
                name: 'Despacho 2.10',
                floor: 2,
                capacity: 5,
                spaceType: 'despacho',
                assignmentTarget: {
                    type: 'department',
                    targets: ['informática e ingeniería de sistemas']
                }
            }
        ];
        
        it('Encuentra espacios por departamento correctamente', async () => {
            spaceService.spaceRepository.findByDepartment.mockResolvedValue(spaces);
            
            const result = await spaceService.handleFindSpacesByDepartment({ 
                department: 'informática e ingeniería de sistemas' 
            });
            
            expect(spaceService.spaceRepository.findByDepartment)
                .toHaveBeenCalledWith('informática e ingeniería de sistemas');
            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('space3');
            expect(result[1].id).toBe('space4');
        });
        
        it('Completa información del edificio para valores nulos', async () => {
            const spacesWithNulls = spaces.map(space => ({
                ...space,
                maxUsagePercentage: null,
                customSchedule: null
            }));
            
            spaceService.spaceRepository.findByDepartment.mockResolvedValue(spacesWithNulls);
            
            const result = await spaceService.handleFindSpacesByDepartment({ 
                department: 'informática e ingeniería de sistemas' 
            });
            
            expect(spaceService.buildingService.handleGetBuildingInfo).toHaveBeenCalled();
            expect(result[0].maxUsagePercentage).toBe(80);
            expect(result[0].customSchedule).toEqual({
                weekdays: { open: "08:00", close: "21:00" },
                saturday: { open: "09:00", close: "14:00" },
                sunday: { open: null, close: null }
            });
        });
        
        it('Da error cuando no se especifica el departamento', async () => {
            await expect(spaceService.handleFindSpacesByDepartment({}))
                .rejects.toThrow('Se requiere especificar un departamento');
            
            await expect(spaceService.handleFindSpacesByDepartment(null))
                .rejects.toThrow('Se requiere especificar un departamento');
        });
    });
    
    describe('📌 setupConsumers', () => {
        it('Se conecta al broker y hace setup de los consumidores', async () => {
            messageBroker.connect.mockClear();
            messageBroker.consume.mockClear();
            
            await spaceService.setupConsumers();
            
            expect(messageBroker.connect).toHaveBeenCalled();
            expect(messageBroker.consume).toHaveBeenCalledWith('space_operations', expect.any(Function));
        });
        
        it('Maneja errores de conexión', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            messageBroker.connect.mockRejectedValue(new Error('Connection error'));
            
            await spaceService.setupConsumers();
            
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error en setupConsumers'), expect.any(Error));
            
            consoleErrorSpy.mockRestore();
        });
    });
});   
  