    const schedule = require('node-cron').schedule;

    class ExpiredReservationCleaner {
        
    constructor(reservationRepository) {
        this.reservationRepository = reservationRepository;
    }

    start() {
        schedule('*/5 * * * *', async () => {
        console.log('[CRON] Ejecutando limpieza de reservas expiradas...');
        try {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            
            await this.reservationRepository.deleteMany({
            status: 'potentially_invalid',
            invalidatedat: { $lte: oneWeekAgo }
            });
            console.log('Reservas expiradas eliminadas exitosamente');
        } catch (error) {
            console.error('Error al eliminar reservas expiradas:', error);
        }
        });
    }
    }

    module.exports = ExpiredReservationCleaner;