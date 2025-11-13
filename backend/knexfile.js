require('dotenv').config();

// Monta a connection string a partir de DATABASE_URL ou variáveis DB_*
const connectionString =
  process.env.DATABASE_URL ||
  `postgres://${encodeURIComponent(process.env.DB_USER || process.env.POSTGRES_USER || 'admin')}:${encodeURIComponent(process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || 'admin123')}@${process.env.DB_HOST || 'postgres'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || process.env.POSTGRES_DB || 'sales_gamification'}`;

// Suporte SSL opcional
const sslOption = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false;

module.exports = {
  development: {
    client: 'postgresql',
    connection: connectionString,
    ssl: sslOption,
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: './src/database/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './src/database/seeds'
    }
  },

  production: {
    client: 'postgresql',
    connection: connectionString,
    ssl: sslOption,
    pool: {
      min: 2,
      max: 20
    },
    migrations: {
      directory: './src/database/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './src/database/seeds'
    }
  }
};
