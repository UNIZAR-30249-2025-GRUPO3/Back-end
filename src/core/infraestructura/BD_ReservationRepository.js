const ReservationFactory = require('../dominio/Reservation/ReservationFactory');
const ReservationRepository = require('../dominio/Reservation/ReservationRepository');
const pool = require('../infraestructura/db');

/**
 * BD_ReservationRepository.js
 *
 * IMPLEMENTACIÓN CONCRETA DEL REPOSITORIO:
 * - Implementa la interfaz del repositorio
 * - Pertenece a la capa de infraestructura
 * - Se encarga de la persistencia real del agregado
 */
class BD_ReservationRepository extends ReservationRepository {
   
    async findById(id) {
        const res = await pool.query(`
            SELECT * FROM reservations WHERE id = $1
        `, [id]);
    
        if (res.rows.length === 0) {
            console.log('row null');
            return null;
        } 
    
        return ReservationFactory.createFromData(res.rows[0]);
    }

    async save(reservation) {
        const res = await pool.query(`
            INSERT INTO reservations ("userId", "spaceIds", "usageType", "maxAttendees", "startTime", duration, "endTime", "additionalDetails", status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *;
        `, [
            reservation.userId,
            reservation.spaceIds,
            reservation.usageType,
            reservation.maxAttendees,
            reservation.startTime,
            reservation.duration,
            reservation.endTime,
            reservation.additionalDetails || null,
            reservation.status || 'pending'
        ]);

        console.log('Row guardado:', res.rows[0]); 
        if (!res.rows[0]) {
            throw new Error('Reserva no guardada');
        }
        return ReservationFactory.createFromData(res.rows[0]);
    }

    async update(reservation) {
        const res = await pool.query(`
            UPDATE reservations
            SET "userId" = $1,
                "spaceIds" = $2,
                "usageType" = $3,
                "maxAttendees" = $4,
                "startTime" = $5,
                duration = $6,
                "endTime" = $7,
                "additionalDetails" = $8,
                status = $9,
                invalidatedat = $10
            WHERE id = $11
            RETURNING *;
        `, [
            reservation.userId,
            reservation.spaceIds,
            reservation.usageType,
            reservation.maxAttendees,
            reservation.startTime,
            reservation.duration,
            reservation.endTime,
            reservation.additionalDetails || null,
            reservation.status,
            reservation.invalidatedat,
            reservation.id
        ]);

        const row = res.rows[0];
        
        console.log('Row guardado:', res.rows[0]); 
        if (!row) {
            throw new Error('Reserva no encontrada');
        }
        return ReservationFactory.createFromData(row);
    }
      

    async delete(id) {
        await pool.query('DELETE FROM reservations WHERE id = $1', [id]);
    }

    async findManyToDelete(query) {
        const result = await pool.query(`
        SELECT r.id, r."startTime", r."userId", u.email
        FROM reservations r
        JOIN users u ON r."userId" = u.id
        WHERE r.status = $1 AND r.invalidatedat <= $2
        `, [query.status, query.invalidatedat.$lte]);

        return result.rows;
    }


    async deleteByIds(reservationIds) {
        await pool.query(`
            DELETE FROM reservations
            WHERE id = ANY($1::uuid[])
        `, [reservationIds]);
    }

    async findAll(filters = {}) {
        let query = 'SELECT * FROM reservations';
        const conditions = [];
        const values = [];

        if (filters.spaceId !== undefined) {
            conditions.push(`$${values.length + 1} = ANY("spaceIds")`);
            values.push(filters.spaceId);
        }

        if (filters.userId !== undefined) {
            conditions.push(`"userId" = $${values.length + 1}`);
            values.push(filters.userId);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY id ASC';

        const res = await pool.query(query, values);
        return res.rows.map(row => ReservationFactory.createFromData(row));
    }

    async findBySpaceId(spaceId) {
        return this.findAll({ spaceId });
    }

    async findByUserId(userId) {
        return this.findAll({ userId });
    }

    async findAliveReservation() {
        const now = new Date();
        const res = await pool.query(`
            SELECT * FROM reservations WHERE "endTime" > $1
        `, [now]);

        return res.rows.map(row => ReservationFactory.createFromData(row));
    }

    async findOverlappingReservations(spaceIds, startTime, duration) {
        const start = new Date(startTime);
        const end = new Date(start.getTime() + duration * 60000);

        const res = await pool.query(`
            SELECT * FROM reservations
            WHERE "spaceIds" && $1::int[]
              AND (
                ("startTime" <= $2 AND "endTime" > $2) OR
                ("startTime" < $3 AND "endTime" >= $3) OR
                ("startTime" >= $2 AND "endTime" <= $3)
              )
        `, [
            Array.isArray(spaceIds) ? spaceIds : [spaceIds],
            start,
            end
        ]);

        if (res.rows.length === 0) {
            return [];
        }
        const validRows = res.rows.filter(row =>
            row.id && row.user_id && row.start_time && row.duration
        );
        console.log('Overlapping reservations:', res.rows);
        return res.rows.map(row => ReservationFactory.createFromData(row));
    }
    
}

module.exports = BD_ReservationRepository;
