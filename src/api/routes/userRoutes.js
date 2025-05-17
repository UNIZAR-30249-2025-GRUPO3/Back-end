const express = require('express');
/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Endpoints para la gestión de usuarios. Hace falta iniciar sesión como gerente para poder ejecutar operaciones de usuario.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *         - role
 *       properties:
 *         id:
 *           type: string
 *           description: ID autogenerado del usuario.
 *         name:
 *           type: string
 *           description: Nombre del usuario.
 *         email:
 *           type: string
 *           format: email
 *           description: Email del usuario.
 *         password:
 *           type: string
 *           description: Contraseña del usuario de al menos 8 caracteres.
 *         role:
 *           type: array
 *           description: |
 *             Lista de roles del usuario.  
 *             Posibles valores:  
 *             - "estudiante"  
 *             - "investigador contratado"  
 *             - "docente-investigador"  
 *             - "conserje"  
 *             - "técnico de laboratorio"  
 *             - "gerente"
 *         department:
 *           type: string
 *           description: |
 *             Departamento al que pertenece el usuario (si aplica).  
 *             Posibles valores:  
 *             - "informática e ingeniería de sistemas"  
 *             - "ingeniería electrónica y comunicaciones"
 */



const { isAuthenticated, gerenteAuthorized } = require('../middleware/authMiddleware');

function setupUserRoutes(userController) {
  const router = express.Router();

  /**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Crear un nuevo usuario
 *     description: Crea un usuario y lo almacena en la base de datos. Requiere autenticación y rol de gerente.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *           example:
 *               name: "John Doe"
 *               email: "john@example.com"
 *               password: "securepassword"
 *               role: ["gerente"]
 *               department: ""
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *         content:
 *           application/json:
 *             example:
 *               id: "12345"
 *               name: "John Doe"
 *               email: "john@example.com"
 *               password: "securepassword"
 *               role: ["gerente"]
 *               department: ""
 *       400:
 *         description: Error en la solicitud (correo ya en uso o datos inválidos)
 *       401:
 *         description: No autenticado o token inválido
 *       403:
 *         description: No autorizado (no es gerente)
 */
  router.post('/', isAuthenticated, gerenteAuthorized, (req, res) => userController.createUser(req, res));

  /**
 * @swagger
 * /api/users/search/{id}:
 *   get:
 *     summary: Obtener información de un usuario por ID
 *     description: Recupera los datos de un usuario existente usando su ID. Requiere autenticación y rol de gerente.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del usuario a recuperar.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario encontrado exitosamente
 *         content:
 *           application/json:
 *             example:
 *               id: 1
 *               name: "John Doe"
 *               email: "john@example.com"
 *               password: "securepassword"
 *               role:
 *                 roles: ["gerente"]
 *               department: null
 *       400:
 *         description: Error en la solicitud (ID inválido o usuario no encontrado)
 *       401:
 *         description: No autenticado o token inválido
 *       403:
 *         description: No autorizado (no es gerente)
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error en el servidor
 */
  router.get('/search/:id', isAuthenticated, gerenteAuthorized, (req, res) => userController.getUserById(req, res));

  /**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Actualizar información de un usuario por ID.
 *     description: Actualiza los datos de un usuario existente usando su ID. Solo se actualizan los campos proporcionados en el cuerpo de la solicitud. Requiere autenticación y rol de gerente.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del usuario a actualizar.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *           example:
 *             name: "John Doe"
 *             email: "john@example.com"
 *             password: "securepassword"
 *             role: ["gerente"]
 *             department: ""
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 *         content:
 *           application/json:
 *             example:
 *               id: 1
 *               name: "John Doe"
 *               email: "john@example.com"
 *               password: "securepassword"
 *               role:
 *                 roles: ["gerente"]
 *               department: null
 *       400:
 *         description: Error en la solicitud (campos inválidos o datos inconsistentes)
 *       401:
 *         description: No autenticado o token inválido
 *       403:
 *         description: No tienes permisos para realizar esta acción
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error en el servidor
 */
  router.put('/:id', isAuthenticated, gerenteAuthorized, (req, res) => userController.updateUser(req, res));

  /**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Eliminar un usuario por ID.
 *     description: Elimina un usuario de la base de datos usando su ID. Requiere autenticación y rol de gerente.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del usuario a eliminar.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario eliminado exitosamente
 *         content:
 *           application/json:
 *             example:
 *               id: 1
 *               email: "john@example.com"
 *               deletedAt: "2025-03-29T00:00:00.000Z"
 *       400:
 *         description: Error en la solicitud (ID no válido)
 *       401:
 *         description: No autenticado o token inválido
 *       403:
 *         description: No tienes permisos para realizar esta acción
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error en el servidor
 */
  router.delete('/:id', isAuthenticated, gerenteAuthorized, (req, res) => userController.deleteUser(req, res));

  /**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Obtener todos los usuarios
 *     description: Devuelve una lista de todos los usuarios registrados. Requiere autenticación y rol de gerente.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida exitosamente
 *         content:
 *           application/json:
 *             example:
 *               - id: 1
 *                 name: "John Doe"
 *                 email: "john@example.com"
 *                 role: ["gerente"]
 *                 department: null
 *               - id: 2
 *                 name: "Jane Smith"
 *                 email: "jane@example.com"
 *                 role: ["docente-investigador"]
 *                 department: "ingeniería electrónica y comunicaciones"
 *       401:
 *         description: No autenticado o token inválido
 *       403:
 *         description: No autorizado (no es gerente)
 *       500:
 *         description: Error en el servidor
 */
  router.get('/', isAuthenticated, gerenteAuthorized, (req, res) => userController.getAllUsers(req, res));

  return router;
}

module.exports = setupUserRoutes;