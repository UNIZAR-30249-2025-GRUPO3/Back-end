class Role {

    constructor(roles) {

        const validRoles = [
            "estudiante", "investigador contratado", "docente-investigador",
            "conserje", "técnico de laboratorio", "gerente"
        ];

        if (!Array.isArray(roles)) {
            throw new Error("Los roles deben proporcionarse como un array.");
        }

        if (roles.length === 0) {
            throw new Error("Se debe proporcionar al menos un rol.");
        }

        roles.forEach(role => {
            if (!validRoles.includes(role)) {
                throw new Error(`Rol inválido`);
            }
        });
        
        if (roles.length > 2) {
            throw new Error("Un usuario no puede tener más de dos roles.");
        }

        if (roles.length === 2) {
            if (!(roles.includes("gerente") && roles.includes("docente-investigador"))) {
                throw new Error("Solo un gerente puede tener un segundo rol como docente-investigador.");
            }
        }

        this.roles = [...new Set(roles)];
    }

    hasRole(role) {
        return this.roles.includes(role);
    }

    equals(otherRole) {
        return this.roles.length === otherRole.roles.length &&
               this.roles.every(role => otherRole.roles.includes(role));
    }
}

module.exports = Role;
