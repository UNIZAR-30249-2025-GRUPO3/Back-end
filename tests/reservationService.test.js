const ReservationService = require('../src/core/aplicacion/ReservationService');
const messageBroker = require('../src/core/infraestructura/messageBroker');
const BD_ReservationRepository = require('../src/core/infraestructura/BD_ReservationRepository');
const UserService = require('../src/core/aplicacion/UserService');
const SpaceService = require('../src/core/aplicacion/SpaceService');

jest.mock('../src/core/infraestructura/messageBroker');
jest.mock('../src/core/infraestructura/BD_ReservationRepository');
jest.mock('../src/core/aplicacion/UserService');
jest.mock('../src/core/aplicacion/SpaceService');

describe('🔹 ReservationService', () => {
    let reservationService;
    
    let mockUserService;
    let mockSpaceService;
    let mockReservationRepository;

    beforeEach(() => {
        jest.clearAllMocks();

        mockUserService = {
            handleGetUserById: jest.fn()
        };

        mockSpaceService = {
            handleGetSpaceById: jest.fn()
        };

        mockReservationRepository = {
            save: jest.fn(),
            findOverlappingReservations: jest.fn(),
            findByUserId: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
        };

        reservationService = new ReservationService();

        reservationService.userService = mockUserService;
        reservationService.spaceService = mockSpaceService;
        reservationService.reservationRepository = mockReservationRepository;

        reservationService.messageBroker = {
            connect: jest.fn().mockResolvedValue(),
            consume: jest.fn().mockImplementation((queue, callback) => Promise.resolve({ consumerTag: 'mock-consumer-tag' })),
            sendResponse: jest.fn().mockResolvedValue()
        };

        mockUserService.handleGetUserById.mockImplementation(({ id }) => {
            const users = {
                'docente-id': {
                    id: 'docente-id',
                    name: 'Docente Ejemplo',
                    email: 'docente@example.com',
                    role: {
                        roles: ['docente-investigador']
                    },
                    department: {name:'informática e ingeniería de sistemas'}
                },
                'tecnico-id': {
                    id: 'tecnico-id',
                    name: 'Técnico Ejemplo',
                    email: 'tecnico@example.com',
                    role: {
                        roles: ['técnico de laboratorio']
                    },
                    department: {name:'informática e ingeniería de sistemas'}
                },
                'estudiante-id': {
                    id: 'estudiante-id',
                    name: 'Estudiante Ejemplo',
                    email: 'estudiante@example.com',
                    role: {
                        roles: ['estudiante']
                    }
                },
                'tecnico-otro-dep': {
                    id: 'tecnico-otro-dep',
                    name: 'Técnico Ejemplo',
                    email: 'tecnico2@example.com',
                    role: {
                        roles: ['técnico de laboratorio']
                    },
                    department:{name: 'ingeniería electrónica y comunicaciones'}
                }
            };
            return Promise.resolve(users[id] || null);
        });

        mockSpaceService.handleGetSpaceById.mockImplementation(({ id }) => {
            const spaces = {
                'aula-123': {
                    id: 'aula-123',
                    name: 'Aula 1.01',
                    capacity: 40,
                    isReservable: true,
                    reservationCategory: {
                        name: 'aula'
                    },
                    maxUsagePercentage: 80,
                    assignmentTarget: {
                        type: 'eina',
                        targets: []
                    },
                    customSchedule: {
                        weekdays: {
                            open: "08:00",
                            close: "21:00"
                        },
                        saturday: {
                            open: "09:00",
                            close: "14:00"
                        },
                        sunday: {
                            open: null,
                            close: null
                        }
                    }
                },
                'lab-456': {
                    id: 'lab-456',
                    name: 'Laboratorio 2.03',
                    capacity: 20,
                    isReservable: true,
                    reservationCategory: {
                        name: 'laboratorio'
                    },
                    maxUsagePercentage: 70,
                    assignmentTarget: {
                        type: 'department',
                        targets: ['informática e ingeniería de sistemas']
                    },
                    customSchedule: {
                        weekdays: {
                            open: "08:00",
                            close: "21:00"
                        },
                        saturday: {
                            open: "09:00",
                            close: "14:00"
                        },
                        sunday: {
                            open: null,
                            close: null
                        }
                    }
                },
                'sala-789': {
                    id: 'sala-789',
                    name: 'Sala Común',
                    capacity: 15,
                    isReservable: true,
                    reservationCategory: {
                        name: 'sala común'
                    },
                    maxUsagePercentage: 100,
                    assignmentTarget: {
                        type: 'eina',
                        targets: []
                    },
                    customSchedule: {
                        weekdays: {
                            open: "08:00",
                            close: "21:00"
                        },
                        saturday: {
                            open: "09:00",
                            close: "14:00"
                        },
                        sunday: {
                            open: null,
                            close: null
                        }
                    }
                },
                'despacho-999': {
                    id: 'despacho-999',
                    name: 'Despacho 3.01',
                    capacity: 1,
                    isReservable: false,
                    reservationCategory: {
                        name: 'despacho'
                    },
                    assignmentTarget: {
                        type: 'person',
                        targets: ['docente-id']
                    },
                    customSchedule: {
                        weekdays: {
                            open: "08:00",
                            close: "21:00"
                        },
                        saturday: {
                            open: "09:00",
                            close: "14:00"
                        },
                        sunday: {
                            open: null,
                            close: null
                        }
                    }
                }
            };
            return Promise.resolve(spaces[id] || null);
        });

        mockReservationRepository.save.mockImplementation(reservation =>
            Promise.resolve({ ...reservation, id: 'reserva-mock-id' })
        );

        mockReservationRepository.findOverlappingReservations.mockResolvedValue([]);
    });

    
    describe('📌 handleCreateReservation', () => {
        const validReservationData = {
            userId: 'docente-id',
            spaceIds: ['aula-123'],
            usageType: 'docencia',
            maxAttendees: 30,
            startTime: '2025-06-26T10:00:00Z',
            duration: 60,
        };
        
        it('Crea una reserva válida para docente en aula', async () => {
            const result = await reservationService.handleCreateReservation(validReservationData);
            
            expect(reservationService.userService.handleGetUserById).toHaveBeenCalledWith({ id: 'docente-id' });
            expect(reservationService.spaceService.handleGetSpaceById).toHaveBeenCalledWith({ id: 'aula-123' });
            expect(reservationService.reservationRepository.save).toHaveBeenCalled();
            expect(result).toHaveProperty('id', 'reserva-mock-id');
            expect(result).toHaveProperty('status', 'valid');
        });
        
        it('Permite reserva de sala común a estudiante', async () => {
            const estudianteReservation = {
                ...validReservationData,
                userId: 'estudiante-id',
                spaceIds: ['sala-789'],
                maxAttendees: 10
            };
            
            const result = await reservationService.handleCreateReservation(estudianteReservation);
            expect(result).toHaveProperty('id', 'reserva-mock-id');
        });
        
        it('Rechaza reserva de aula por estudiante', async () => {
            const invalidReservation = {
                ...validReservationData,
                userId: 'estudiante-id'
            };
            
            await expect(reservationService.handleCreateReservation(invalidReservation))
                .rejects.toThrow('Los estudiantes solo pueden reservar salas comunes');
        });
        
        it('Rechaza reserva de laboratorio por técnico de otro departamento', async () => {
            reservationService.userService.handleGetUserById.mockResolvedValueOnce({
                id: 'tecnico-otro-dep',
                role: {
                    roles: ['técnico de laboratorio']
                },
                department: 'ingeniería electrónica y comunicaciones'
            });

            const invalidReservation = {
                userId: 'tecnico-otro-dep',
                spaceIds: ['lab-456'], 
                usageType: 'investigacion',
                maxAttendees: 10, 
                startTime: '2025-04-25T16:00:00Z',
                duration: 120,
            };
            
            await expect(reservationService.handleCreateReservation(invalidReservation))
                .rejects.toThrow('El rol no puede reservar este tipo de espacio o no pertenece a su departamento');
        });
        
        it('Rechaza reserva cuando el espacio no es reservable', async () => {
            const invalidReservation = {
                ...validReservationData,
                spaceIds: ['despacho-999']
            };
            
            await expect(reservationService.handleCreateReservation(invalidReservation))
                .rejects.toThrow('El espacio no es reservable');
        });
        
        it('Rechaza reserva cuando excede capacidad máxima', async () => {
            const invalidReservation = {
                ...validReservationData,
                maxAttendees: 50 // Aula tiene capacidad 40 y 80% de uso máximo = 32
            };
            
            await expect(reservationService.handleCreateReservation(invalidReservation))
                .rejects.toThrow('El número de asistentes (50) excede la capacidad total permitida (32) de los espacios seleccionados.');
        });
        
        it('Rechaza reserva con horario solapado', async () => {
            reservationService.reservationRepository.findOverlappingReservations.mockResolvedValueOnce([{
                id: 'reserva-existente',
                spaceId: 'aula-123',
                startTime: '2025-06-30T10:30:00Z',
                duration: 60
            }]);
            
            await expect(reservationService.handleCreateReservation(validReservationData))
                .rejects.toThrow('El espacio ya está reservado en el periodo de tiempo solicitado');
        });
    });

    describe('📌 handleValidateReservation', () => {
        let reservationService;
        
        beforeEach(() => {
            reservationService = new ReservationService();
            
            reservationService.reservationRepository = {
                findById: jest.fn(),
                update: jest.fn()
            };
            
            reservationService.validateUserCanReserveSpace = jest.fn().mockResolvedValue(true);
        });
    
        it('debería fallar si la reserva no existe', async () => {
            reservationService.reservationRepository.findById.mockResolvedValue(null);
            
            await expect(
                reservationService.handleValidateReservation({ id: 'reserva-inexistente' })
            ).rejects.toThrow('Reserva no encontrada');
        });
    
        it('debería fallar si no se proporciona ID', async () => {
            await expect(
                reservationService.handleValidateReservation({})
            ).rejects.toThrow('El campo "id" es requerido');
        });
    
    });
    
    describe('📌 handleInvalidReservation', () => {
        it('Invalida una reserva existente', async () => {
            const reservaValida = {
                id: 'reserva-valida',
                userId: 'docente-id',
                status: 'valid'
            };
            
            reservationService.reservationRepository.findById.mockResolvedValueOnce(reservaValida);
            reservationService.reservationRepository.update.mockImplementation((updated) =>
                Promise.resolve(updated)
            );

            
            const result = await reservationService.handleInvalidReservation({ id: 'reserva-valida' });
            
            expect(result).toHaveProperty('status', 'potentially_invalid');
        });
    });
    
    describe('📌 handleGetReservationsByUser', () => {
        it('Obtiene reservas de un usuario', async () => {
            const mockReservas = [
                { id: 'reserva-1', userId: 'docente-id' },
                { id: 'reserva-2', userId: 'docente-id' }
            ];
            
            reservationService.reservationRepository.findByUserId.mockResolvedValueOnce(mockReservas);
            
            const result = await reservationService.handleGetReservationsByUser({ userId: 'docente-id' });
            
            expect(result).toHaveLength(2);
            expect(reservationService.reservationRepository.findByUserId).toHaveBeenCalledWith('docente-id');
        });
    });
});