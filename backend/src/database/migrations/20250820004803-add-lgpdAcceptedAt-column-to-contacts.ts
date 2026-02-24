import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
    up: async (queryInterface: QueryInterface) => {
        const tableInfo: any = await queryInterface.describeTable("Contacts");
        if (!tableInfo.lgpdAcceptedAt) {
            return queryInterface.addColumn("Contacts", "lgpdAcceptedAt", {
                type: DataTypes.DATE,
                allowNull: true
            });
        }
    },

    down: (queryInterface: QueryInterface) => {
        return queryInterface.removeColumn("Contacts", "lgpdAcceptedAt");
    }
};
