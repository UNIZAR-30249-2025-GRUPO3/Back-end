const express = require('express');
/**
 * @swagger
 * tags:
 *   name: Spaces
 *   description: Endpoints para la gestión de espacios en el edificio
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
 *     SpaceType:
 *       type: string
 *       description: Tipo de espacio
 *       enum: [aula, despacho, seminario, laboratorio, "sala común"]
 *     ReservationCategory:
 *       type: string
 *       description: Categoría de reserva del espacio
 *       enum: [aula, seminario, laboratorio, "sala común"]
 *     AssignmentTargetType:
 *       type: string
 *       description: Tipo de asignación del espacio
 *       enum: [person, department, eina]
 *     Space:
 *       type: object
 *       required:
 *         - name
 *         - floor
 *         - capacity
 *         - spaceType
 *         - isReservable
 *         - assignmentTarget
 *         - idSpace
 *       properties:
 *         id:
 *           type: string
 *           description: ID autogenerado del espacio
 *         name:
 *           type: string
 *           description: Nombre del espacio
 *         floor:
 *           type: integer
 *           description: Planta donde se encuentra el espacio (0-4)
 *         capacity:
 *           type: integer
 *           description: Capacidad en número de personas
 *         spaceType:
 *           $ref: '#/components/schemas/SpaceType'
 *         isReservable:
 *           type: boolean
 *           description: Indica si el espacio se puede reservar
 *         reservationCategory:
 *           $ref: '#/components/schemas/ReservationCategory'
 *         assignmentTarget:
 *           type: object
 *           properties:
 *             type:
 *               $ref: '#/components/schemas/AssignmentTargetType'
 *             targets:
 *               type: array
 *               items:
 *                 type: string
 *               description: IDs de los targets (personas o departamentos)
 *         idSpace:
 *           type: string
 *           description: ID real del espacio
 *         maxUsagePercentage:
 *           type: integer
 *           nullable: true
 *           description: Porcentaje máximo de uso (null usa el valor del edificio)
 *         customSchedule:
 *           type: object
 *           nullable: true
 *           description: Horario personalizado (null usa el horario del edificio)
 */

const { isAuthenticated, gerenteAuthorized } = require('../middleware/authMiddleware');

function setupSpaceRoutes(spaceController) {
  const router = express.Router();

  /**
   * 
   * /api/spaces:
   *   post:
   *     summary: Crear un nuevo espacio
   *     description: Crea un espacio y lo almacena en la base de datos. Requiere autenticación y rol de gerente.
   *     tags: [Spaces]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Space'
   *           example:
   *             name: "Aula 1.01"
   *             floor: 1
   *             capacity: 40
   *             spaceType: "aula"
   *             isReservable: true
   *             reservationCategory: "aula"
   *             idSpace: "CRE.1200.05.320"
   *             assignmentTarget:
   *               type: "eina"
   *               targets: []
   *             maxUsagePercentage: null
   *             customSchedule: null
   *     responses:
   *       201:
   *         description: Espacio creado exitosamente
   *       400:
   *         description: Error en la solicitud (datos inválidos)
   *       401:
   *         description: No autenticado
   *       403:
   *         description: No autorizado (requiere rol de gerente)
   */
  // NO SE PERMITER CREAR NUEVOS ESPACIOS - ESTOS YA ESTAN PRECARGADOS EN EL SISTEMA
  // router.post('/', isAuthenticated, gerenteAuthorized, (req, res) => spaceController.createSpace(req, res));

  /**
   * @swagger
   * /api/spaces/{id}:
   *   get:
   *     summary: Obtener información de un espacio por ID
   *     description: Recupera los datos de un espacio existente usando su ID.
   *     tags: [Spaces]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         description: ID del espacio a recuperar
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Espacio encontrado exitosamente
   *       400:
   *         description: Error en la solicitud (ID inválido)
   *       404:
   *         description: Espacio no encontrado
   */
  router.get('/:id', (req, res) => spaceController.getSpaceById(req, res));

  /**
   * @swagger
   * /api/spaces/{id}:
   *   put:
   *     summary: Actualizar información limitada de un espacio por ID
   *     description: Actualiza solo campos específicos permitidos de un espacio existente. Requiere autenticación y rol de gerente.
   *     tags: [Spaces]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         description: ID del espacio a actualizar
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             description: Solo se pueden actualizar los siguientes campos
   *             properties:
   *               reservationCategory:
   *                 $ref: '#/components/schemas/ReservationCategory'
   *                 description: Categoría de reserva del espacio
   *               assignmentTarget:
   *                 type: object
   *                 properties:
   *                   type:
   *                     $ref: '#/components/schemas/AssignmentTargetType'
   *                   targets:
   *                     type: array
   *                     items:
   *                       type: string
   *                     description: IDs de los targets (personas o departamentos)
   *               maxUsagePercentage:
   *                 type: integer
   *                 nullable: true
   *                 description: Porcentaje máximo de uso (null usa el valor del edificio)
   *               customSchedule:
   *                 type: object
   *                 nullable: true
   *                 description: Horario personalizado (null usa el horario del edificio)
   *                 properties:
   *                   weekdays:
   *                     type: object
   *                     properties:
   *                       open:
   *                         type: string
   *                         format: time
   *                         example: "08:30"
   *                       close:
   *                         type: string
   *                         format: time
   *                         example: "20:00"
   *                   saturday:
   *                     type: object
   *                     properties:
   *                       open:
   *                         type: string
   *                         format: time
   *                         nullable: true
   *                       close:
   *                         type: string
   *                         format: time
   *                         nullable: true
   *                   sunday:
   *                     type: object
   *                     properties:
   *                       open:
   *                         type: string
   *                         format: time
   *                         nullable: true
   *                       close:
   *                         type: string
   *                         format: time
   *                         nullable: true
   *               isReservable:
   *                 type: boolean
   *                 description: Indica si el espacio se puede reservar
   *           example:
   *             reservationCategory: "aula"
   *             isReservable: true
   *             assignmentTarget:
   *               type: "eina"
   *               targets: []
   *             maxUsagePercentage: 75
   *             customSchedule: {
   *               weekdays: { open: "08:30", close: "20:00" },
   *               saturday: { open: "09:00", close: "14:00" },
   *               sunday: { open: null, close: null }
   *             }
   *     responses:
   *       200:
   *         description: Espacio actualizado exitosamente
   *       400:
   *         description: Error en la solicitud (campos inválidos o no permitidos)
   *       401:
   *         description: No autenticado o token inválido
   *       403:
   *         description: No autorizado (requiere rol de gerente)
   *       404:
   *         description: Espacio no encontrado
   */
  router.put('/:id', isAuthenticated, gerenteAuthorized, (req, res) => spaceController.updateSpace(req, res));

  /**
   *
   * /api/spaces/{id}:
   *   delete:
   *     summary: Eliminar un espacio por ID
   *     description: Elimina un espacio de la base de datos. Requiere autenticación y rol de gerente.
   *     tags: [Spaces]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         description: ID del espacio a eliminar
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Espacio eliminado exitosamente
   *       400:
   *         description: Error en la solicitud (ID inválido)
   *       401:
   *         description: No autenticado
   *       403:
   *         description: No autorizado (requiere rol de gerente)
   *       404:
   *         description: Espacio no encontrado
   */
  // NO SE PERMITEN ELIMINAR LOS ESPACIOS DEL SISTEMA - ESTOS SON UNOS FIJOS YA PRECARGADOS
  // router.delete('/:id', isAuthenticated, gerenteAuthorized, (req, res) => spaceController.deleteSpace(req, res));

  /**
   * @swagger
   * /api/spaces:
   *   get:
   *     summary: Obtener todos los espacios
   *     description: Devuelve una lista de todos los espacios registrados.
   *     tags: [Spaces]
   *     responses:
   *       200:
   *         description: Lista de espacios obtenida exitosamente
   *       400:
   *         description: Error en la solicitud
   */
  router.get('/', (req, res) => spaceController.getAllSpaces(req, res));

  /**
   * @swagger
   * /api/spaces/floor/{floor}:
   *   get:
   *     summary: Buscar espacios por planta
   *     description: Devuelve todos los espacios ubicados en una planta específica.
   *     tags: [Spaces]
   *     parameters:
   *       - in: path
   *         name: floor
   *         required: true
   *         description: Número de planta (0-4)
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Lista de espacios encontrados
   *       400:
   *         description: Error en la solicitud (planta inválida)
   */
  router.get('/floor/:floor', (req, res) => spaceController.findSpacesByFloor(req, res));

  /**
   * @swagger
   * /api/spaces/category/{category}:
   *   get:
   *     summary: Buscar espacios por categoría
   *     description: Devuelve todos los espacios de una categoría específica.
   *     tags: [Spaces]
   *     parameters:
   *       - in: path
   *         name: category
   *         required: true
   *         description: Categoría de reserva (aula, seminario, laboratorio, sala común)
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Lista de espacios encontrados
   *       400:
   *         description: Error en la solicitud (categoría inválida)
   */
  router.get('/category/:category', (req, res) => spaceController.findSpacesByCategory(req, res));

  /**
   * @swagger
   * /api/spaces/occupants/{minOccupants}:
   *   get:
   *     summary: Buscar espacios por ocupantes mínimos
   *     description: Devuelve todos los espacios que pueden acomodar al menos un número específico de ocupantes, considerando el porcentaje máximo de ocupación.
   *     tags: [Spaces]
   *     parameters:
   *       - in: path
   *         name: minOccupants
   *         required: true
   *         description: Número mínimo de ocupantes requeridos
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Lista de espacios encontrados
   *       400:
   *         description: Error en la solicitud (valor inválido)
   */
  router.get('/occupants/:minOccupants', (req, res) => spaceController.findSpacesByMinOccupants(req, res));

  return router;
}

module.exports = setupSpaceRoutes;