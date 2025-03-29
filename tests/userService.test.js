const UserService = require('../src/core/aplicacion/Servicios/UserService');
const messageBroker = require('../src/core/infraestructura/messageBroker');
const User = require('../src/core/dominio/Entidades/User');

jest.mock('../src/core/infraestructura/messageBroker');
jest.mock('../src/core/infraestructura/Persistencia/BD_UserRepository');

describe('🔹 UserService', () => {
    let userService;
    
    beforeEach(() => {

        jest.clearAllMocks();
        
        userService = new UserService();
  
        messageBroker.connect.mockResolvedValue();
            messageBroker.consume.mockImplementation((queue, callback) => {
            return Promise.resolve({ consumerTag: 'mock-consumer-tag' });
        });
        messageBroker.sendResponse.mockResolvedValue();
        
    });
    
    describe('📌 handleCreateUser', () => {
        
        it('Se crea un nuevo usuario correctamente', async () => {

            const validUserData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                role: ['estudiante'],
            };

            const savedUser = { ...validUserData, id: 'user123' };
            userService.userRepository.findByEmail.mockResolvedValue(null);
            userService.userRepository.save.mockResolvedValue(savedUser);
            
            const result = await userService.handleCreateUser(validUserData);
            
            expect(userService.userRepository.findByEmail).toHaveBeenCalledWith(validUserData.email);
            expect(userService.userRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                name: validUserData.name,
                email: validUserData.email,
                password: validUserData.password,
                role: validUserData.role,
                department: validUserData.department
            }));
            expect(result).toEqual(savedUser);
        });
        
        it('Da un error cuando ya existe el correo', async () => {

            const validUserData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                role: ['estudiante'],
            };

            userService.userRepository.findByEmail.mockResolvedValue({ email: validUserData.email });
        
            const result = await userService.handleCreateUser(validUserData);
            
            expect(userService.userRepository.findByEmail).toHaveBeenCalledWith(validUserData.email);
            expect(userService.userRepository.save).not.toHaveBeenCalled();
            expect(result).toEqual({ error: 'El email ya está en uso' });
        });
        
        const validRoleTestCases = [
            { role: ['estudiante'] },
            { role: ['investigador contratado'] },
            { role: ['docente-investigador'] },
            { role: ['conserje'] },
            { role: ['técnico de laboratorio'] },
            { role: ['gerente'] },
            { role: ['docente-investigador', 'gerente'] }
        ];

        validRoleTestCases.forEach(({ role }) => {
            it(`Se crean usuarios con los roles válidos: ${role.join(', ')}`, async () => {

                const validUserData = {
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123',
                    role: role,
                };

                const userData = { ...validUserData, role };
                const savedUser = { ...userData, id: 'user123' };
                userService.userRepository.findByEmail.mockResolvedValue(null);
                userService.userRepository.save.mockResolvedValue(savedUser);
                
                const result = await userService.handleCreateUser(userData);
                
                expect(userService.userRepository.save).toHaveBeenCalledWith(expect.objectContaining({role}));
                expect(result.role).toEqual(role);
            });
        });
        
        const validDepartmentTestCases = [
            { department: 'informática e ingeniería de sistemas' },
            { department: 'ingeniería electrónica y comunicaciones' },
            { department: '' }
        ];
        
        validDepartmentTestCases.forEach(({ department }) => {
            it(`Se asignan departamentos válidos: ${department || 'empty'}`, async () => {

                const validUserData = {
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123',
                    role: ['técnico de laboratorio'],
                    department: department
                };

                const userData = { ...validUserData, department };
                const savedUser = { ...userData, id: 'user123' };
                userService.userRepository.findByEmail.mockResolvedValue(null);
                userService.userRepository.save.mockResolvedValue(savedUser);
                
                const result = await userService.handleCreateUser(userData);
                
                expect(userService.userRepository.save).toHaveBeenCalledWith(expect.objectContaining({department}));
                expect(result.department).toEqual(department);
            });
        });
    });
    
    describe('📌 handleGetUserById', () => {

        it('Devuelve un usario según un id dado', async () => {

            const userId = '1';

            const user = {
                id: userId,
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                role: ['estudiante'],
            };       

            userService.userRepository.findById.mockResolvedValue(user);
            
            const result = await userService.handleGetUserById({ id: userId });
            
            expect(userService.userRepository.findById).toHaveBeenCalledWith(userId);
            expect(result).toEqual(user);
        });
        
        it('Devuelve un error cuando el usuario no se ha encontrado', async () => {

            const userId = 'nonexistent';
            userService.userRepository.findById.mockResolvedValue(null);
            
            await expect(userService.handleGetUserById({ id: userId })).rejects.toThrow('Usuario no encontrado');
            expect(userService.userRepository.findById).toHaveBeenCalledWith(userId);
        });
        
        it('Devuelve un error cuando no se proporciona un id', async () => {

            await expect(userService.handleGetUserById({})).rejects.toThrow('El campo "id" es requerido');
            await expect(userService.handleGetUserById(null)).rejects.toThrow('El campo "id" es requerido');
        });
    });
    
    describe('📌 handleGetAllUsers', () => {

        it('Devuelve todos los usarios', async () => {

            const users = [
                {
                    name: 'Test User1',
                    email: 'tes1t@example.com',
                    password: 'password123',
                    role: ['estudiante'],
                },
                {
                    name: 'Test User2',
                    email: 'test2@example.com',
                    password: 'password123',
                    role: ['estudiante'],
                }
            ];
            userService.userRepository.findAll.mockResolvedValue(users);
            
            const result = await userService.handleGetAllUsers({});
            
            expect(userService.userRepository.findAll).toHaveBeenCalledWith({});
            expect(result).toEqual(users);
        });
        
        it('Se aplican filtros a las búsquedas de usuarios', async () => {

            const filters = { role: ['estudiante'] };
            const users = [
                {
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123',
                    role: ['estudiante'],
                }
            ];
            userService.userRepository.findAll.mockResolvedValue(users);
            
            const result = await userService.handleGetAllUsers({ filters });
            
            expect(userService.userRepository.findAll).toHaveBeenCalledWith(filters);
            expect(result).toEqual(users);
        });
    });
    
    describe('📌 handleUpdateUser', () => {
        
        it('Se modifica un usuario correctamente', async () => {

            const existingUser = new User(
                'tempId',
                'Original Name', 
                'original@example.com', 
                'password123',
                ['técnico de laboratorio'],
                'informática e ingeniería de sistemas'
            );

            const updateFields = {
                name: 'Updated Name',
                email: 'original@example.com', 
                password: 'password123',
                role: ['técnico de laboratorio'],
                department: 'informática e ingeniería de sistemas'
            };
            
            const updatedUser = {
                ...existingUser,
                ...updateFields,
                updatedAt: expect.any(Date)
            };
            
            userService.userRepository.findById.mockResolvedValue(existingUser);
            userService.userRepository.update.mockResolvedValue(updatedUser);
            
            const result = await userService.handleUpdateUser({
                id: existingUser.id,
                updateFields
            });
            
            expect(userService.userRepository.findById).toHaveBeenCalledWith(existingUser.id);
            expect(userService.userRepository.update).toHaveBeenCalledWith(expect.objectContaining({
                id: existingUser.id,
                name: updateFields.name,
                role: updateFields.role,
                updatedAt: expect.any(Date)
            }));
            expect(result).toEqual(updatedUser);
        });

        it('Eliminar un departamento de un usuario', async () => {

            const existingUser = new User(
                'tempId',
                'Original Name', 
                'original@example.com', 
                'password123',
                ['técnico de laboratorio'],
                'informática e ingeniería de sistemas'
            );

            const updateFields = {
                name: 'Updated Name',
                email: 'original@example.com', 
                password: 'password123',
                role: ['técnico de laboratorio'],
            };
            
            const updatedUser = {
                ...existingUser,
                ...updateFields,
                updatedAt: expect.any(Date)
            };
            
            userService.userRepository.findById.mockResolvedValue(existingUser);
            userService.userRepository.update.mockResolvedValue(updatedUser);
            
            const result = await userService.handleUpdateUser({
                id: existingUser.id,
                updateFields
            });
            
            expect(userService.userRepository.findById).toHaveBeenCalledWith(existingUser.id);
            expect(userService.userRepository.update).toHaveBeenCalledWith(expect.objectContaining({
                id: existingUser.id,
                name: updateFields.name,
                role: updateFields.role,
                updatedAt: expect.any(Date)
            }));
            expect(result).toEqual(updatedUser);
        });
        
        it('Da un error cuando no se encuentra el usario', async () => {

            userService.userRepository.findById.mockResolvedValue(null);
            
            await expect(userService.handleUpdateUser({
                id: 'nonexistent',
                updateFields: { name: 'New Name' }
            })).rejects.toThrow('Usuario no encontrado');
        });
        
        it('Da un error cuando no se proporciona un id', async () => {

            await expect(userService.handleUpdateUser({
                updateFields: { name: 'New Name' }
            })).rejects.toThrow('El campo "id" es requerido');
        });
        
        it('Da un error si no se proporciona ningún campo para actualizar', async () => {

            await expect(userService.handleUpdateUser({
                id: 'user123',
                updateFields: {}
            })).rejects.toThrow('Se requieren campos para actualizar');
            
            await expect(userService.handleUpdateUser({
                id: 'user123'
            })).rejects.toThrow('Se requieren campos para actualizar');
        });
        
        /*it('Da un error si el email ya está en uso', async () => {

            const existingUser = new User(
                'tempId',
                'Original Name', 
                'original@example.com', 
                'password123',
                ['técnico de laboratorio'],
                'informática e ingeniería de sistemas'
            );

            const updateFields = {
                email: 'existing@example.com'
            };
            userService.userRepository.findById.mockResolvedValue(existingUser);
            userService.userRepository.findByEmail.mockResolvedValue({
                id: 'other-user',
                email: updateFields.email
            });
            
            await expect(userService.handleUpdateUser({
                id: existingUser.id,
                updateFields
            })).rejects.toThrow('El email ya está en uso');
        });
        
        
        
        // Test various role update combinations
        const roleUpdateCases = [
        { role: ['gerente'] },
        { role: ['estudiante', 'investigador contratado'] },
        { role: ['docente-investigador', 'técnico de laboratorio'] }
        ];
        
        roleUpdateCases.forEach(({ role }) => {
        it(`should update user role to: ${role.join(', ')}`, async () => {
            // Setup
            const updateFields = { role };
            const updatedUser = {
            ...existingUser,
            role,
            updatedAt: expect.any(Date)
            };
            userService.userRepository.findById.mockResolvedValue(existingUser);
            userService.userRepository.update.mockResolvedValue(updatedUser);
            
            // Execute
            const result = await userService.handleUpdateUser({
            id: existingUser.id,
            updateFields
            });
            
            // Verify
            expect(userService.userRepository.update).toHaveBeenCalledWith(
            expect.objectContaining({ role })
            );
            expect(result.role).toEqual(role);
        });
        });
        
        // Test department updates
        const departmentUpdateCases = [
        { department: 'ingeniería electrónica y comunicaciones' },
        { department: '' }
        ];
        
        departmentUpdateCases.forEach(({ department }) => {
        it(`should update user department to: ${department || 'empty'}`, async () => {
            // Setup
            const updateFields = { department };
            const updatedUser = {
            ...existingUser,
            department,
            updatedAt: expect.any(Date)
            };
            userService.userRepository.findById.mockResolvedValue(existingUser);
            userService.userRepository.update.mockResolvedValue(updatedUser);
            
            // Execute
            const result = await userService.handleUpdateUser({
            id: existingUser.id,
            updateFields
            });
            
            // Verify
            expect(userService.userRepository.update).toHaveBeenCalledWith(
            expect.objectContaining({ department })
            );
            expect(result.department).toEqual(department);
        });
        });*/
    });
    
    /*describe('handleDeleteUser', () => {
        const existingUser = {
        id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        role: ['estudiante']
        };
        
        it('should delete user successfully', async () => {
        // Setup
        userService.userRepository.findById.mockResolvedValue(existingUser);
        userService.userRepository.delete.mockResolvedValue({ acknowledged: true, deletedCount: 1 });
        
        // Execute
        const result = await userService.handleDeleteUser({ id: existingUser.id });
        
        // Verify
        expect(userService.userRepository.findById).toHaveBeenCalledWith(existingUser.id);
        expect(userService.userRepository.delete).toHaveBeenCalledWith(existingUser.id);
        expect(result).toEqual({
            id: existingUser.id,
            email: existingUser.email,
            deletedAt: expect.any(String)
        });
        });
        
        it('should throw error when user is not found', async () => {
        // Setup
        userService.userRepository.findById.mockResolvedValue(null);
        
        // Execute & Verify
        await expect(userService.handleDeleteUser({ id: 'nonexistent' }))
            .rejects.toThrow('Usuario no encontrado');
        });
        
        it('should throw error when ID is not provided', async () => {
        // Execute & Verify
        await expect(userService.handleDeleteUser({}))
            .rejects.toThrow('El campo "id" es requerido');
        await expect(userService.handleDeleteUser(null))
            .rejects.toThrow('El campo "id" es requerido');
        });
        
    });
    
    describe('handleLogin', () => {
        const validCredentials = {
        email: 'test@example.com',
        password: 'password123'
        };
        
        const user = {
        id: 'user123',
        name: 'Test User',
        email: validCredentials.email,
        password: validCredentials.password,
        role: { roles: ['estudiante'] }
        };
        
        it('should authenticate user with valid credentials', async () => {
        // Setup
        userService.userRepository.findByEmail.mockResolvedValue(user);
        
        // Execute
        const result = await userService.handleLogin(validCredentials);
        
        // Verify
        expect(userService.userRepository.findByEmail).toHaveBeenCalledWith(validCredentials.email);
        expect(result).toEqual({
            id: user.id,
            role: user.role
        });
        });
        
        it('should throw error when user is not found', async () => {
        // Setup
        userService.userRepository.findByEmail.mockResolvedValue(null);
        
        // Execute & Verify
        await expect(userService.handleLogin(validCredentials))
            .rejects.toThrow('Usuario no encontrado');
        });
        
        it('should throw error when password is incorrect', async () => {
        // Setup
        userService.userRepository.findByEmail.mockResolvedValue(user);
        
        // Execute & Verify
        await expect(userService.handleLogin({
            email: validCredentials.email,
            password: 'wrong-password'
        })).rejects.toThrow('Contraseña incorrecta');
        });
        
        // Test login with different roles
        const roleLoginCases = [
        { role: { roles: ['estudiante'] } },
        { role: { roles: ['gerente'] } },
        { role: { roles: ['docente-investigador', 'técnico de laboratorio'] } }
        ];
        
        roleLoginCases.forEach(({ role }) => {
        it(`should login user with role: ${JSON.stringify(role.roles)}`, async () => {
            // Setup
            const userWithRole = { ...user, role };
            userService.userRepository.findByEmail.mockResolvedValue(userWithRole);
            
            // Execute
            const result = await userService.handleLogin(validCredentials);
            
            // Verify
            expect(result.role).toEqual(role);
        });
        });

        
    });


    describe('📌 setupConsumers', () => {
        it('Se conecta al broker y hace setup de los consumidores', async () => {
            await userService.setupConsumers();
            
            expect(messageBroker.connect).toHaveBeenCalled();
            expect(messageBroker.consume).toHaveBeenCalledWith('user_operations', expect.any(Function));
        });
        
        it('Maneja errores de conexión', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            messageBroker.connect.mockRejectedValue(new Error('Connection error'));
            
            await userService.setupConsumers();
            
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error en setupConsumers'), expect.any(Error));
        });
    });*/
});