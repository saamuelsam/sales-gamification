"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.alterTable('users', (table) => {
        table.boolean('email_verified').defaultTo(false).notNullable();
        table.string('email_verification_token', 255).nullable();
        table.timestamp('email_verification_expires').nullable();
        table.string('password_reset_token', 255).nullable();
        table.timestamp('password_reset_expires').nullable();
    });
}
async function down(knex) {
    await knex.schema.alterTable('users', (table) => {
        table.dropColumn('email_verified');
        table.dropColumn('email_verification_token');
        table.dropColumn('email_verification_expires');
        table.dropColumn('password_reset_token');
        table.dropColumn('password_reset_expires');
    });
}
