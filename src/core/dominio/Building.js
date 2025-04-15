class Building {

    // SERÍA NECESARIO ALMACENARLO EN LA BD?? - ahora si se cae se pierde lo guardado
      
    constructor() {

        // Propiedades del edificio
        this.id = "ada-byron";
        this.name = "Edificio Ada Byron";
        this.floors = 4;
        this._maxOccupancyPercentage = 100;
        this._openingHours = {
            weekdays: { open: "08:00", close: "21:00" },
            saturday: { open: "09:00", close: "14:00" },
            sunday: { open: null, close: null }
        };
    }

    // Getters
    get maxOccupancyPercentage() {
        return this._maxOccupancyPercentage;
    }

    get openingHours() {
        return this._openingHours;
    }

    // Setters con validación
    set maxOccupancyPercentage(percentage) {
        if (typeof percentage !== 'number' || percentage < 0 || percentage > 100) {
            throw new Error("El porcentaje de ocupación debe estar entre 0 y 100");
        }
        this._maxOccupancyPercentage = percentage;
    }

    // Método para actualizar un horario específico
    updateOpeningHours(day, hours) {
        const validDays = ['weekdays', 'saturday', 'sunday'];
        if (!validDays.includes(day)) {
            throw new Error("Día no válido. Debe ser weekdays, saturday o sunday");
        }

        // Validar formato de horas (HH:MM o null)
        const validateTimeFormat = (time) => {
            if (time === null) return true;
            const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
            return timeRegex.test(time);
        };

        if ((hours.open !== undefined && !validateTimeFormat(hours.open)) || 
            (hours.close !== undefined && !validateTimeFormat(hours.close))) {
            throw new Error("Formato de hora inválido. Debe ser HH:MM o null");
        }

        // Actualizar solo los campos proporcionados
        if (hours.open !== undefined) {
            this._openingHours[day].open = hours.open;
        }
        
        if (hours.close !== undefined) {
            this._openingHours[day].close = hours.close;
        }
    }
}

module.exports = Building;