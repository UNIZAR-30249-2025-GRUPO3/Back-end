const express = require('express');
const { isAuthenticated, gerenteAuthorized } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Building
 *   description: Endpoints para la gestión del edificio Ada Byron
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     BuildingInfo:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Identificador del edificio
 *         name:
 *           type: string
 *           description: Nombre del edificio
 *         floors:
 *           type: integer
 *           description: Número de plantas del edificio
 *         occupancyPercentage:
 *           type: integer
 *           description: Porcentaje máximo de ocupación permitido (0-100)
 *         openingHours:
 *           type: object
 *           description: Horarios de apertura del edificio
 *           properties:
 *             weekdays:
 *               type: object
 *               properties:
 *                 open:
 *                   type: string
 *                   format: HH:MM
 *                   description: Hora de apertura (días laborables)
 *                 close:
 *                   type: string
 *                   format: HH:MM
 *                   description: Hora de cierre (días laborables)
 *             saturday:
 *               type: object
 *               properties:
 *                 open:
 *                   type: string
 *                   format: HH:MM
 *                   description: Hora de apertura (sábados), null si cerrado
 *                 close:
 *                   type: string
 *                   format: HH:MM
 *                   description: Hora de cierre (sábados), null si cerrado
 *             sunday:
 *               type: object
 *               properties:
 *                 open:
 *                   type: string
 *                   format: HH:MM
 *                   description: Hora de apertura (domingos), null si cerrado
 *                 close:
 *                   type: string
 *                   format: HH:MM
 *                   description: Hora de cierre (domingos), null si cerrado
 */

function setupBuildingRoutes(buildingController) {
  const router = express.Router();

  /**
   * @swagger
   * /api/building:
   *   get:
   *     summary: Obtener información completa del edificio Ada Byron
   *     description: Recupera toda la información del edificio, incluyendo identificador, nombre, plantas, porcentaje de ocupación y horarios.
   *     tags: [Building]
   *     responses:
   *       200:
   *         description: Información del edificio obtenida exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/BuildingInfo'
   *             example:
   *               id: "ada-byron"
   *               name: "Edificio Ada Byron"
   *               floors: 4
   *               occupancyPercentage: 100
   *               openingHours:
   *                 weekdays: { open: "08:00", close: "21:30" }
   *                 saturday: { open: null, close: null }
   *                 sunday: { open: null, close: null }
   *       400:
   *         description: Error en la solicitud
   *       500:
   *         description: Error en el servidor
   */
  router.get('/', (req, res) => buildingController.getBuildingInfo(req, res));

  /**
   * @swagger
   * /api/building/occupancy:
   *   get:
   *     summary: Obtener el porcentaje de ocupación del edificio
   *     description: Recupera el porcentaje máximo de ocupación permitido en el edificio Ada Byron.
   *     tags: [Building]
   *     responses:
   *       200:
   *         description: Porcentaje de ocupación obtenido exitosamente
   *         content:
   *           application/json:
   *             example:
   *               occupancyPercentage: 100
   *       400:
   *         description: Error en la solicitud
   *       500:
   *         description: Error en el servidor
   */
  router.get('/occupancy', (req, res) => buildingController.getOccupancyPercentage(req, res));

  /**
   * @swagger
   * /api/building/hours:
   *   get:
   *     summary: Obtener los horarios de apertura del edificio
   *     description: Recupera los horarios de apertura del edificio Ada Byron para cada día de la semana.
   *     tags: [Building]
   *     responses:
   *       200:
   *         description: Horarios obtenidos exitosamente
   *         content:
   *           application/json:
   *             example:
   *               openingHours:
   *                 weekdays: { open: "08:00", close: "21:30" }
   *                 saturday: { open: null, close: null }
   *                 sunday: { open: null, close: null }
   *       400:
   *         description: Error en la solicitud
   *       500:
   *         description: Error en el servidor
   */
  router.get('/hours', (req, res) => buildingController.getOpeningHours(req, res));

  /**
   * @swagger
   * /api/building/occupancy:
   *   put:
   *     summary: Actualizar el porcentaje de ocupación del edificio
   *     description: Actualiza el porcentaje máximo de ocupación permitido en el edificio Ada Byron. Requiere autenticación y rol de gerente.
   *     tags: [Building]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - percentage
   *             properties:
   *               percentage:
   *                 type: integer
   *                 description: Nuevo porcentaje de ocupación (0-100)
   *           example:
   *             percentage: 75
   *     responses:
   *       200:
   *         description: Porcentaje de ocupación actualizado exitosamente
   *         content:
   *           application/json:
   *             example:
   *               success: true
   *               occupancyPercentage: 75
   *       400:
   *         description: Error en la solicitud (porcentaje inválido)
   *       401:
   *         description: No autenticado o token inválido
   *       403:
   *         description: No autorizado (requiere rol de gerente)
   *       500:
   *         description: Error en el servidor
   */
  router.put('/occupancy', isAuthenticated, gerenteAuthorized, (req, res) => 
    buildingController.updateOccupancyPercentage(req, res)
  );

  /**
   * @swagger
   * /api/building/hours:
   *   put:
   *     summary: Actualizar los horarios de apertura del edificio
   *     description: Actualiza los horarios de apertura del edificio Ada Byron para un día específico. Requiere autenticación y rol de gerente.
   *     tags: [Building]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - day
   *               - hours
   *             properties:
   *               day:
   *                 type: string
   *                 enum: [weekdays, saturday, sunday]
   *                 description: Día o grupo de días a actualizar
   *               hours:
   *                 type: object
   *                 properties:
   *                   open:
   *                     type: string
   *                     format: HH:MM
   *                     description: Hora de apertura en formato HH:MM o null si cerrado
   *                   close:
   *                     type: string
   *                     format: HH:MM
   *                     description: Hora de cierre en formato HH:MM o null si cerrado
   *           example:
   *             day: "saturday"
   *             hours:
   *               open: "09:00"
   *               close: "14:00"
   *     responses:
   *       200:
   *         description: Horarios actualizados exitosamente
   *         content:
   *           application/json:
   *             example:
   *               success: true
   *               openingHours:
   *                 weekdays: { open: "08:00", close: "21:30" }
   *                 saturday: { open: "09:00", close: "14:00" }
   *                 sunday: { open: null, close: null }
   *       400:
   *         description: Error en la solicitud (día o formato de hora inválido)
   *       401:
   *         description: No autenticado o token inválido
   *       403:
   *         description: No autorizado (requiere rol de gerente)
   *       500:
   *         description: Error en el servidor
   */
  router.put('/hours', isAuthenticated, gerenteAuthorized, (req, res) => 
    buildingController.updateOpeningHours(req, res)
  );

  return router;
}

module.exports = setupBuildingRoutes;