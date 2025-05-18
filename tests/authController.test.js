const AuthController = require('../src/api/controllers/authController');
const messageBroker = require('../src/core/infraestructura/messageBroker');
const { v4: uuidv4 } = require('uuid');

jest.mock('../src/core/infraestructura/messageBroker');
jest.mock('uuid');

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
        messageBroker.consume.mockImplementation((queue, callback) => {
        messageBroker.mockConsumerCallback = callback;
        return Promise.resolve({ consumerTag: 'test-consumer-tag' });
        });
        messageBroker.removeConsumer.mockResolvedValue();
        
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

        it('Se meneja correctamente credenciales inválidas', async () => {

            const mockError = {
                error: 'Contraseña incorrecta'
            };

            await authController.login(req, res);

            expect(messageBroker.publish).toHaveBeenCalled();
            
            await messageBroker.mockConsumerCallback(mockError, mockUuid);
            
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(mockError);
            expect(messageBroker.removeConsumer).toHaveBeenCalledWith('user_responses');
        });

        it('Se maneja error del servidor durante el inicio de sesión', async () => {

            messageBroker.publish.mockRejectedValue(new Error('Server Error'));

            await authController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith('Server Error');
        });
    });
});