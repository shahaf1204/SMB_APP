export const config = { runtime: 'edge' };

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  if (request.method !== 'GET') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id')?.trim() ?? '';
  if (!id || !/^[a-zA-Z0-9-_]+$/.test(id)) {
    return json({ error: 'Missing or invalid sheet id' }, 400);
  }

  const gid = url.searchParams.get('gid')?.trim() ?? '';
  const exportUrl = new URL(`https://docs.google.com/spreadsheets/d/${id}/export`);
  exportUrl.searchParams.set('format', 'csv');
  if (gid) exportUrl.searchParams.set('gid', gid);

  try {
    const upstream = await fetch(exportUrl.toString(), {
      headers: { 'User-Agent': 'SMB-Business-App/1.0' },
    });
    if (!upstream.ok) {
      return json(
        { error: 'Could not fetch sheet — verify sharing is enabled (Anyone with the link)' },
        upstream.status,
      );
    }
    const csv = await upstream.text();
    return new Response(csv, {
      status: 200,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'text/csv; charset=utf-8',
      },
    });
  } catch {
    return json({ error: 'Failed to reach Google Sheets' }, 502);
  }
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/json',
    },
  });
}
