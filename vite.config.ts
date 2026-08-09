/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function sheetCsvDevProxy(): Plugin {
  return {
    name: 'sheet-csv-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/api/sheet-csv', async (req, res) => {
        const incoming = req as { method?: string; url?: string };
        if (incoming.method === 'OPTIONS') {
          res.statusCode = 204;
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end();
          return;
        }
        if (incoming.method !== 'GET') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }

        const url = new URL(incoming.url ?? '', 'http://localhost');
        const id = url.searchParams.get('id')?.trim() ?? '';
        if (!id || !/^[a-zA-Z0-9-_]+$/.test(id)) {
          res.statusCode = 400;
          res.end('Missing or invalid sheet id');
          return;
        }

        const gid = url.searchParams.get('gid')?.trim() ?? '';
        const exportUrl = new URL(`https://docs.google.com/spreadsheets/d/${id}/export`);
        exportUrl.searchParams.set('format', 'csv');
        if (gid) exportUrl.searchParams.set('gid', gid);

        try {
          const upstream = await fetch(exportUrl.toString());
          if (!upstream.ok) {
            res.statusCode = upstream.status;
            res.end('Could not fetch sheet');
            return;
          }
          const csv = await upstream.text();
          res.statusCode = 200;
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Content-Type', 'text/csv; charset=utf-8');
          res.end(csv);
        } catch {
          res.statusCode = 502;
          res.end('Failed to reach Google Sheets');
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), sheetCsvDevProxy()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
