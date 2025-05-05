const SpaceRepository = require('../dominio/SpaceRepository');
const SpaceFactory = require('../dominio/SpaceFactory');
const pool = require('../infraestructura/db');

/**
 * BD_SpaceRepository.js
 * 
 * IMPLEMENTACIÓN CONCRETA DEL REPOSITORIO: 
 * - Implementa la interfaz del repositorio
 * - Pertenece a la capa de infraestructura
 * - Se encarga de la persistencia real del agregado
 */
class BD_SpaceRepository extends SpaceRepository {
    
    // DE MOMENTO LA PERSISTENCIA SE HACE EN MEMORIA PARA PRUEBAS - LUEGO PASAR A BD

    async findById(id) {
        const res = await pool.query('SELECT id, nombre as name, floor, capacity, "spaceType", is_reservable as "isReservable", reservation_category as "reservationCategory", assignment_type as "assignmentType", assignment_targets as "assignmentTargets", max_usage_percentage as maxUsagePercentage FROM spaces WHERE id = $1', [id]);
        if (res.rows.length === 0) return null;
        const row = res.rows[0];
        if (!row) {
          return null;
        }
        const assignmentTarget = {
          type: row.assignmentType,
          targets: row.assignmentTargets
        };
        return SpaceFactory.createFromData({
          ...row,
          assignmentTarget: assignmentTarget
        });
        
      }
    
      async save(space) {
        const res = await pool.query(`
          INSERT INTO spaces (nombre, floor, capacity, is_reservable, max_usage_percentage, assignment_type, assignment_targets, reservation_category, "spaceType")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *;
        `, [
          space.name, 
          space.floor,
          space.capacity,
          space.isReservable,
          space.maxUsagePercentage,
          space.assignmentTarget.type || null, 
          space.assignmentTarget.targets || null, 
          space.reservationCategory || null,
          space.spaceType || 'otro',
        ]);
        console.log('Res categoryS:', space.reservationCategory); 
        const row = res.rows[0];
        if (!row) {
            throw new Error('Espacio no guardado');
        }
        const assignmentTarget = {
          type: row.assignment_type,
          targets: row.assignment_targets
        };
        return SpaceFactory.createFromData({
          ...row,
          name: space.name,
          assignmentTarget: assignmentTarget,
          reservationCategory: row.reservation_category,
          isReservable: row.is_reservable
        });
      }
      
    
      async update(space) {
        const reservationCategory =
        typeof space.reservationCategory === 'object' && space.reservationCategory !== null
          ? space.reservationCategory.name
          : space.reservationCategory;

        const res = await pool.query(`
          UPDATE spaces
          SET nombre = $1,
              floor = $2,
              capacity = $3,
              is_reservable = $4,
              max_usage_percentage = $5,
              assignment_type = $6,
              assignment_targets = $7,
              reservation_category = $8,
              "spaceType" = $9
          WHERE id = $10
          RETURNING *;
        `, [
          space.name,
          space.floor,
          space.capacity,
          space.isReservable,
          space.max_usage_percentage,
          space.assignmentTarget.type || null, 
          space.assignmentTarget.targets || null, 
          reservationCategory || null,
          space.spaceType || 'otro',
          space.id,
        ]);
        const row = res.rows[0];
        if (!row) {
            throw new Error('Espacio no encontrado');
        }
        const assignmentTarget = {
          type: row.assignment_type,
          targets: row.assignment_targets
        };
        return SpaceFactory.createFromData({
          ...row,
          name: space.name,
          assignmentTarget: assignmentTarget,
          reservationCategory: row.reservation_category,
          isReservable: row.is_reservable
        });
      }
    
      async delete(id) {
        await pool.query('DELETE FROM spaces WHERE id = $1', [id]);
      }
    
      async findAll(filters = {}) {
        let query = 'SELECT id, nombre as name, floor, capacity, "spaceType", is_reservable as isReservable, reservation_category as reservationCategory, assignment_type as "assignmentType", assignment_targets as "assignmentTargets", max_usage_percentage as maxUsagePercentage FROM spaces';
        const conditions = [];
        const values = [];

        if (filters.floor !== undefined) {
          values.push(filters.floor);
          conditions.push(`floor = $${values.length}`);
        }
    
        if (filters.is_reservable !== undefined) {
          values.push(filters.is_reservable);
          conditions.push(`is_reservable = $${values.length}`);
        }

        if (filters.maxUsagePercentage !== undefined) {
          values.push(filters.maxUsagePercentage);
          conditions.push(`maxUsagePercentage = $${values.length}`);
        }
    
        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }
    
        query += ' ORDER BY id ASC';

        const res = await pool.query(query, values);

        return res.rows.map(row => {
            const assignmentTarget = {
                type: row.assignmentType,
                targets: row.assignmentTargets
            };
        
            return SpaceFactory.createFromData({
                ...row,
                assignmentTarget: assignmentTarget
            });
        });
      }

    async findByFilters(filters) {
        return this.findAll(filters);
    }      

    async findByFloor(floor) {
        const res = await pool.query('SELECT id, nombre as name, floor, capacity, "spaceType", is_reservable as isReservable, reservation_category as reservationCategory, assignment_type as "assignmentType", assignment_targets as "assignmentTargets", max_usage_percentage as maxUsagePercentage FROM spaces WHERE floor = $1 ORDER BY id ASC', [floor]);
        return res.rows.map(row => {
            const assignmentTarget = {
                type: row.assignmentType,
                targets: row.assignmentTargets
            };
        
            return SpaceFactory.createFromData({
                ...row,
                assignmentTarget: assignmentTarget
            });
        });
    } 

    async findByCategory(category) {
        const res = await pool.query('SELECT id, nombre as name, floor, capacity, "spaceType", is_reservable as isReservable, reservation_category as reservationCategory, assignment_type as "assignmentType", assignment_targets as "assignmentTargets", max_usage_percentage as maxUsagePercentage FROM spaces WHERE reservation_category = $1 ORDER BY id ASC', [category]);
        return res.rows.map(row => {
            const assignmentTarget = {
                type: row.assignmentType,
                targets: row.assignmentTargets
            };
        
            return SpaceFactory.createFromData({
                ...row,
                assignmentTarget: assignmentTarget
            });
        });
    }
    

    async findByDepartment(department) {
        const res = await pool.query(`SELECT id, nombre as name, floor, capacity, "spaceType", is_reservable as isReservable, reservation_category as reservationCategory, assignment_type as "assignmentType", assignment_targets as "assignmentTargets", max_usage_percentage as maxUsagePercentage FROM spaces WHERE assignment_type = 'department' AND assignment_targets @> ARRAY[$1] ORDER BY id ASC`, [department]);
        return res.rows.map(row => {
            const assignmentTarget = {
                type: row.assignmentType,
                targets: row.assignmentTargets
            };
        
            return SpaceFactory.createFromData({
                ...row,
                assignmentTarget: assignmentTarget
            });
        });
    }
    
}

module.exports = BD_SpaceRepository;