import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
    up: (queryInterface: QueryInterface) => {
        return Promise.all([
            queryInterface.addColumn("Contacts", "lid", {
                type: DataTypes.STRING,
                allowNull: true
            }),
            queryInterface.addColumn("Contacts", "lgpdAcceptedAt", {
                type: DataTypes.DATE,
                allowNull: true
            })
        ]);
    },

    down: (queryInterface: QueryInterface) => {
        return Promise.all([
            queryInterface.removeColumn("Contacts", "lid"),
            queryInterface.removeColumn("Contacts", "lgpdAcceptedAt")
        ]);
    }
};
