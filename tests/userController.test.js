const UserController = require('../src/api/controllers/userController');
const messageBroker = require('../src/core/infraestructura/messageBroker');
const { v4: uuidv4 } = require('uuid');

jest.mock('../src/core/infraestructura/messageBroker');
jest.mock('uuid');

describe('🔹 UserController', () => {
  let userController;
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
    
    userController = new UserController();
    
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

  describe('📌 createUser', () => {
    beforeEach(() => {
      req.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: ['estudiante'],
        department: 'informática e ingeniería de sistemas'
      };
    });

    it('Se crea con exito un usuario', async () => {

      const mockResponse = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        role: ['estudiante'],
        department: 'informática e ingeniería de sistemas'
      };

      await userController.createUser(req, res);

      expect(messageBroker.publish).toHaveBeenCalledWith(
        {
          operation: 'createUser',
          data: req.body
        },
        mockUuid,
        'user_responses',
        'user_operations'
      );
      
      
      await messageBroker.mockConsumerCallback(mockResponse, mockUuid);
      
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
      expect(messageBroker.removeConsumer).toHaveBeenCalledWith('user_responses');
    });

    it('Se maneja el error cuando la cracion falla', async () => {

      const mockError = {
        error: 'El email ya está en uso'
      };

      await userController.createUser(req, res);

      expect(messageBroker.publish).toHaveBeenCalled();
      
      await messageBroker.mockConsumerCallback(mockError, mockUuid);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(mockError);
      expect(messageBroker.removeConsumer).toHaveBeenCalledWith('user_responses');
    });

    it('Se maneja la excepción con el funcionamiento del broker', async () => {

      messageBroker.publish.mockRejectedValue(new Error('Connection error'));

      await userController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Connection error' });
    });

    it('Se manejan correctamente diferentes id', async () => {

      await userController.createUser(req, res);
      
      expect(messageBroker.publish).toHaveBeenCalled();
      
      await messageBroker.mockConsumerCallback({ id: '123' }, 'different-uuid');
      
      expect(res.status).not.toHaveBeenCalledWith(201);
      expect(messageBroker.removeConsumer).not.toHaveBeenCalled();
    });
  });

  describe('📌 getUserById', () => {
    beforeEach(() => {
      req.params = {
        id: '123'
      };
    });

    it('Se obtiene correctamente un usuario por un id', async () => {

      const mockResponse = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        role: {
          roles: ['estudiante']
        },
        department: 'informática e ingeniería de sistemas'
      };

      await userController.getUserById(req, res);

      expect(messageBroker.publish).toHaveBeenCalledWith(
        {
          operation: 'getUserById',
          data: {
            id: '123',
            email: undefined
          }
        },
        mockUuid,
        'user_responses',
        'user_operations'
      );
      
      await messageBroker.mockConsumerCallback(mockResponse, mockUuid);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
      expect(messageBroker.removeConsumer).toHaveBeenCalledWith('user_responses');
    });

    it('Se maneja el error cuando el usuario no es encontrado', async () => {

      const mockError = {
        error: 'Usuario no encontrado'
      };

      await userController.getUserById(req, res);

      expect(messageBroker.publish).toHaveBeenCalled();
      
      await messageBroker.mockConsumerCallback(mockError, mockUuid);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(mockError);
      expect(messageBroker.removeConsumer).toHaveBeenCalledWith('user_responses');
    });
  });

  describe('📌 updateUser', () => {
    beforeEach(() => {
      req.params = {
        id: '123'
      };
      req.body = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };
    });

    it('Se actualiza corractamente un usuario', async () => {

      const mockResponse = {
        id: '123',
        name: 'Updated Name',
        email: 'updated@example.com',
        role: {
          roles: ['estudiante']
        },
        department: 'informática e ingeniería de sistemas'
      };

      await userController.updateUser(req, res);

      expect(messageBroker.publish).toHaveBeenCalledWith(
        {
          operation: 'updateUser',
          data: {
            id: '123',
            updateFields: req.body
          }
        },
        mockUuid,
        'user_responses',
        'user_operations'
      );
      
      await messageBroker.mockConsumerCallback(mockResponse, mockUuid);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
      expect(messageBroker.removeConsumer).toHaveBeenCalledWith('user_responses');
    });

    it('Se maneja el error cuando la actualización falla', async () => {

      const mockError = {
        error: 'El email ya está en uso'
      };

      await userController.updateUser(req, res);

      expect(messageBroker.publish).toHaveBeenCalled();
      
      await messageBroker.mockConsumerCallback(mockError, mockUuid);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(mockError);
      expect(messageBroker.removeConsumer).toHaveBeenCalledWith('user_responses');
    });
  });

  describe('📌 deleteUser', () => {
    beforeEach(() => {
      req.params = {
        id: '123'
      };
    });

    it('Se elimina correctamente un usuario', async () => {

      const mockResponse = {
        id: '123',
        email: 'deleted@example.com',
        deletedAt: '2025-03-29T12:00:00.000Z'
      };

      await userController.deleteUser(req, res);

      expect(messageBroker.publish).toHaveBeenCalledWith(
        {
          operation: 'deleteUser',
          data: {
            id: '123'
          }
        },
        mockUuid,
        'user_responses',
        'user_operations'
      );
      
      await messageBroker.mockConsumerCallback(mockResponse, mockUuid);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
      expect(messageBroker.removeConsumer).toHaveBeenCalledWith('user_responses');
    });

    it('Se maneja el error cuando una eliminación falla', async () => {

      const mockError = {
        error: 'Usuario no encontrado'
      };

      await userController.deleteUser(req, res);

      expect(messageBroker.publish).toHaveBeenCalled();
      
      await messageBroker.mockConsumerCallback(mockError, mockUuid);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(mockError);
      expect(messageBroker.removeConsumer).toHaveBeenCalledWith('user_responses');
    });
  });

  describe('📌 getAllUsers', () => {
    it('Se obtienen correctamente todos los usuarios', async () => {

      const mockResponse = [
        {
          id: '123',
          name: 'User 1',
          email: 'user1@example.com',
          role: ['estudiante'],
          department: 'informática e ingeniería de sistemas'
        },
        {
          id: '456',
          name: 'User 2',
          email: 'user2@example.com',
          role: ['docente-investigador'],
          department: 'ingeniería electrónica y comunicaciones'
        }
      ];

      await userController.getAllUsers(req, res);

      expect(messageBroker.publish).toHaveBeenCalledWith(
        {
          operation: 'getAllUsers',
          data: {}
        },
        mockUuid,
        'user_responses',
        'user_operations'
      );
      
      await messageBroker.mockConsumerCallback(mockResponse, mockUuid);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
      expect(messageBroker.removeConsumer).toHaveBeenCalledWith('user_responses');
    });

    it('Se maneja el error cuando la obtención de todos los usuarios falla', async () => {

      const mockError = {
        error: 'Error en la base de datos'
      };

      await userController.getAllUsers(req, res);

      expect(messageBroker.publish).toHaveBeenCalled();
      
      await messageBroker.mockConsumerCallback(mockError, mockUuid);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(mockError);
      expect(messageBroker.removeConsumer).toHaveBeenCalledWith('user_responses');
    });
  });
});