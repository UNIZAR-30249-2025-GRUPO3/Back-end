class Department {

    constructor(name) {

        const validDepartments = [
            "informática e ingeniería de sistemas",
            "ingeniería electrónica y comunicaciones"
        ];

        if (!validDepartments.includes(name)) {
            throw new Error(`Departamento inválido`);
        }

        this.name = name;
    }

    equals(otherDepartment) {
        return this.name === otherDepartment.name;
    }
}

module.exports = Department;
