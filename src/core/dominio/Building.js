class Building {

    // SERÍA NECESARIO ALMACENARLO EN LA BD?? - ahora si se cae se pierde lo guardado **********************************************
      
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
}

module.exports = Building;