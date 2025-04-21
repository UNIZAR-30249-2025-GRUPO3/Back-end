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
        name: 'Edificio Ada Byron',
        address: 'C. María de Luna, 1, 50018 Zaragoza',
        floors: 3,
        occupancy: 75
      };

      await buildingController.getBuildingInfo(req, res);

      expect(messageBroker.channel.assertQueue).toHaveBeenCalledWith('building_responses', { durable: true });
      expect(messageBroker.publish).toHaveBeenCalledWith(
        {
          operation: 'getBuildingInfo',
          data: {}
        },
        mockUuid,
        'building_responses',
        'building_operations'
      );
      
      await messageBroker.mockConsumerCallback(mockResponse, mockUuid);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
      expect(messageBroker.removeConsumer).toHaveBeenCalledWith('building_responses');
    });

    it('Se maneja el error cuando la obtención de información del edificio falla', async () => {
      const mockError = {
        error: 'Error al obtener información del edificio'
      };

      await buildingController.getBuildingInfo(req, res);

      expect(messageBroker.publish).toHaveBeenCalled();
      
      await messageBroker.mockConsumerCallback(mockError, mockUuid);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(mockError);
      expect(messageBroker.removeConsumer).toHaveBeenCalledWith('building_responses');
    });

    it('Se maneja la excepción con el funcionamiento del broker', async () => {
      messageBroker.publish.mockRejectedValue(new Error('Connection error'));

      await buildingController.getBuildingInfo(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Connection error' });
    });

    it('Se manejan correctamente diferentes id de correlación', async () => {
      await buildingController.getBuildingInfo(req, res);
      
      expect(messageBroker.publish).toHaveBeenCalled();
      
      await messageBroker.mockConsumerCallback({ id: '123' }, 'different-uuid');
      
      expect(res.status).not.toHaveBeenCalled();
      expect(messageBroker.removeConsumer).not.toHaveBeenCalled();
    });
  });

  describe('📌 getOccupancyPercentage', () => {
    it('Se obtiene correctamente el porcentaje de ocupación', async () => {
      const mockResponse = {
        occupancyPercentage: 75
      };

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
      
      await messageBroker.mockConsumerCallback(mockResponse, mockUuid);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
      expect(messageBroker.removeConsumer).toHaveBeenCalledWith('building_responses');
    });

    it('Se maneja el error cuando la obtención del porcentaje de ocupación falla', async () => {
      const mockError = {
        error: 'Error al obtener porcentaje de ocupación'
      };

      await buildingController.getOccupancyPercentage(req, res);

      expect(messageBroker.publish).toHaveBeenCalled();
      
      await messageBroker.mockConsumerCallback(mockError, mockUuid);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(mockError);
      expect(messageBroker.removeConsumer).toHaveBeenCalledWith('building_responses');
    });
  });

  describe('📌 getOpeningHours', () => {
    it('Se obtienen correctamente los horarios de apertura', async () => {
      const mockResponse = {
        openingHours: {
          monday: '8:00-21:00',
          tuesday: '8:00-21:00',
          wednesday: '8:00-21:00',
          thursday: '8:00-21:00',
          friday: '8:00-20:00',
          saturday: '9:00-14:00',
          sunday: 'Cerrado'
        }
      };

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
      
      await messageBroker.mockConsumerCallback(mockResponse, mockUuid);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
      expect(messageBroker.removeConsumer).toHaveBeenCalledWith('building_responses');
    });

    it('Se maneja el error cuando la obtención de horarios falla', async () => {
      const mockError = {
        error: 'Error al obtener horarios de apertura'
      };

      await buildingController.getOpeningHours(req, res);

      expect(messageBroker.publish).toHaveBeenCalled();
      
      await messageBroker.mockConsumerCallback(mockError, mockUuid);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(mockError);
      expect(messageBroker.removeConsumer).toHaveBeenCalledWith('building_responses');
    });
  });

  describe('📌 updateOccupancyPercentage', () => {
    beforeEach(() => {
      req.body = {
        percentage: 80
      };
    });

    it('Se actualiza correctamente el porcentaje de ocupación', async () => {
      const mockResponse = {
        occupancyPercentage: 80,
        updated: true
      };

      await buildingController.updateOccupancyPercentage(req, res);

      expect(messageBroker.publish).toHaveBeenCalledWith(
        {
          operation: 'updateOccupancyPercentage',
          data: { percentage: 80 }
        },
        mockUuid,
        'building_responses',
        'building_operations'
      );
      
      await messageBroker.mockConsumerCallback(mockResponse, mockUuid);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
      expect(messageBroker.removeConsumer).toHaveBeenCalledWith('building_responses');
    });

    it('Se maneja el error cuando la actualización del porcentaje falla', async () => {
      const mockError = {
        error: 'Error al actualizar porcentaje de ocupación'
      };

      await buildingController.updateOccupancyPercentage(req, res);

      expect(messageBroker.publish).toHaveBeenCalled();
      
      await messageBroker.mockConsumerCallback(mockError, mockUuid);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(mockError);
      expect(messageBroker.removeConsumer).toHaveBeenCalledWith('building_responses');
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
        day: 'monday',
        hours: '9:00-22:00'
      };
    });

    it('Se actualizan correctamente los horarios de apertura', async () => {
      const mockResponse = {
        day: 'monday',
        hours: '9:00-22:00',
        updated: true
      };

      await buildingController.updateOpeningHours(req, res);

      expect(messageBroker.publish).toHaveBeenCalledWith(
        {
          operation: 'updateOpeningHours',
          data: { day: 'monday', hours: '9:00-22:00' }
        },
        mockUuid,
        'building_responses',
        'building_operations'
      );
      
      await messageBroker.mockConsumerCallback(mockResponse, mockUuid);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
      expect(messageBroker.removeConsumer).toHaveBeenCalledWith('building_responses');
    });

    it('Se maneja el error cuando la actualización de horarios falla', async () => {
      const mockError = {
        error: 'Error al actualizar horarios de apertura'
      };

      await buildingController.updateOpeningHours(req, res);

      expect(messageBroker.publish).toHaveBeenCalled();
      
      await messageBroker.mockConsumerCallback(mockError, mockUuid);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(mockError);
      expect(messageBroker.removeConsumer).toHaveBeenCalledWith('building_responses');
    });

    it('Retorna error 400 cuando faltan datos para actualizar horarios', async () => {
      req.body = { day: 'monday' };
      
      await buildingController.updateOpeningHours(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Se requieren datos válidos para actualizar horarios' });
      expect(messageBroker.publish).not.toHaveBeenCalled();
    });

    it('Retorna error 400 cuando faltan datos para actualizar horarios (2)', async () => {
      req.body = { hours: '9:00-22:00' };
      
      await buildingController.updateOpeningHours(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Se requieren datos válidos para actualizar horarios' });
      expect(messageBroker.publish).not.toHaveBeenCalled();
    });
  });
});