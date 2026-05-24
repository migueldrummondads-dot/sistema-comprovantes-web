// ─────────────────────────────────────────────────────────────
//  triagem.js — Lógica de triagem e renderização de resultado
// ─────────────────────────────────────────────────────────────

let historyItems = [];

async function realizarTriagem() {
    const nome = document.getElementById("nome").value.trim() || "Paciente";
    const idade = document.getElementById("idade").value.trim();
    const descricao = document.getElementById("sintomas-texto").value.trim();
    const chips = getSelectedChips();

    if (!descricao && chips.length === 0) {
        alert("Por favor, descreva seus sintomas ou selecione alguns chips.");
        return;
    }

    setTriagemLoading(true);

    try {
        const result = await apiTriagem({ nome, idade, chips, descricao });
        renderResult(result, nome);
        addToHistory(nome, result.nivel, result.titulo);
    } catch (err) {
        console.error("Erro na triagem:", err);
        renderResult({
            nivel: "consulta",
            titulo: "Erro ao conectar ao servidor",
            descricao: "Verifique se o back-end está rodando (npm run dev na pasta backend). Confirme que o .env tem sua API Key.",
            acoes: ["Execute: cd backend && npm run dev", "Verifique o arquivo .env", "Ligue 136 (Disque Saúde) para orientações"],
        }, nome);
    } finally {
        setTriagemLoading(false);
    }
}

function setTriagemLoading(isLoading) {
    const btn = document.getElementById("btn-triage");
    const typingText = document.getElementById("typing-text");

    btn.disabled = isLoading;
    btn.classList.toggle("loading", isLoading);
    typingText.textContent = isLoading ? "Analisando seus sintomas..." : "Análise concluída ✓";

    if (!isLoading) {
        setTimeout(() => (typingText.textContent = "Pronto para atender você..."), 3000);
    }
}

function renderResult(result, nome) {
    const card = document.getElementById("result-card");
    const badgeEl = document.getElementById("result-badge-el");
    const levelEl = document.getElementById("result-level-el");
    const textEl = document.getElementById("result-text-el");
    const actionsEl = document.getElementById("result-actions-el");

    const ICONS = { emergencia: "🚨", urgencia: "⚠️", consulta: "✅" };
    const LABELS = { emergencia: "EMERGÊNCIA", urgencia: "URGÊNCIA", consulta: "CONSULTA" };
    const BADGE = { emergencia: "badge-e", urgencia: "badge-u", consulta: "badge-c" };
    const CARD = { emergencia: "result-emergency", urgencia: "result-urgency", consulta: "result-consulta" };
    const AICO = { emergencia: "aico-e", urgencia: "aico-u", consulta: "aico-c" };

    const n = result.nivel || "consulta";

    card.className = `result-card ${CARD[n]}`;
    card.style.display = "block";

    badgeEl.className = `result-badge ${BADGE[n]}`;
    badgeEl.innerHTML = `${ICONS[n]} ${LABELS[n]}`;
    levelEl.textContent = result.titulo || "";
    textEl.textContent = result.descricao || "";

    actionsEl.innerHTML = (result.acoes || []).map(a => `
    <div class="action-row">
      <div class="action-ico ${AICO[n]}">${ICONS[n]}</div>
      <span>${a}</span>
    </div>`).join("");

    card.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function addToHistory(nome, nivel, titulo) {
    const time = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    historyItems.unshift({ nome, nivel, titulo, time });
    if (historyItems.length > 5) historyItems.pop();

    const listEl = document.getElementById("history-list");
    const BADGE_MAP = { emergencia: "bm-e", urgencia: "bm-u", consulta: "bm-c" };
    const LABEL_MAP = { emergencia: "Emergência", urgencia: "Urgência", consulta: "Consulta" };

    listEl.className = "";
    listEl.innerHTML = historyItems.map(h => `
    <div class="hist-item">
      <div class="hist-name">
        <span class="badge-mini ${BADGE_MAP[h.nivel]}">${LABEL_MAP[h.nivel]}</span>${h.nome}
      </div>
      <div class="hist-meta">${h.titulo} • ${h.time}</div>
    </div>`).join("");
}

function initTriagem() {
    document.getElementById("btn-triage").addEventListener("click", realizarTriagem);
} let historyItems = [];

async function realizarTriagem() {
    const nome = document.getElementById("nome").value.trim() || "Paciente";
    const idade = document.getElementById("idade").value.trim();
    const descricao = document.getElementById("sintomas-texto").value.trim();
    const chips = getSelectedChips();

    if (!descricao && chips.length === 0) {
        alert("Por favor, descreva seus sintomas ou selecione alguns chips.");
        return;
    }

    setLoading(true);

    try {
        const result = await apiTriagem({ nome, idade, chips, descricao });
        renderResult(result);
        addToHistory(nome, result.nivel, result.titulo);
    } catch (err) {
        renderResult({
            nivel: "consulta",
            titulo: "Erro ao conectar ao servidor",
            descricao: "Verifique se o back-end está rodando (npm run dev na pasta backend) e se o .env tem sua API Key.",
            acoes: ["Execute: cd backend && npm run dev", "Verifique o arquivo .env", "Ligue 136 (Disque Saúde)"],
        });
    } finally {
        setLoading(false);
    }
}

function setLoading(on) {
    const btn = document.getElementById("btn-triage");
    const txt = document.getElementById("typing-text");
    btn.disabled = on;
    btn.classList.toggle("loading", on);
    txt.textContent = on ? "Analisando seus sintomas..." : "Análise concluída ✓";
    if (!on) setTimeout(() => txt.textContent = "Pronto para atender...", 3000);
}

function renderResult(result) {
    const card = document.getElementById("result-card");
    const badgeEl = document.getElementById("result-badge-el");
    const levelEl = document.getElementById("result-level-el");
    const textEl = document.getElementById("result-text-el");
    const actEl = document.getElementById("result-actions-el");

    const ICONS = { emergencia: "🚨", urgencia: "⚠️", consulta: "✅" };
    const LABELS = { emergencia: "EMERGÊNCIA", urgencia: "URGÊNCIA", consulta: "CONSULTA" };
    const RBADGE = { emergencia: "rb-e", urgencia: "rb-u", consulta: "rb-c" };
    const RCARD = { emergencia: "result-emergency", urgencia: "result-urgency", consulta: "result-consulta" };
    const AICO = { emergencia: "ai-e", urgencia: "ai-u", consulta: "ai-c" };

    const n = result.nivel || "consulta";
    card.className = `result-wrap ${RCARD[n]}`;
    card.style.display = "block";

    badgeEl.className = `result-badge ${RBADGE[n]}`;
    badgeEl.textContent = `${ICONS[n]} ${LABELS[n]}`;
    levelEl.textContent = result.titulo || "";
    textEl.textContent = result.descricao || "";

    actEl.innerHTML = (result.acoes || []).map(a => `
    <div class="action-row">
      <div class="act-ico ${AICO[n]}">${ICONS[n]}</div>
      <span>${a}</span>
    </div>`).join("");

    card.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function addToHistory(nome, nivel, titulo) {
    const time = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    historyItems.unshift({ nome, nivel, titulo, time });
    if (historyItems.length > 5) historyItems.pop();

    const el = document.getElementById("history-list");
    const BM = { emergencia: "bm-e", urgencia: "bm-u", consulta: "bm-c" };
    const LBL = { emergencia: "Emergência", urgencia: "Urgência", consulta: "Consulta" };

    el.className = "";
    el.innerHTML = historyItems.map(h => `
    <div class="hist-item">
      <div class="hist-name"><span class="bmini ${BM[h.nivel]}">${LBL[h.nivel]}</span>${h.nome}</div>
      <div class="hist-meta">${h.titulo} · ${h.time}</div>
    </div>`).join("");
}

function initTriagem() {
    document.getElementById("btn-triage").addEventListener("click", realizarTriagem);
}