export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Sync-Secret',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const secret = request.headers.get('X-Sync-Secret');
    if (!env.SYNC_SECRET || secret !== env.SYNC_SECRET) {
      return new Response(JSON.stringify({ error: '同步密钥错误或未配置' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const KEY = 'screener_sync_data';

    if (request.method === 'GET') {
      const data = await env.SYNC_KV.get(KEY);
      return new Response(data || JSON.stringify({ updatedAt: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (request.method === 'POST') {
      let body;
      try {
        body = await request.text();
        JSON.parse(body);
      } catch (e) {
        return new Response(JSON.stringify({ error: '请求体不是合法JSON' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      await env.SYNC_KV.put(KEY, body);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  },
};
