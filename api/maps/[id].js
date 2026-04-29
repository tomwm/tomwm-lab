import { neon } from '@neondatabase/serverless';

const cors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;
  const sql = neon(process.env.DATABASE_URL);

  const [row] = await sql`
    SELECT id, name, node_count, edge_count, published_at, map_data
    FROM published_maps
    WHERE id = ${id}
  `;

  if (!row) return res.status(404).json({ error: 'Map not found' });

  return res.status(200).json({
    id: row.id,
    name: row.name,
    node_count: row.node_count,
    edge_count: row.edge_count,
    published_at: row.published_at,
    nodes: row.map_data.nodes,
    edges: row.map_data.edges,
  });
}
