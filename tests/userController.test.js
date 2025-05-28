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
    messageBroker.consumeReplies.mockResolvedValue();
    
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

    it('✅ Se crea con éxito un usuario', async () => {
      const mockResponse = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        role: ['estudiante'],
        department: 'informática e ingeniería de sistemas'
      };

      messageBroker.publish.mockImplementation(async (message, correlationId) => {
        const handler = messageBroker.responseHandlers[correlationId];
        if (handler) {
          handler.resolve(mockResponse);
        }
      });

      await userController.createUser(req, res);

      expect(messageBroker.consumeReplies).toHaveBeenCalledWith('user_responses');
      expect(messageBroker.publish).toHaveBeenCalledWith(
        {
          operation: 'createUser',
          data: req.body
        },
        mockUuid,
        'user_responses',
        'user_operations'
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
    });

    it('❌ Maneja errores de validación del usuario', async () => {
      const mockError = { error: 'El email ya está en uso' };

      messageBroker.publish.mockImplementation(async (message, correlationId) => {
        const handler = messageBroker.responseHandlers[correlationId];
        if (handler) {
          handler.resolve(mockError);
        }
      });

      await userController.createUser(req, res);

      expect(messageBroker.consumeReplies).toHaveBeenCalledWith('user_responses');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(mockError);
    });

    it('🚨 Maneja excepciones del broker', async () => {
      messageBroker.publish.mockRejectedValue(new Error('Connection error'));

      await userController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Connection error' });
    });
  });

  describe('📌 getUserById', () => {
    beforeEach(() => {
      req.params = { id: '123' };
    });

    it('✅ Se obtiene correctamente un usuario por ID', async () => {
      const mockResponse = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        role: { roles: ['estudiante'] },
        department: 'informática e ingeniería de sistemas'
      };

      messageBroker.publish.mockImplementation(async (message, correlationId) => {
        const handler = messageBroker.responseHandlers[correlationId];
        if (handler) {
          handler.resolve(mockResponse);
        }
      });

      await userController.getUserById(req, res);

      expect(messageBroker.consumeReplies).toHaveBeenCalledWith('user_responses');
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
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
    });

    it('❌ Maneja error cuando el usuario no es encontrado', async () => {
      const mockError = { error: 'Usuario no encontrado' };

      messageBroker.publish.mockImplementation(async (message, correlationId) => {
        const handler = messageBroker.responseHandlers[correlationId];
        if (handler) {
          handler.resolve(mockError);
        }
      });

      await userController.getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(mockError);
    });
  });


  describe('📌 updateUser', () => {
    beforeEach(() => {
      req.params = { id: '123' };
      req.body = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };
    });

    it('✅ Se actualiza correctamente un usuario', async () => {
      const mockResponse = {
        id: '123',
        name: 'Updated Name',
        email: 'updated@example.com',
        role: { roles: ['estudiante'] },
        department: 'informática e ingeniería de sistemas'
      };

      messageBroker.publish.mockImplementation(async (message, correlationId) => {
        const handler = messageBroker.responseHandlers[correlationId];
        if (handler) {
          handler.resolve(mockResponse);
        }
      });

      await userController.updateUser(req, res);

      expect(messageBroker.consumeReplies).toHaveBeenCalledWith('user_responses');
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

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
    });

    it('❌ Maneja error cuando la actualización falla', async () => {
      const mockError = { error: 'El email ya está en uso' };

      messageBroker.publish.mockImplementation(async (message, correlationId) => {
        const handler = messageBroker.responseHandlers[correlationId];
        if (handler) {
          handler.resolve(mockError);
        }
      });

      await userController.updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(mockError);
    });
  });


  describe('📌 deleteUser', () => {
    beforeEach(() => {
      req.params = { id: '123' };
    });

    it('✅ Se elimina correctamente un usuario', async () => {
      const mockResponse = {
        id: '123',
        email: 'deleted@example.com',
        deletedAt: '2025-03-29T12:00:00.000Z'
      };

      messageBroker.publish.mockImplementation(async (message, correlationId) => {
        const handler = messageBroker.responseHandlers[correlationId];
        if (handler) {
          handler.resolve(mockResponse);
        }
      });

      await userController.deleteUser(req, res);

      expect(messageBroker.consumeReplies).toHaveBeenCalledWith('user_responses');
      expect(messageBroker.publish).toHaveBeenCalledWith(
        {
          operation: 'deleteUser',
          data: { id: '123' }
        },
        mockUuid,
        'user_responses',
        'user_operations'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
    });

    it('❌ Maneja error cuando la eliminación falla', async () => {
      const mockError = { error: 'Usuario no encontrado' };

      messageBroker.publish.mockImplementation(async (message, correlationId) => {
        const handler = messageBroker.responseHandlers[correlationId];
        if (handler) {
          handler.resolve(mockError);
        }
      });

      await userController.deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(mockError);
    });
  });


  describe('📌 getAllUsers', () => {
    it('✅ Se obtienen correctamente todos los usuarios', async () => {
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

      messageBroker.publish.mockImplementation(async (message, correlationId) => {
        const handler = messageBroker.responseHandlers[correlationId];
        if (handler) {
          handler.resolve(mockResponse);
        }
      });

      await userController.getAllUsers(req, res);

      expect(messageBroker.consumeReplies).toHaveBeenCalledWith('user_responses');
      expect(messageBroker.publish).toHaveBeenCalledWith(
        {
          operation: 'getAllUsers',
          data: {}
        },
        mockUuid,
        'user_responses',
        'user_operations'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
    });

    it('❌ Maneja error cuando falla la obtención de usuarios', async () => {
      const mockError = { error: 'Error en la base de datos' };

      messageBroker.publish.mockImplementation(async (message, correlationId) => {
        const handler = messageBroker.responseHandlers[correlationId];
        if (handler) {
          handler.resolve(mockError);
        }
      });

      await userController.getAllUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(mockError);
    });
  });

});