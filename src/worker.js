/**
 * Hallalu Bookings Worker.
 * Static assets serve automatically (assets binding). The only dynamic route is
 * POST /api/chat — a booking assistant grounded ONLY in the page context the
 * client sends (services, prices, hours, location, policies, WhatsApp, email).
 * It is instructed never to invent facts; anything it can't answer routes the
 * visitor to WhatsApp / email / the booking button. Backed by Cloudflare
 * Workers AI (no third-party key). The frontend has its own local fallback, so
 * the feature still helps even if this endpoint is unavailable.
 */

const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

const clip = (s, n) => (typeof s === "string" ? s.slice(0, n) : "");

function buildSystem(ctx) {
  const c = ctx && typeof ctx === "object" ? ctx : {};
  const name = clip(c.name, 80) || "our studio";
  const lines = [
    `You are the friendly booking assistant for "${name}".`,
    c.tagline ? `About: ${clip(c.tagline, 300)}` : "",
  ];
  if (Array.isArray(c.services) && c.services.length) {
    lines.push("Services & prices:");
    for (const s of c.services.slice(0, 20)) {
      lines.push(
        `- ${clip(s.name, 60)} — ${clip(s.price, 24)}${s.duration ? `, ${clip(s.duration, 24)}` : ""}${
          s.description ? ` (${clip(s.description, 120)})` : ""
        }`
      );
    }
  }
  if (c.hours) lines.push(`Opening hours: ${clip(c.hours, 120)}`);
  if (c.location) lines.push(`Location: ${clip(c.location, 160)}`);
  if (Array.isArray(c.policies) && c.policies.length)
    lines.push("Policies: " + c.policies.slice(0, 8).map((p) => clip(p, 140)).join("; "));
  if (c.whatsapp) lines.push(`WhatsApp: ${clip(c.whatsapp, 40)}`);
  if (c.email) lines.push(`Email: ${clip(c.email, 80)}`);
  lines.push(
    "",
    'To book: the visitor taps "Reserve My Spot" on this page, picks a service, then a time — under a minute.',
    "RULES:",
    "- Be warm and concise: 1–3 short sentences.",
    "- Use ONLY the facts above. Never invent prices, durations, availability, addresses or policies.",
    "- You cannot see live availability or make/cancel bookings yourself — for those, point them to the booking button.",
    "- If a question isn't covered above, say so briefly and give the WhatsApp number or email.",
    "- Never ask for card numbers, passwords or payment details in chat."
  );
  return lines.filter(Boolean).join("\n");
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/chat") {
      if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
      if (!env.AI) return json({ error: "unavailable" }, 503);
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "bad request" }, 400);
      }
      const history = Array.isArray(body.messages) ? body.messages : [];
      const msgs = history
        .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .slice(-10)
        .map((m) => ({ role: m.role, content: clip(m.content, 800) }));
      if (!msgs.length || msgs[msgs.length - 1].role !== "user")
        return json({ error: "no question" }, 400);

      const messages = [{ role: "system", content: buildSystem(body.context) }, ...msgs];
      try {
        const out = await env.AI.run(MODEL, { messages, max_tokens: 320, temperature: 0.4 });
        const reply = (((out && out.response) ?? out?.result?.response) ?? "").toString().trim();
        return json({ reply: reply || null });
      } catch (e) {
        return json({ error: "ai_error", detail: String((e && e.message) || e) }, 502);
      }
    }

    // Everything else is served by the static assets binding (SPA fallback).
    return env.ASSETS.fetch(request);
  },
};
