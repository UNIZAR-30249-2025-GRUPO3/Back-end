const pool = require('../infraestructura/db');

/**
 * BD_BuildingRepository.js
 * 
 * REPOSITORIO SIMPLIFICADO: 
 * - Maneja la persistencia del edificio
 */
class BD_BuildingRepository {
    
    // Obtener información completa del edificio
    async findById(id) {
        const res = await pool.query(
            'SELECT id, name, floors, max_occupancy_percentage, opening_hours FROM building WHERE id = $1', 
            [id]
        );
        
        if (res.rows.length === 0) return null;
        
        return res.rows[0];
    }
    
    // Obtener solo el porcentaje de ocupación
    async getOccupancyPercentage(id) {
        const res = await pool.query(
            'SELECT max_occupancy_percentage FROM building WHERE id = $1', 
            [id]
        );
        
        if (res.rows.length === 0) return null;
        
        return res.rows[0];
    }
    
    // Obtener solo los horarios de apertura
    async getOpeningHours(id) {
        const res = await pool.query(
            'SELECT opening_hours FROM building WHERE id = $1', 
            [id]
        );
        
        if (res.rows.length === 0) return null;
        
        return res.rows[0];
    }
    
    // Actualizar porcentaje de ocupación
    async updateOccupancyPercentage(id, percentage) {
        const res = await pool.query(`
            UPDATE building 
            SET max_occupancy_percentage = $1
            WHERE id = $2
            RETURNING max_occupancy_percentage;
        `, [percentage, id]);
        
        if (res.rows.length === 0) {
            throw new Error('Edificio no encontrado');
        }
        
        console.log('[DEBUG] Porcentaje de ocupación actualizado:', percentage);
        
        return res.rows[0];
    }
    
    // Actualizar horarios de apertura
    async updateOpeningHours(id, day, hours) {
        // Primero obtenemos los horarios actuales
        const currentRes = await pool.query(
            'SELECT opening_hours FROM building WHERE id = $1', 
            [id]
        );
        
        if (currentRes.rows.length === 0) {
            throw new Error('Edificio no encontrado');
        }

        const currentOpeningHours = currentRes.rows[0].opening_hours;
        
        // Preparar los nuevos horarios manteniendo los existentes
        const newOpeningHours = { ...currentOpeningHours };
        const currentHours = newOpeningHours[day];
        
        newOpeningHours[day] = {
            open: hours.open !== undefined ? hours.open : currentHours.open,
            close: hours.close !== undefined ? hours.close : currentHours.close
        };

        // Actualizar en la base de datos
        const updateRes = await pool.query(`
            UPDATE building 
            SET opening_hours = $1
            WHERE id = $2
            RETURNING opening_hours;
        `, [JSON.stringify(newOpeningHours), id]);
        
        if (updateRes.rows.length === 0) {
            throw new Error('Edificio no encontrado');
        }
        
        console.log('[DEBUG] Horarios de apertura actualizados:', newOpeningHours);
        
        return updateRes.rows[0];
    }
}

module.exports = BD_BuildingRepository;