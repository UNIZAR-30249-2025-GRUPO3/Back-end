const ReservationFactory = require('../dominio/ReservationFactory');
const ReservationRepository = require('../dominio/ReservationRepository');

/**
 * BD_ReservationRepository.js
 *
 * IMPLEMENTACIÓN CONCRETA DEL REPOSITORIO:
 * - Implementa la interfaz del repositorio
 * - Pertenece a la capa de infraestructura
 * - Se encarga de la persistencia real del agregado
 */
class BD_ReservationRepository extends ReservationRepository {

    constructor() {
        super();
        this.reservations = new Map();
        this.nextId = 1;
    }

    async findById(id) {
        return this.reservations.get(Number(id)) || null;
    }

    async save(reservation) {
        const id = reservation.id || this.nextId;

        let newReservation;
        if (reservation.id) {
            newReservation = ReservationFactory.createFromData({
                ...reservation,
                id: reservation.id
            });
        } else {
            newReservation = ReservationFactory.createFromData({
                ...reservation,
                id: id
            });
            this.nextId++;
        }

        this.reservations.set(id, newReservation);
        return newReservation;
    }

    async update(id, partialData) {
        const numericId = Number(id);
      
        if (!this.reservations.has(numericId)) {
          throw new Error('Reserva no encontrada');
        }
        console.log('[DEBUG]Partial:\n', JSON.stringify(partialData, null, 2));
        
        const existingReservation = this.reservations.get(numericId);
      
        // Mezclamos cuidadosamente solo los campos que queremos actualizar
        const updatedReservation = ReservationFactory.createFromData({
          ...existingReservation,
          ...partialData,
          id: numericId  // nos aseguramos que el id no se pierda
        });
      
        console.log('[DEBUG] updated:\n', JSON.stringify(updatedReservation, null, 2));

        this.reservations.set(numericId, updatedReservation);
        return updatedReservation;
      }
      

    

    async delete(id) {
        return this.reservations.delete(Number(id));
    }

    async findAll(filters = {}) {
        let reservations = [...this.reservations.values()];

        if (filters.spaceId !== undefined) {
            reservations = reservations.filter(r =>
                r.space.some(s => s.id === filters.spaceId)
            );
        }

        return reservations;
    }

    async findBySpaceId(spaceId) {
        return this.findAll({ spaceId });
    }

    async findByUserId(userId) {
        const reservations = [...this.reservations.values()];
        return reservations.filter(r => String(r.userId) === String(userId));
    }

    async findAliveReservation() {
        const now = new Date();
        return reservations.filter(r => new Date(r.endDate) > now);
    }    

    async findOverlappingReservations(spaceIds, startTime, duration) {
        const start = new Date(startTime); 
        const endTime = new Date(start.getTime() + duration * 60000);
    
        const normalizedSpaceIds = Array.isArray(spaceIds)
            ? spaceIds.flat(Infinity).map(s => (typeof s === 'object' && s !== null ? s.id : s))
            : [typeof spaceIds === 'object' && spaceIds !== null ? spaceIds.id : spaceIds];
    
        const reservations = [...this.reservations.values()];
        return reservations.filter(r => 
            r.spaceIds.some(s => normalizedSpaceIds.includes(s.id)) &&
            (
                (start >= new Date(r.startTime) && start < new Date(r.endTime)) ||
                (endTime > new Date(r.startTime) && endTime <= new Date(r.endTime)) ||
                (start <= new Date(r.startTime) && endTime >= new Date(r.endTime))
            )
        );
    }
    
    
}

module.exports = BD_ReservationRepository;
