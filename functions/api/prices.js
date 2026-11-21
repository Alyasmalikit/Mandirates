// Cloudflare Pages Function: /api/prices
// Fetches mandi prices from data.gov.in. The key lives in the Cloudflare variable DATA_GOV_API_KEY and is never sent to the browser.
const RID = '9ef84268-d588-465a-a308-a864a43d0070';
const json = (o, status = 200, extra = {}) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...extra } });
export async function onRequestGet({ request, env, waitUntil }) {
  if (!env.DATA_GOV_API_KEY) return json({ error: 'not configured' }, 503);
  const url = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '1000', 10) || 1000, 1), 1000);
  const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10) || 0, 0);
  const cache = caches.default;
  const cacheKey = new Request(`${url.origin}/api/prices?limit=${limit}&offset=${offset}`);
  const hit = await cache.match(cacheKey);
  if (hit) return hit;
  const api = `https://api.data.gov.in/resource/${RID}?api-key=${encodeURIComponent(env.DATA_GOV_API_KEY)}&format=json&limit=${limit}&offset=${offset}`;
  let r;
  try { r = await fetch(api, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MandiRates/1.0)', Accept: 'application/json' } }); }
  catch (e) { return json({ error: 'upstream unreachable' }, 502); }
  if (!r.ok) return json({ error: 'upstream ' + r.status }, 502);
  let d; try { d = await r.json(); } catch (e) { return json({ error: 'bad upstream data' }, 502); }
  const res = json({ records: d.records || [], total: d.total, updated: d.updated_date }, 200, { 'Cache-Control': 'public, max-age=300' });
  waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}
