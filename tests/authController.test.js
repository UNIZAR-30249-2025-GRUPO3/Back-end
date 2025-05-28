const AuthController = require('../src/api/controllers/authController');
const messageBroker = require('../src/core/infraestructura/messageBroker');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

jest.mock('../src/core/infraestructura/messageBroker');
jest.mock('uuid');
jest.mock('jsonwebtoken');

describe('🔹 AuthController', () => {
  let authController;
  let req;
  let res;

  const mockUuid = '12345-mock-uuid';

  beforeEach(() => {
    jest.clearAllMocks();

    uuidv4.mockReturnValue(mockUuid);
    messageBroker.connect.mockResolvedValue();
    messageBroker.publish.mockResolvedValue();
    messageBroker.consumeReplies.mockResolvedValue();

    authController = new AuthController();

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

  describe('📌 login', () => {
    beforeEach(() => {
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };
    });

    afterEach(async () => {
        await messageBroker.removeConsumer('user_responses');
        messageBroker.responseHandlers = {}; 
    });


    it('🔴 Maneja correctamente credenciales inválidas', async () => {
      const mockError = { error: 'Contraseña incorrecta' };

      let resolver;
      const responsePromise = new Promise((resolve) => {
        resolver = resolve;
      });

      messageBroker.addResponseHandler.mockImplementation((correlationId, resolve) => {
        resolver = resolve;
      });

      messageBroker.removeResponseHandler.mockImplementation(() => {});

      setTimeout(() => {
        resolver(mockError);
      }, 10);

      await authController.login(req, res);

      expect(messageBroker.publish).toHaveBeenCalledWith(
        {
          operation: 'login',
          data: {
            email: 'test@example.com',
            password: 'password123'
          }
        },
        mockUuid,
        'user_responses',
        'user_operations'
      );

      await new Promise((r) => setTimeout(r, 20));

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(mockError);
    });

    it('🛑 Maneja error del servidor durante el inicio de sesión', async () => {
      messageBroker.publish.mockRejectedValue(new Error('Server Error'));

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Server Error');
    });

    it('✅ Devuelve token en caso de login exitoso', async () => {
      const mockResponse = {
        id: 'user-id-1',
        role: {
          roles: 'admin'
        }
      };

      jwt.sign.mockReturnValue('mocked-token');

      messageBroker.addResponseHandler.mockImplementation((correlationId, resolve) => {
        resolve(mockResponse);
      });

      messageBroker.removeResponseHandler.mockImplementation(() => {});

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'OK',
        token: 'mocked-token',
        user: {
          user_id: mockResponse.id,
          role: mockResponse.role.roles
        }
      });
    });
  });
});
