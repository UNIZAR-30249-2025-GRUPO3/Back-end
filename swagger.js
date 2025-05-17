const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "API Grupo 3",
            version: "1.0.0",
            description: "Documentación de la API creada junto a la posibilidad de ser probada con Swagger UI",
        },
        servers: [
            {
                url: "http://localhost:3000",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            }
        }
    },
    apis: ["./src/api/routes/*.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = { swaggerUi, swaggerDocs };
