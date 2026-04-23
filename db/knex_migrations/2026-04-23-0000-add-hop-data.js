exports.up = async function (knex) {
    await knex.schema.table("heartbeat", function (table) {
        table.float("packet_loss").defaultTo(0).notNullable();
        table.text("hop_data").defaultTo(null);
    });

    await knex.schema.table("monitor", function (table) {
        table.boolean("enable_hop_analysis").defaultTo(false).notNullable();
    });
};

exports.down = async function (knex) {
    await knex.schema.table("heartbeat", function (table) {
        table.dropColumn("packet_loss");
        table.dropColumn("hop_data");
    });
    
    await knex.schema.table("monitor", function (table) {
        table.dropColumn("enable_hop_analysis");
    });
};
