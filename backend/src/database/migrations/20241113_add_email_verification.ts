import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.boolean('email_verified').defaultTo(false).notNullable();
    table.string('email_verification_token', 255).nullable();
    table.timestamp('email_verification_expires').nullable();
    table.string('password_reset_token', 255).nullable();
    table.timestamp('password_reset_expires').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('email_verified');
    table.dropColumn('email_verification_token');
    table.dropColumn('email_verification_expires');
    table.dropColumn('password_reset_token');
    table.dropColumn('password_reset_expires');
  });
}
