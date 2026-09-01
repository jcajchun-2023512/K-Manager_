"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("@config/env");
const database_1 = require("@config/database");
async function bootstrap() {
    try {
        await (0, database_1.initializeDatabase)();
        const app = (0, app_1.createApp)();
        app.listen(env_1.env.port, () => {
            console.log(`🚀 K-Manager API corriendo en http://localhost:${env_1.env.port}`);
            console.log(`   Entorno: ${env_1.env.nodeEnv}`);
            console.log(`   Base de datos: PostgreSQL (${env_1.env.db.name})`);
        });
    }
    catch (error) {
        console.error('❌ Error fatal al iniciar el servidor:', error);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=server.js.map