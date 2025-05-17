const express = require('express');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Endpoints para autenticación de usuarios
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

function setupAuthRoutes(authController) {
  const router = express.Router();

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: Iniciar sesión de un usuario
   *     description: Permite a un usuario iniciar sesión proporcionando su email y contraseña. Devuelve un token JWT.
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
   *         description: Login exitoso, devuelve token JWT
   *         content:
   *           application/json:
   *             example:
   *               message: "OK"
   *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *               user:
   *                 user_id: "12345"
   *                 role: ["gerente"]
   *       400:
   *         description: Error en la solicitud (credenciales inválidas)
   *       500:
   *         description: Error en el servidor
   */
  router.post('/login', (req, res) => authController.login(req, res));

  return router;
}

module.exports = setupAuthRoutes;
