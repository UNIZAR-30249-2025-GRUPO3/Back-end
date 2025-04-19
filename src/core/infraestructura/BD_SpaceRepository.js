const SpaceRepository = require('../dominio/SpaceRepository');
const SpaceFactory = require('../dominio/SpaceFactory');

/**
 * BD_SpaceRepository.js
 * 
 * IMPLEMENTACIÓN CONCRETA DEL REPOSITORIO: 
 * - Implementa la interfaz del repositorio
 * - Pertenece a la capa de infraestructura
 * - Se encarga de la persistencia real del agregado
 */
class BD_SpaceRepository extends SpaceRepository {

    // DE MOMENTO LA PERSISTENCIA SE HACE EN MEMORIA PARA PRUEBAS - LUEGO PASAR A BD

    constructor() {
        super();
        this.spaces = new Map();
        this.nextId = 1;
    }
    
    async findById(id) {
        return this.spaces.get(Number(id)) || null;
    }
    
    async save(space) {
        const id = space.id || this.nextId;
        
        let newSpace;
        if (space.id) {
            // Si ya tiene ID, se usa ese ID
            newSpace = SpaceFactory.createFromData({
                ...space,
                id: space.id
            });
        } else {
            // Si no tiene ID, se genera uno nuevo
            newSpace = SpaceFactory.createFromData({
                ...space,
                id: id
            });
            this.nextId++;
        }
        
        this.spaces.set(id, newSpace);
        return newSpace;
    }
    
    async update(space) {
        if (!this.spaces.has(Number(space.id))) {
          throw new Error('Espacio no encontrado');
        }

        const updatedSpace = SpaceFactory.createFromData(space);
        this.spaces.set(Number(space.id), updatedSpace);
        
        return updatedSpace;
    }
    
    async delete(id) {
        return this.spaces.delete(Number(id));
    }
    
    async findAll(filters = {}) {
        let spaces = [...this.spaces.values()];
        
        // Se aplican filtros si hay
        if (filters.floor !== undefined) {
            spaces = spaces.filter(space => space.floor === filters.floor);
        }
        
        if (filters.isReservable !== undefined) {
            spaces = spaces.filter(space => space.isReservable === filters.isReservable);
        }
        
        if (filters.category) {
            spaces = spaces.filter(space => 
                space.reservationCategory && space.reservationCategory.name === filters.category
            );
        }
        
        if (filters.minCapacity) {
            spaces = spaces.filter(space => 
                space.getCurrentCapacity() >= filters.minCapacity
            );
        }
        
        if (filters.spaceType) {
            spaces = spaces.filter(space => 
                space.spaceType.name === filters.spaceType
            );
        }
        
        return spaces;
    }

    async findByFilters(criteria) {
        return this.findAll(criteria);
    }

    async findAvailableSpaces(dateTime, duration, minCapacity) {

        // AQUI CONSULTAR A LAS RESERVAS PARA VERIFICAR LAS DEMÁS COSAS NECESARIAS
        // TMB SE DEBERA LIMITAR SEGUN FECHAS Y SU DURACION
        
        const availableSpaces = await this.findAll({
            isReservable: true,
            minCapacity: minCapacity
        });
        
        return availableSpaces;
    }

    async findByFloor(floor) {
        return this.findAll({ floor });
    }

    async findByCategory(category) {
        return this.findAll({ category });
    }

    async findByDepartment(department) {
        const spaces = [...this.spaces.values()];
        
        return spaces.filter(space => {
            if (space.assignmentTarget && space.assignmentTarget.getType() === 'department') {
                return space.assignmentTarget.getTargets().includes(department);
            }
            return false;
        });
    }
}

module.exports = BD_SpaceRepository;