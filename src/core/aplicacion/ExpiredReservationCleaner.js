    const schedule = require('node-cron').schedule;
    const transporter = require('../infraestructura/mailer');

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
            
            const reservationsToDelete = await this.reservationRepository.findManyToDelete({
                status: 'potentially_invalid',
                invalidatedat: { $lte: oneWeekAgo }
            });

            for (const reservation of reservationsToDelete) {
                if (reservation.email) {
                    await transporter.sendMail({
                        from: '"Reservas Unizar" <noreply@reservasunizar.com>',
                        to: reservation.email,
                        subject: "Reserva eliminada",
                        text: `Tu reserva con ID ${reservation.id} de la fecha ${reservation.starttime} ha sido cancelada por mantener el estado de potencialmente inválida por una semana.`,
                    });
                }
            }

            const idsToDelete = reservationsToDelete.map(r => r.id);
            await this.reservationRepository.deleteByIds(idsToDelete);

            console.log('Reservas expiradas eliminadas exitosamente');
        } catch (error) {
            console.error('Error al eliminar reservas expiradas:', error);
        }
        });
    }
    }

    module.exports = ExpiredReservationCleaner;