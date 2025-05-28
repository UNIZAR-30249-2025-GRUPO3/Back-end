const BuildingController = require('../src/api/controllers/buildingController');
const messageBroker = require('../src/core/infraestructura/messageBroker');
const { v4: uuidv4 } = require('uuid');

jest.mock('../src/core/infraestructura/messageBroker');
jest.mock('uuid');

describe('🔹 BuildingController', () => {
  let buildingController;
  let req;
  let res;
  const mockUuid = '12345-mock-uuid';

  beforeEach(() => {
    jest.clearAllMocks();
    
    uuidv4.mockReturnValue(mockUuid);
    
    messageBroker.connect.mockResolvedValue();
    messageBroker.publish.mockResolvedValue();
    messageBroker.channel = {
      assertQueue: jest.fn().mockResolvedValue()
    };
    messageBroker.consume.mockImplementation((queue, callback) => {
      messageBroker.mockConsumerCallback = callback;
      return Promise.resolve({ consumerTag: 'test-consumer-tag' });
    });
    messageBroker.removeConsumer.mockResolvedValue();
    
    buildingController = new BuildingController();
    
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

  describe('📌 getBuildingInfo', () => {
    it('Se obtiene correctamente la información del edificio', async () => {
      const mockResponse = {
        id: "ada-byron",
        name: "Edificio Ada Byron",
        floors: 4,
        occupancyPercentage: 100,
        openingHours: {
          weekdays: { open: "08:00", close: "21:00" },
          saturday: { open: "09:00", close: "14:00" },
          sunday: { open: null, close: null }
        }
      };

      messageBroker.consumeReplies.mockResolvedValue();
      
      messageBroker.publish.mockImplementation(async (message, correlationId) => {
        const handler = messageBroker.responseHandlers[correlationId];
        if (handler) {
          handler.resolve(mockResponse);
        }
      });

      await buildingController.getBuildingInfo(req, res);

      expect(messageBroker.consumeReplies).toHaveBeenCalledWith('building_responses');
      expect(messageBroker.publish).toHaveBeenCalledWith(
        {
          operation: 'getBuildingInfo',
          data: {}
        },
        mockUuid,
        'building_responses',
        'building_operations'
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
    });

    it('Se maneja el error cuando la obtención de información del edificio falla', async () => {
      const mockError = { error: 'Error al obtener información del edificio' };

      messageBroker.consumeReplies.mockResolvedValue();
      
      messageBroker.publish.mockImplementation(async (message, correlationId) => {
        const handler = messageBroker.responseHandlers[correlationId];
        if (handler) {
          handler.resolve(mockError);
        }
      });

      await buildingController.getBuildingInfo(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(mockError);
    });


    it('Se maneja la excepción con el funcionamiento del broker', async () => {
      messageBroker.consumeReplies.mockResolvedValue();
      messageBroker.publish.mockRejectedValue(new Error('Connection error'));

      await buildingController.getBuildingInfo(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Connection error' });
    });


    it('Se manejan correctamente diferentes id de correlación', async () => {
      messageBroker.consumeReplies.mockResolvedValue();

      messageBroker.publish.mockImplementation(async (message, correlationId) => {
        const wrongCorrelationId = 'different-uuid';
        if (messageBroker.responseHandlers[wrongCorrelationId]) {
          messageBroker.responseHandlers[wrongCorrelationId].resolve({ id: '123' });
        }
      });

      const promise = buildingController.getBuildingInfo(req, res);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('📌 getOccupancyPercentage', () => {
    it('Se obtiene correctamente el porcentaje de ocupación', async () => {
      const mockResponse = { occupancyPercentage: 100 };

      messageBroker.consumeReplies.mockResolvedValue();

      messageBroker.publish.mockImplementation(async (message, correlationId) => {
        messageBroker.responseHandlers[correlationId].resolve(mockResponse);
      });

      await buildingController.getOccupancyPercentage(req, res);

      expect(messageBroker.publish).toHaveBeenCalledWith(
        {
          operation: 'getOccupancyPercentage',
          data: {}
        },
        mockUuid,
        'building_responses',
        'building_operations'
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
    });

    it('Se maneja el error cuando la obtención del porcentaje de ocupación falla', async () => {
      const mockError = { error: 'Error al obtener porcentaje de ocupación' };

      messageBroker.consumeReplies.mockResolvedValue();

      messageBroker.publish.mockImplementation(async (message, correlationId) => {
        messageBroker.responseHandlers[correlationId].resolve(mockError);
      });

      await buildingController.getOccupancyPercentage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(mockError);
    });
  });


  describe('📌 getOpeningHours', () => {
    it('Se obtienen correctamente los horarios de apertura', async () => {
      const mockResponse = {
        openingHours: {
          weekdays: { open: "08:00", close: "21:00" },
          saturday: { open: "09:00", close: "14:00" },
          sunday: { open: null, close: null }
        }
      };

      messageBroker.consumeReplies.mockResolvedValue();

      messageBroker.publish.mockImplementation(async (message, correlationId) => {
        messageBroker.responseHandlers[correlationId].resolve(mockResponse);
      });

      await buildingController.getOpeningHours(req, res);

      expect(messageBroker.publish).toHaveBeenCalledWith(
        {
          operation: 'getOpeningHours',
          data: {}
        },
        mockUuid,
        'building_responses',
        'building_operations'
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
    });

    it('Se maneja el error cuando la obtención de horarios falla', async () => {
      const mockError = { error: 'Error al obtener horarios de apertura' };

      messageBroker.consumeReplies.mockResolvedValue();

      messageBroker.publish.mockImplementation(async (message, correlationId) => {
        messageBroker.responseHandlers[correlationId].resolve(mockError);
      });

      await buildingController.getOpeningHours(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(mockError);
    });
  });


  describe('📌 updateOccupancyPercentage', () => {
    beforeEach(() => {
      req.body = {
        percentage: 75
      };
    });

    it('Se actualiza correctamente el porcentaje de ocupación', async () => {
      const mockResponse = {
        success: true,
        occupancyPercentage: 75
      };

      messageBroker.consumeReplies.mockResolvedValue();

      messageBroker.publish.mockImplementation(async (message, correlationId) => {
        messageBroker.responseHandlers[correlationId].resolve(mockResponse);
      });

      await buildingController.updateOccupancyPercentage(req, res);

      expect(messageBroker.publish).toHaveBeenCalledWith(
        {
          operation: 'updateOccupancyPercentage',
          data: { percentage: 75 }
        },
        mockUuid,
        'building_responses',
        'building_operations'
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
    });

    it('Se maneja el error cuando la actualización del porcentaje falla', async () => {
      const mockError = {
        error: 'Error al actualizar porcentaje de ocupación'
      };

      messageBroker.consumeReplies.mockResolvedValue();

      messageBroker.publish.mockImplementation(async (message, correlationId) => {
        messageBroker.responseHandlers[correlationId].resolve(mockError);
      });

      await buildingController.updateOccupancyPercentage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(mockError);
    });

    it('Retorna error 400 cuando el porcentaje no es un número', async () => {
      req.body = { percentage: 'no-es-número' };

      await buildingController.updateOccupancyPercentage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Se requiere un porcentaje válido' });
      expect(messageBroker.publish).not.toHaveBeenCalled();
    });
  });


  describe('📌 updateOpeningHours', () => {
    beforeEach(() => {
      req.body = {
        day: 'saturday',
        hours: {
          open: '10:00',
          close: '15:00'
        }
      };
    });

    it('Se actualizan correctamente los horarios de apertura', async () => {
      const mockResponse = {
        success: true,
        openingHours: {
          weekdays: { open: "08:00", close: "21:00" },
          saturday: { open: "10:00", close: "15:00" },
          sunday: { open: null, close: null }
        }
      };

      messageBroker.consumeReplies.mockResolvedValue();

      messageBroker.publish.mockImplementation(async (message, correlationId) => {
        messageBroker.responseHandlers[correlationId].resolve(mockResponse);
      });

      await buildingController.updateOpeningHours(req, res);

      expect(messageBroker.publish).toHaveBeenCalledWith(
        {
          operation: 'updateOpeningHours',
          data: {
            day: 'saturday',
            hours: {
              open: '10:00',
              close: '15:00'
            }
          }
        },
        mockUuid,
        'building_responses',
        'building_operations'
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
    });

    it('Se maneja el error cuando la actualización de horarios falla', async () => {
      const mockError = {
        error: 'Error al actualizar horarios de apertura'
      };

      messageBroker.consumeReplies.mockResolvedValue();

      messageBroker.publish.mockImplementation(async (message, correlationId) => {
        messageBroker.responseHandlers[correlationId].resolve(mockError);
      });

      await buildingController.updateOpeningHours(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(mockError);
    });

    it('Retorna error 400 cuando faltan datos para actualizar horarios', async () => {
      req.body = { day: 'saturday' };

      await buildingController.updateOpeningHours(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Se requieren datos válidos para actualizar horarios' });
      expect(messageBroker.publish).not.toHaveBeenCalled();
    });

    it('Retorna error 400 cuando faltan datos para actualizar horarios (2)', async () => {
      req.body = {
        hours: {
          open: '10:00',
          close: '15:00'
        }
      };

      await buildingController.updateOpeningHours(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Se requieren datos válidos para actualizar horarios' });
      expect(messageBroker.publish).not.toHaveBeenCalled();
    });
  });

});