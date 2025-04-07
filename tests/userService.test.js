const UserService = require('../src/core/aplicacion/UserService');
const messageBroker = require('../src/core/infraestructura/messageBroker');
const User = require('../src/core/dominio/User');

jest.mock('../src/core/infraestructura/messageBroker');
jest.mock('../src/core/infraestructura/BD_UserRepository');

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

        it('Da error cuando se proporciona un nombre vacío', async () => {
            const invalidUserData = {
                name: '',  
                email: 'test@example.com',
                password: 'password123',
                role: ['estudiante']
            };
            
            await expect(userService.handleCreateUser(invalidUserData)).rejects.toThrow('El nombre es obligatorio');
        });
        
        it('Da error cuando la contraseña es menor a 8 caracteres', async () => {
            const invalidUserData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'short',  
                role: ['estudiante']
            };
            
            await expect(userService.handleCreateUser(invalidUserData))
                .rejects.toThrow('La contraseña es obligatoria y debe tener al menos 8 caracteres');
        });
        
        it('Da error cuando se proporciona un array de roles vacío', async () => {
            const invalidUserData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                role: []  
            };
            
            await expect(userService.handleCreateUser(invalidUserData))
                .rejects.toThrow('Se debe proporcionar al menos un rol');
        });
        
        it('Da error cuando se proporciona un rol inválido', async () => {
            const invalidUserData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                role: ['rol_inexistente']  
            };
            
            await expect(userService.handleCreateUser(invalidUserData))
                .rejects.toThrow('Rol inválido');
        });
        
        it('Da error cuando se proporcionan más de dos roles', async () => {
            const invalidUserData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                role: ['estudiante', 'técnico de laboratorio', 'conserje'] 
            };
            
            await expect(userService.handleCreateUser(invalidUserData))
                .rejects.toThrow('Un usuario no puede tener más de dos roles');
        });
        
        it('Da error cuando se intenta combinar dos roles no permitidos', async () => {
            const invalidUserData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                role: ['estudiante', 'técnico de laboratorio'] 
            };
            
            await expect(userService.handleCreateUser(invalidUserData))
                .rejects.toThrow('Solo un gerente puede tener un segundo rol como docente-investigador');
        });
        
        it('Da error cuando se asigna un departamento a un rol que no lo permite', async () => {
            const invalidUserData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                role: ['estudiante'],
                department: 'informática e ingeniería de sistemas'  
            };
            
            await expect(userService.handleCreateUser(invalidUserData))
                .rejects.toThrow('El rol no permite estar adscrito a un departamento');
        });
        
        it('Da error cuando se asigna un departamento inválido', async () => {
            const invalidUserData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                role: ['docente-investigador'],
                department: 'departamento inexistente' 
            };
            
            await expect(userService.handleCreateUser(invalidUserData))
                .rejects.toThrow('Departamento inválido');
        });
        
        it('Da error cuando un gerente sin rol de docente-investigador tiene departamento', async () => {
            const invalidUserData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                role: ['gerente'],  
                department: 'informática e ingeniería de sistemas'
            };
            
            await expect(userService.handleCreateUser(invalidUserData))
                .rejects.toThrow('El rol no permite estar adscrito a un departamento');
        });

        it('Da error cuando los roles no se dan como un array', async () => {
            const invalidUserData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                role:'gerente',  
                department: null
            };
            
            await expect(userService.handleCreateUser(invalidUserData))
                .rejects.toThrow("Los roles deben proporcionarse como un array.");
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

        const existingUser = new User(
            'tempId',
            'Original Name', 
            'original@example.com', 
            'password123',
            ['técnico de laboratorio'],
            'informática e ingeniería de sistemas'
        );
        
        it('Se modifica un usuario correctamente', async () => {

            const updateFields = {
                name: 'Original Name',
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
        
        const validRoleUpdateCases = [
            { role: ['investigador contratado'] },
            { role: ['docente-investigador', 'gerente'] }
        ];
        
        validRoleUpdateCases.forEach(({ role }) => {
            it(`Se actualizan los roles: ${role.join(', ')}`, async () => {

                const updateFields = { role }; 

                const updatedUser = {
                    ...existingUser,
                    role,
                    updatedAt: expect.any(Date)
                };
                userService.userRepository.findById.mockResolvedValue(existingUser);
                userService.userRepository.update.mockResolvedValue(updatedUser);
                
                const result = await userService.handleUpdateUser({
                    id: existingUser.id,
                    updateFields
                });
                
                expect(userService.userRepository.update).toHaveBeenCalledWith(expect.objectContaining({ role }));
                expect(result.role).toEqual(role);
            });
        });

        const validDepartmentUpdateCases = [
            { department: 'ingeniería electrónica y comunicaciones' },
            { department: '' }
        ];
            
        validDepartmentUpdateCases.forEach(({ department }) => {
            it(`should update user department to: ${department || 'empty'}`, async () => {

                const updateFields = { department };
                const updatedUser = {
                    ...existingUser,
                    department,
                    updatedAt: expect.any(Date)
                };
                userService.userRepository.findById.mockResolvedValue(existingUser);
                userService.userRepository.update.mockResolvedValue(updatedUser);
                
                const result = await userService.handleUpdateUser({
                id: existingUser.id,
                updateFields
                });
                
                expect(userService.userRepository.update).toHaveBeenCalledWith(expect.objectContaining({ department }));
                expect(result.department).toEqual(department);
            });
        });

        it('Da error al actualizar con un nombre vacío', async () => {
            const updateFields = {
                name: '', 
                email: 'original@example.com'
            };

            userService.userRepository.findById.mockResolvedValue(existingUser);
            
            await expect(userService.handleUpdateUser({
                id: existingUser.id,
                updateFields
            })).rejects.toThrow('El nombre es obligatorio');
        });
        
        it('Da error al actualizar con una contraseña corta', async () => {
            const updateFields = {
                password: 'short' 
            };

            userService.userRepository.findById.mockResolvedValue(existingUser);
            
            await expect(userService.handleUpdateUser({
                id: existingUser.id,
                updateFields
            })).rejects.toThrow('La contraseña es obligatoria y debe tener al menos 8 caracteres');
        });
        
        it('Da error al actualizar a un rol inválido', async () => {
            const updateFields = {
                role: ['rol_inexistente']  
            };

            userService.userRepository.findById.mockResolvedValue(existingUser);
            
            await expect(userService.handleUpdateUser({
                id: existingUser.id,
                updateFields
            })).rejects.toThrow('Rol inválido');
        });
        
        it('Da error al actualizar a más de dos roles', async () => {
            const updateFields = {
                role: ['estudiante', 'técnico de laboratorio', 'conserje'] 
            };

            userService.userRepository.findById.mockResolvedValue(existingUser);
            
            await expect(userService.handleUpdateUser({
                id: existingUser.id,
                updateFields
            })).rejects.toThrow('Un usuario no puede tener más de dos roles');
        });
        
        it('Da error al intentar cambiar a una combinación de roles no permitida', async () => {
            const updateFields = {
                role: ['estudiante', 'técnico de laboratorio'] 
            };

            userService.userRepository.findById.mockResolvedValue(existingUser);
            
            await expect(userService.handleUpdateUser({
                id: existingUser.id,
                updateFields
            })).rejects.toThrow('Solo un gerente puede tener un segundo rol como docente-investigador');
        });
        
        it('Da error al intentar asignar departamento a un rol que no lo permite', async () => {

            const updateFields = {
                role: ['estudiante'],
                department: 'informática e ingeniería de sistemas'
            };

            userService.userRepository.findById.mockResolvedValue(existingUser);
            
            await expect(userService.handleUpdateUser({
                id: existingUser.id,
                updateFields
            })).rejects.toThrow('El rol no permite estar adscrito a un departamento');
        });

        it('Da error al cambiar a gerente sin ser docente-investigador estando en un departamento', async () => {

            const updateFields = {
                role: ['gerente']
            };

            userService.userRepository.findById.mockResolvedValue(existingUser);
            
            await expect(userService.handleUpdateUser({
                id: existingUser.id,
                updateFields
            })).rejects.toThrow('El rol no permite estar adscrito a un departamento');
        });
        
        it('Da error al actualizar con un departamento inválido', async () => {
            const updateFields = {
                department: 'departamento inexistente' 
            };

            userService.userRepository.findById.mockResolvedValue(existingUser);
            
            await expect(userService.handleUpdateUser({
                id: existingUser.id,
                updateFields
            })).rejects.toThrow('Departamento inválido');
        });
        
        it('Da error al cambiar el email a uno que ya existe', async () => {
            const updateFields = {
                email: 'existing@example.com' 
            };

            userService.userRepository.findById.mockResolvedValue(existingUser);
            userService.userRepository.findByEmail.mockResolvedValue({ email: 'existing@example.com' });
            
            await expect(userService.handleUpdateUser({
                id: existingUser.id,
                updateFields
            })).rejects.toThrow('El email ya está en uso');
        });
    });
    
    describe('📌 handleDeleteUser', () => {

        const existingUser = {
            id: 'user123',
            name: 'Test User',
            email: 'test@example.com',
            role: ['estudiante']
        };
        
        it('Se elimina un usuario correctamente', async () => {

            userService.userRepository.findById.mockResolvedValue(existingUser);
            userService.userRepository.delete.mockResolvedValue({ acknowledged: true, deletedCount: 1 });
            
            const result = await userService.handleDeleteUser({ id: existingUser.id });
            
            expect(userService.userRepository.findById).toHaveBeenCalledWith(existingUser.id);
            expect(userService.userRepository.delete).toHaveBeenCalledWith(existingUser.id);
            expect(result).toEqual({
                id: existingUser.id,
                email: existingUser.email,
                deletedAt: expect.any(String)
            });
        });
        
        it('Da error cuando no se encuentra el usuario', async () => {
            
            userService.userRepository.findById.mockResolvedValue(null);
            
            await expect(userService.handleDeleteUser({ id: 'nonexistent' }))
                .rejects.toThrow('Usuario no encontrado');
        });
        
        it('Da un error cuando no se proporciona un id', async () => {

            await expect(userService.handleDeleteUser({}))
                .rejects.toThrow('El campo "id" es requerido');
            await expect(userService.handleDeleteUser(null))
                .rejects.toThrow('El campo "id" es requerido');
        });
        
    });
    
    describe('📌 handleLogin', () => {

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
        
        it('Se autentica con credenciales válidas', async () => {

            userService.userRepository.findByEmail.mockResolvedValue(user);
        
            const result = await userService.handleLogin(validCredentials);

            expect(userService.userRepository.findByEmail).toHaveBeenCalledWith(validCredentials.email);
            expect(result).toEqual({
                id: user.id,
                role: user.role
            });
        });
        
        it('Da error cuando no se encuentra el usuario', async () => {

            userService.userRepository.findByEmail.mockResolvedValue(null);
            
            await expect(userService.handleLogin(validCredentials))
                .rejects.toThrow('Usuario no encontrado');
        });
        
        it('Da error cuando la contraseña es incorrecta', async () => {

            userService.userRepository.findByEmail.mockResolvedValue(user);
        
            await expect(userService.handleLogin({
                email: validCredentials.email,
                password: 'wrong-password'
            })).rejects.toThrow('Contraseña incorrecta');
        });
    });

    describe('📌 Validaciones de roles y departamentos específicos', () => {

        it('Valida que un docente-investigador pueda tener departamento', async () => {
            const validUserData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                role: ['docente-investigador'],
                department: 'informática e ingeniería de sistemas'
            };
            
            const savedUser = { ...validUserData, id: 'user123' };
            userService.userRepository.findByEmail.mockResolvedValue(null);
            userService.userRepository.save.mockResolvedValue(savedUser);
            
            const result = await userService.handleCreateUser(validUserData);
            
            expect(userService.userRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    role: validUserData.role,
                    department: validUserData.department
                })
            );
            expect(result.department).toEqual(validUserData.department);
        });
        
        it('Valida que un investigador contratado pueda tener departamento', async () => {
            const validUserData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                role: ['investigador contratado'],
                department: 'ingeniería electrónica y comunicaciones'
            };
            
            const savedUser = { ...validUserData, id: 'user123' };
            userService.userRepository.findByEmail.mockResolvedValue(null);
            userService.userRepository.save.mockResolvedValue(savedUser);
            
            const result = await userService.handleCreateUser(validUserData);
            
            expect(userService.userRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    role: validUserData.role,
                    department: validUserData.department
                })
            );
            expect(result.department).toEqual(validUserData.department);
        });
        
        it('Valida que un técnico de laboratorio pueda tener departamento', async () => {
            const validUserData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                role: ['técnico de laboratorio'],
                department: 'informática e ingeniería de sistemas'
            };
            
            const savedUser = { ...validUserData, id: 'user123' };
            userService.userRepository.findByEmail.mockResolvedValue(null);
            userService.userRepository.save.mockResolvedValue(savedUser);
            
            const result = await userService.handleCreateUser(validUserData);
            
            expect(userService.userRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    role: validUserData.role,
                    department: validUserData.department
                })
            );
            expect(result.department).toEqual(validUserData.department);
        });
        
        it('Valida que un gerente que también es docente-investigador pueda tener departamento', async () => {
            const validUserData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                role: ['gerente', 'docente-investigador'],
                department: 'informática e ingeniería de sistemas'
            };
            
            const savedUser = { ...validUserData, id: 'user123' };
            userService.userRepository.findByEmail.mockResolvedValue(null);
            userService.userRepository.save.mockResolvedValue(savedUser);
            
            const result = await userService.handleCreateUser(validUserData);
            
            expect(userService.userRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    role: validUserData.role,
                    department: validUserData.department
                })
            );
            expect(result.department).toEqual(validUserData.department);
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
    });
});