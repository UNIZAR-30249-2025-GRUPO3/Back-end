const express = require('express');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Endpoints para autenticación de usuarios
 */

function setupAuthRoutes(authController) {
  const router = express.Router();

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: Iniciar sesión de un usuario
   *     description: Permite a un usuario iniciar sesión proporcionando su email y contraseña.
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *           example:
   *             email: "john@example.com"
   *             password: "securepassword"
   *     responses:
   *       200:
   *         description: Login exitoso, establece sesión de usuario
   *         content:
   *           application/json:
   *             example:
   *               message: "OK"
   *               user:
   *                 user_id: "12345"
   *                 role: ["gerente"]
   *       400:
   *         description: Error en la solicitud (credenciales inválidas)
   *       500:
   *         description: Error en el servidor
   */
  router.post('/login', (req, res) => authController.login(req, res));

  /**
   * @swagger
   * /api/auth/logout:
   *   get:
   *     summary: Cerrar sesión del usuario
   *     description: Cierra la sesión actual del usuario eliminando sus datos de sesión. Importante hacer logout antes de cerrar el swagger porque aunque se reinicie la base de datos la cookie se guarda en el navegador.
   *     tags: [Auth]
   *     responses:
   *       200:
   *         description: Sesión cerrada exitosamente
   *         content:
   *           application/json:
   *             example:
   *               message: "Closed session"
   *       500:
   *         description: Error al cerrar la sesión
   */
  router.get('/logout', (req, res) => authController.logout(req, res));

  return router;
}

module.exports = setupAuthRoutes;
