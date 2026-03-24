exports.up = async function (knex) {
    // Create agent table
    await knex.schema.createTable("agent", function (table) {
        table.increments("id").primary();
        table.string("name", 255).notNullable();
        table.string("token", 255).notNullable().unique();
        table.integer("status").defaultTo(0).notNullable();
        table.dateTime("last_seen").defaultTo(null);
        table.dateTime("created_date").defaultTo(knex.fn.now()).notNullable();
    });

    // Add agent_id to monitor table
    await knex.schema.table("monitor", function (table) {
        table.integer("agent_id").unsigned().references("id").inTable("agent").onDelete("SET NULL").onUpdate("CASCADE");
    });
};

exports.down = async function (knex) {
    await knex.schema.table("monitor", function (table) {
        table.dropForeign("agent_id");
        table.dropColumn("agent_id");
    });

    await knex.schema.dropTable("agent");
};
