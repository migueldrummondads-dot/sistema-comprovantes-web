// ─────────────────────────────────────────────────────────────
//  api.js — Comunicação com o back-end (localhost:3001)
// ─────────────────────────────────────────────────────────────

const API_BASE = "http://localhost:3002/api";

async function apiTriagem(payload) {
    const res = await fetch(`${API_BASE}/triagem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

async function apiChat(messages) {
    const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

async function apiHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.ok;
}
