class Building {
    
    constructor(data = {}) {
        // Si se reciben datos desde BD, los usamos | sino valores por defecto
        this.id = data.id || "ada-byron";
        this.name = data.name || "Edificio Ada Byron";
        this.floors = data.floors || 4;
        this.maxOccupancyPercentage = data.maxOccupancyPercentage || 100;
        this.openingHours = data.openingHours || {
            weekdays: { open: "08:00", close: "21:30" },
            saturday: { open: null, close: null },
            sunday: { open: null, close: null }
        };
    }
}

module.exports = Building;