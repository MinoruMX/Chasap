import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
    up: (queryInterface: QueryInterface) => {
        return queryInterface.changeColumn("Messages", "ack", {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        });
    },

    down: (queryInterface: QueryInterface) => {
        return queryInterface.changeColumn("Messages", "ack", {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        });
    }
};
