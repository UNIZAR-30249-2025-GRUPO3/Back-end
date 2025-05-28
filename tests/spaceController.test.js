const SpaceController = require('../src/api/controllers/spaceController');
const messageBroker = require('../src/core/infraestructura/messageBroker');
const { v4: uuidv4 } = require('uuid');

jest.mock('../src/core/infraestructura/messageBroker');
jest.mock('uuid');

describe('🔹 SpaceController', () => {
  let spaceController;
  let req;
  let res;
  const mockUuid = '12345-mock-uuid';

  beforeEach(() => {
    jest.clearAllMocks();
    
    uuidv4.mockReturnValue(mockUuid);
    
    messageBroker.connect.mockResolvedValue();
    messageBroker.publish.mockResolvedValue();
    messageBroker.consume.mockImplementation((queue, callback) => {
      messageBroker.mockConsumerCallback = callback;
      return Promise.resolve({ consumerTag: 'test-consumer-tag' });
    });
    messageBroker.removeConsumer.mockResolvedValue();
    
    spaceController = new SpaceController();
    
    req = {
      body: {},
      params: {},
      session: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
  });

  describe('📌 createSpace', () => {
    beforeEach(() => {
      req.body = {
        name: 'Laboratorio de Informática',
        floor: 2,
        capacity: 30,
        spaceType: 'laboratorio',
        isReservable: true,
        reservationCategory: 'laboratorio',
        assignmentTarget: {
          type: 'department',
          targets: ['informática e ingeniería de sistemas']
        },
        maxUsagePercentage: 80,
        customSchedule: null
      };
    });

    it('Se crea con éxito un espacio', async () => {
      const mockResponse = {
        id: '123',
        name: 'Laboratorio de Informática',
        floor: 2,
        capacity: 30,
        spaceType: 'laboratorio',
        isReservable: true,
        reservationCategory: 'laboratorio',
        assignmentTarget: {
          type: 'department',
          targets: ['informática e ingeniería de sistemas']
        },
        maxUsagePercentage: 80,
        customSchedule: null
      };

      messageBroker.consumeReplies.mockResolvedValue();
            
      messageBroker.publish.mockImplementation(async (message, correlationId) => {
        const handler = messageBroker.responseHandlers[correlationId];
        if (handler) {
          handler.resolve(mockResponse);
        }
      });

      await spaceController.createSpace(req, res);

      expect(messageBroker.consumeReplies).toHaveBeenCalledWith('space_responses');
      expect(messageBroker.publish).toHaveBeenCalledWith(
        {
          operation: 'createSpace',
          data: req.body
        },
        mockUuid,
        'space_responses',
        'space_operations'
      );
      
      
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
    });

  it('Se maneja el error cuando la creación falla', async () => {
    const mockError = {
      error: 'Ya existe un espacio con ese nombre'
    };

    messageBroker.consumeReplies.mockResolvedValue();
          
    messageBroker.publish.mockImplementation(async (message, correlationId) => {
      const handler = messageBroker.responseHandlers[correlationId];
      if (handler) {
        handler.resolve(mockError);
      }
    });

    await spaceController.createSpace(req, res);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(mockError);
  });


    it('Se maneja la excepción con el funcionamiento del broker', async () => {
      messageBroker.consumeReplies.mockResolvedValue();
      messageBroker.publish.mockRejectedValue(new Error('Connection error'));

      await spaceController.createSpace(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Connection error' });
    });


    it('Se manejan correctamente diferentes id', async () => {
      messageBroker.consumeReplies.mockResolvedValue();
            
      messageBroker.publish.mockImplementation(async (message, correlationId) => {
        const handler = messageBroker.responseHandlers[correlationId];
        if (handler) {
          handler.resolve(mockResponse);
        }
      });
      
      await spaceController.createSpace(req, res);
      
      expect(res.status).not.toHaveBeenCalledWith(201);
      expect(messageBroker.removeConsumer).not.toHaveBeenCalled();
    });
  });

  describe('📌 getSpaceById', () => {
    beforeEach(() => {
      req.params = {
        id: '123'
      };
    });

    it('Se obtiene correctamente un espacio por su id', async () => {
      const mockResponse = {
        id: '123',
        name: 'Laboratorio de Informática',
        floor: 2,
        capacity: 30,
        spaceType: 'laboratorio',
        isReservable: true,
        reservationCategory: 'laboratorio',
        assignmentTarget: {
          type: 'department',
          targets: ['informática e ingeniería de sistemas']
        },
        maxUsagePercentage: 80,
        customSchedule: null
      };

      messageBroker.consumeReplies.mockResolvedValue();

      messageBroker.publish.mockImplementation(async (message, correlationId) => {
        messageBroker.responseHandlers[correlationId].resolve(mockResponse);
      });

      await spaceController.getSpaceById(req, res);

      expect(messageBroker.publish).toHaveBeenCalledWith(
        {
          operation: 'getSpaceById',
          data: { id: '123' }
        },
        mockUuid,
        'space_responses',
        'space_operations'
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
    });

    it('Se maneja el error cuando el espacio no es encontrado', async () => {
      const mockError = {
        error: 'Espacio no encontrado'
      };

      messageBroker.consumeReplies.mockResolvedValue();

      messageBroker.publish.mockImplementation(async (message, correlationId) => {
        messageBroker.responseHandlers[correlationId].resolve(mockError);
      });

      await spaceController.getSpaceById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(mockError);
    });
  });


  describe('📌 updateSpace', () => {
    beforeEach(() => {
      req.params = {
        id: '123'
      };
      req.body = {
        reservationCategory: 'laboratorio',
        maxUsagePercentage: 90,
        isReservable: true
      };
    });

    it('Se actualiza correctamente un espacio', async () => {
      const mockResponse = {
        id: '123',
        name: 'Laboratorio de Informática',
        floor: 2,
        capacity: 30,
        spaceType: 'laboratorio',
        isReservable: true,
        reservationCategory: 'laboratorio',
        assignmentTarget: {
          type: 'department',
          targets: ['informática e ingeniería de sistemas']
        },
        maxUsagePercentage: 90,
        customSchedule: null
      };

      messageBroker.consumeReplies.mockResolvedValue();

      messageBroker.publish.mockImplementation(async (message, correlationId) => {
        messageBroker.responseHandlers[correlationId].resolve(mockResponse);
      });

      await spaceController.updateSpace(req, res);

      expect(messageBroker.publish).toHaveBeenCalledWith(
        {
          operation: 'updateSpace',
          data: {
            id: '123',
            updateFields: {
              reservationCategory: 'laboratorio',
              maxUsagePercentage: 90,
              isReservable: true
            }
          }
        },
        mockUuid,
        'space_responses',
        'space_operations'
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
    });

    it('Se maneja el error cuando la actualización del espacio falla', async () => {
        const mockError = {
          error: 'Error al actualizar espacio'
        };

        messageBroker.consumeReplies.mockResolvedValue();

        messageBroker.publish.mockImplementation(async (message, correlationId) => {
          messageBroker.responseHandlers[correlationId].resolve(mockError);
        });

        await spaceController.updateSpace(req, res);

        expect(messageBroker.publish).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(mockError);
      });
  });


  describe('📌 deleteSpace', () => {
    beforeEach(() => {
      req.params = { id: '123' };
    });

    it('Se elimina correctamente un espacio', async () => {
      const mockResponse = {
        id: '123',
        name: 'Laboratorio de Informática',
        deletedAt: '2025-03-29T12:00:00.000Z'
      };

      messageBroker.consumeReplies.mockResolvedValue();

      messageBroker.publish.mockImplementation(async (_msg, correlationId) => {
        messageBroker.responseHandlers[correlationId].resolve(mockResponse);
      });

      await spaceController.deleteSpace(req, res);

      expect(messageBroker.publish).toHaveBeenCalledWith(
        {
          operation: 'deleteSpace',
          data: { id: '123' }
        },
        mockUuid,
        'space_responses',
        'space_operations'
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
    });

    it('Se maneja el error cuando una eliminación falla', async () => {
      const mockError = {
        error: 'Espacio no encontrado'
      };

      messageBroker.consumeReplies.mockResolvedValue();

      messageBroker.publish.mockImplementation(async (_msg, correlationId) => {
        messageBroker.responseHandlers[correlationId].resolve(mockError);
      });

      await spaceController.deleteSpace(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(mockError);
    });

  });


describe('📌 getAllSpaces', () => {
  it('Se obtienen correctamente todos los espacios', async () => {
    const mockResponse = [
      {
        id: '123',
        name: 'Laboratorio de Informática',
        floor: 2,
        capacity: 30,
        spaceType: 'laboratorio',
        isReservable: true,
        reservationCategory: 'laboratorio',
        assignmentTarget: {
          type: 'department',
          targets: ['informática e ingeniería de sistemas']
        }
      },
      {
        id: '456',
        name: 'Aula Magna',
        floor: 1,
        capacity: 200,
        spaceType: 'aula',
        isReservable: true,
        reservationCategory: 'aula',
        assignmentTarget: {
          type: 'eina',
          targets: []
        }
      }
    ];

    messageBroker.consumeReplies.mockResolvedValue();

    messageBroker.publish.mockImplementation(async (_msg, correlationId) => {
      messageBroker.responseHandlers[correlationId].resolve(mockResponse);
    });

    await spaceController.getAllSpaces(req, res);

    expect(messageBroker.publish).toHaveBeenCalledWith(
      {
        operation: 'getAllSpaces',
        data: {}
      },
      mockUuid,
      'space_responses',
      'space_operations'
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockResponse);
  });

  it('Se maneja el error cuando la obtención de espacios falla', async () => {
    const mockError = { error: 'Error en la base de datos' };

    messageBroker.consumeReplies.mockResolvedValue();

    messageBroker.publish.mockImplementation(async (_msg, correlationId) => {
      messageBroker.responseHandlers[correlationId].resolve(mockError);
    });

    await spaceController.getAllSpaces(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(mockError);
  });
});


  describe('📌 findSpacesByFloor', () => {
    beforeEach(() => {
      req.params = {
        floor: '2'
      };
    });

    it('Se obtienen correctamente los espacios por planta', async () => {
      const mockResponse = [
        {
          id: '123',
          name: 'Laboratorio de Informática',
          floor: 2,
          capacity: 30,
          spaceType: 'laboratorio',
          isReservable: true,
          reservationCategory: 'laboratorio',
          assignmentTarget: {
            type: 'department',
            targets: ['informática e ingeniería de sistemas']
          }
        },
        {
          id: '789',
          name: 'Sala de Reuniones',
          floor: 2,
          capacity: 15,
          spaceType: 'sala común',
          isReservable: true,
          reservationCategory: 'sala común',
          assignmentTarget: {
            type: 'department',
            targets: ['administración']
          }
        }
      ];

      messageBroker.consumeReplies.mockResolvedValue();

      messageBroker.publish.mockImplementation(async (_msg, correlationId) => {
        messageBroker.responseHandlers[correlationId].resolve(mockResponse);
      });

      await spaceController.findSpacesByFloor(req, res);

      expect(messageBroker.publish).toHaveBeenCalledWith(
        {
          operation: 'findSpacesByFloor',
          data: { floor: 2 }
        },
        mockUuid,
        'space_responses',
        'space_operations'
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
    });

    it('Se maneja el error en la búsqueda por planta', async () => {
      const mockError = {
        error: 'Error al buscar espacios por planta'
      };

      messageBroker.consumeReplies.mockResolvedValue();

      messageBroker.publish.mockImplementation(async (_msg, correlationId) => {
        messageBroker.responseHandlers[correlationId].resolve(mockError);
      });

      await spaceController.findSpacesByFloor(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(mockError);
    });
  });


  describe('📌 findSpacesByCategory', () => {
    beforeEach(() => {
      req.params = {
        category: 'laboratorio'
      };
    });

    it('Se obtienen correctamente los espacios por categoría', async () => {
      const mockResponse = [
        {
          id: '123',
          name: 'Laboratorio de Informática',
          floor: 2,
          capacity: 30,
          spaceType: 'laboratorio',
          isReservable: true,
          reservationCategory: 'laboratorio',
          assignmentTarget: {
            type: 'department',
            targets: ['informática e ingeniería de sistemas']
          }
        },
        {
          id: '456',
          name: 'Laboratorio de Electrónica',
          floor: 1,
          capacity: 25,
          spaceType: 'laboratorio',
          isReservable: true,
          reservationCategory: 'laboratorio',
          assignmentTarget: {
            type: 'department',
            targets: ['ingeniería electrónica']
          }
        }
      ];

      messageBroker.consumeReplies.mockResolvedValue();

      messageBroker.publish.mockImplementation(async (_msg, correlationId) => {
        messageBroker.responseHandlers[correlationId].resolve(mockResponse);
      });

      await spaceController.findSpacesByCategory(req, res);

      expect(messageBroker.publish).toHaveBeenCalledWith(
        {
          operation: 'findSpacesByCategory',
          data: { category: 'laboratorio' }
        },
        mockUuid,
        'space_responses',
        'space_operations'
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
    });

    it('Se maneja el error en la búsqueda por categoría', async () => {
      const mockError = {
        error: 'Error al buscar espacios por categoría'
      };

      messageBroker.consumeReplies.mockResolvedValue();

      messageBroker.publish.mockImplementation(async (_msg, correlationId) => {
        messageBroker.responseHandlers[correlationId].resolve(mockError);
      });

      await spaceController.findSpacesByCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(mockError);
    });
  });

});