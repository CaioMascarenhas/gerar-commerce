import { Pool, type PoolClient } from 'pg';

export const database = new Pool({
  connectionString:
    process.env['DATABASE_URL'] ?? 'postgres://gerar:gerar_local@127.0.0.1:5433/gerar_commerce',
  max: 8,
  connectionTimeoutMillis: 5000,
});
database.on('error', (error) => console.error('Conexão PostgreSQL:', error.message));
export async function transaction<T>(action: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await database.connect();
  try {
    await client.query('BEGIN');
    const result = await action(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
export async function migrate(sql: string) {
  await database.query(sql);
}
