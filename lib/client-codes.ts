type Queryable = { query: (query: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }> };

const CLIENT_CODE_LOCK = 819_204;
const pad = (value: number) => String(value).padStart(3, "0");

export async function nextClientCode(database: Queryable) {
  await database.query("SELECT pg_advisory_xact_lock($1)", [CLIENT_CODE_LOCK]);
  const result = await database.query(`SELECT COALESCE(MAX((substring(client_code FROM '^CL-([0-9]+)$'))::int), 0) + 1 AS value
    FROM clients WHERE client_code ~ '^CL-[0-9]+$'`);
  return `CL-${pad(Number(result.rows[0]?.value || 1))}`;
}

export async function nextBranchCode(database: Queryable, clientId: number) {
  await database.query("SELECT pg_advisory_xact_lock($1)", [clientId]);
  const client = await database.query("SELECT client_code FROM clients WHERE id=$1", [clientId]);
  const clientCode = String(client.rows[0]?.client_code || "");
  if (!clientCode) throw new Error("Client not found.");
  const result = await database.query(`SELECT COALESCE(MAX((substring(branch_code FROM '-BR-([0-9]+)$'))::int), 0) + 1 AS value
    FROM branches WHERE client_id=$1 AND branch_code LIKE $2`, [clientId, `${clientCode}-BR-%`]);
  return `${clientCode}-BR-${pad(Number(result.rows[0]?.value || 1))}`;
}
