const UserController = require('../src/api/controllers/userController');
const messageBroker = require('../src/core/infraestructura/messageBroker');
const { v4: uuidv4 } = require('uuid');

jest.mock('../src/core/infraestructura/messageBroker');
jest.mock('uuid');

describe('🔹 AuthController', () => {
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

    describe('📌 login', () => {

        beforeEach(() => {
            req.body = {
                email: 'test@example.com',
                password: 'password123'
            };
        });

        it('Se inicia sesión correctamente', async () => {

            const mockResponse = {
                id: '123',
                role: {
                roles: ['gerente']
                }
            };

            await userController.login(req, res);

            expect(messageBroker.publish).toHaveBeenCalledWith(
                {
                operation: 'login',
                data: {
                    email: 'test@example.com',
                    password: 'password123'
                }
                },
                mockUuid,
                'user_responses'
            );
            
            await messageBroker.mockConsumerCallback(mockResponse, mockUuid);
            
            expect(req.session.user).toEqual({
                user_id: '123',
                role: ['gerente']
            });
            
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'OK',
                user: {
                user_id: '123',
                role: ['gerente']
                }
            });
            expect(messageBroker.removeConsumer).toHaveBeenCalledWith('user_responses');
        });

        it('Se meneja correctamente credenciales inválidas', async () => {

            const mockError = {
                error: 'Contraseña incorrecta'
            };

            await userController.login(req, res);

            expect(messageBroker.publish).toHaveBeenCalled();
            
            await messageBroker.mockConsumerCallback(mockError, mockUuid);
            
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(mockError);
            expect(messageBroker.removeConsumer).toHaveBeenCalledWith('user_responses');
        });

        it('Se maneja error del servidor durante el inicio de sesión', async () => {

            messageBroker.publish.mockRejectedValue(new Error('Server Error'));

            await userController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith('Server Error');
        });
    });

    describe('📌 logout', () => {

        beforeEach(() => {
            req.session = {
                reset: jest.fn()
            };
        });

        it('Se cierra sesión correctamente', async () => {

            await userController.logout(req, res);


            expect(req.session.reset).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({
                message: 'Closed session'
            });
        });
    });
});