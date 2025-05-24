class BuildingRepository {

    async findById(id) {
        throw new Error('Método no implementado');
    }

    async update(building) {
        throw new Error('Método no implementado');
    }
    
    async updateOccupancyPercentage(id, percentage) {
        throw new Error('Método no implementado');
    }

    async updateOpeningHours(id, openingHours) {
        throw new Error('Método no implementado');
    }
}

module.exports = BuildingRepository;