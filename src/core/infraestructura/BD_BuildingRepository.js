const BuildingRepository = require('../dominio/BuildingRepository');
const Building = require('../dominio/Building');
const pool = require('../infraestructura/db');

/**
 * BD_BuildingRepository.js
 * 
 * IMPLEMENTACIÓN CONCRETA DEL REPOSITORIO: 
 * - Implementa la interfaz del repositorio
 * - Pertenece a la capa de infraestructura
 * - Se encarga de la persistencia real del edificio
 */
class BD_BuildingRepository extends BuildingRepository {
    
    async findById(id) {
        const res = await pool.query(
            'SELECT id, name, floors, max_occupancy_percentage, opening_hours FROM building WHERE id = $1', 
            [id]
        );
        
        if (res.rows.length === 0) return null;
        
        const row = res.rows[0];
        return new Building({
            id: row.id,
            name: row.name,
            floors: row.floors,
            maxOccupancyPercentage: row.max_occupancy_percentage,
            openingHours: row.opening_hours
        });
    }
    
    async update(building) {
        const res = await pool.query(`
            UPDATE building 
            SET name = $1, 
                floors = $2, 
                max_occupancy_percentage = $3, 
                opening_hours = $4
            WHERE id = $5
            RETURNING *;
        `, [
            building.name,
            building.floors,
            building.maxOccupancyPercentage,
            JSON.stringify(building.openingHours),
            building.id
        ]);
        
        const row = res.rows[0];
        if (!row) {
            throw new Error('Edificio no encontrado');
        }
        
        console.log('[DEBUG] Edificio actualizado:', res.rows[0]);
        
        return new Building({
            id: row.id,
            name: row.name,
            floors: row.floors,
            maxOccupancyPercentage: row.max_occupancy_percentage,
            openingHours: row.opening_hours
        });
    }
    
    async updateOccupancyPercentage(id, percentage) {
        if (percentage < 0 || percentage > 100) {
            throw new Error('El porcentaje debe estar entre 0 y 100');
        }
        
        const res = await pool.query(`
            UPDATE building 
            SET max_occupancy_percentage = $1
            WHERE id = $2
            RETURNING *;
        `, [percentage, id]);
        
        const row = res.rows[0];
        if (!row) {
            throw new Error('Edificio no encontrado');
        }
        
        console.log('[DEBUG] Porcentaje de ocupación actualizado:', percentage);
        
        return new Building({
            id: row.id,
            name: row.name,
            floors: row.floors,
            maxOccupancyPercentage: row.max_occupancy_percentage,
            openingHours: row.opening_hours
        });
    }
    
    async updateOpeningHours(id, openingHours) {
        const res = await pool.query(`
            UPDATE building 
            SET opening_hours = $1
            WHERE id = $2
            RETURNING *;
        `, [JSON.stringify(openingHours), id]);
        
        const row = res.rows[0];
        if (!row) {
            throw new Error('Edificio no encontrado');
        }
        
        console.log('[DEBUG] Horarios de apertura actualizados:', openingHours);
        
        return new Building({
            id: row.id,
            name: row.name,
            floors: row.floors,
            maxOccupancyPercentage: row.max_occupancy_percentage,
            openingHours: row.opening_hours
        });
    }
}

module.exports = BD_BuildingRepository;