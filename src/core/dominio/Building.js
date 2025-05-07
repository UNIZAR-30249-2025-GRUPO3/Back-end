class Building {

    // SERÍA NECESARIO ALMACENARLO EN LA BD?? - ahora si se cae se pierde lo guardado **********************************************
      
    constructor() {

        // Propiedades del edificio
        this.id = "ada-byron";
        this.name = "Edificio Ada Byron";
        this.floors = 4;
        this._maxOccupancyPercentage = 100;
        this._openingHours = {  // Según la información de Google Maps
            weekdays: { open: "08:00", close: "21:30" },
            saturday: { open: null, close: null },
            sunday: { open: null, close: null }
        };
    }
}

module.exports = Building;