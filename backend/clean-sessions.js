require('./dist/bootstrap');
const { Sequelize } = require('sequelize');
const dbConfig = require('./dist/config/database');

// Inicializar Sequelize
const sequelize = new Sequelize(dbConfig);

// Definir modelo Whatsapp manualmente
const Whatsapp = sequelize.define('Whatsapp', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: Sequelize.STRING,
    session: Sequelize.TEXT,
    qrcode: Sequelize.TEXT,
    status: Sequelize.STRING
}, {
    tableName: 'Whatsapps',
    timestamps: true
});

async function cleanSessions() {
    try {
        console.log('Conectando a la base de datos...');
        await sequelize.authenticate();
        console.log('Conexión exitosa');

        // Limpiar sesiones específicas con errores
        const result = await Whatsapp.update(
            { session: null, qrcode: null, status: 'DISCONNECTED' },
            { where: { name: ['Ohana', 'jony'] } }
        );

        console.log(`Sesiones limpiadas: ${result[0]} registros actualizados`);

        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

cleanSessions();