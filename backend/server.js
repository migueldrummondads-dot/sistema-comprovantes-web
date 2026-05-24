const express = require("express");
const cors = require("cors");
const Anthropic = require("@anthropic-ai/sdk");
require("dotenv").config({ path: "../.env" });

const app = express();
const PORT = 3002;

app.use(cors({ origin: "*" }));
app.use(express.json());

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Rota de triagem ──────────────────────────────────────────────────────────
app.post("/api/triagem", async (req, res) => {
    const { nome, idade, chips, descricao } = req.body;

    if (!descricao && (!chips || chips.length === 0)) {
        return res.status(400).json({ error: "Informe ao menos um sintoma." });
    }

    const systemPrompt = `Você é um sistema de triagem médica orientativo (NÃO substitui médico).
Analise os sintomas e classifique em: EMERGÊNCIA, URGÊNCIA ou CONSULTA.
Responda APENAS em JSON válido com este formato exato:
{
  "nivel": "emergencia" | "urgencia" | "consulta",
  "titulo": "string curta com o resultado",
  "descricao": "2-3 frases explicando a situação",
  "acoes": ["ação 1", "ação 2", "ação 3"],
  "urgente": true | false
}
Seja assertivo e direto. Leve em conta a idade se fornecida. Priorize a segurança.`;

    const userMsg = `Paciente: ${nome || "Não informado"}, ${idade ? idade + " anos" : "idade não informada"}.
Sintomas selecionados: ${chips && chips.length > 0 ? chips.join(", ") : "Nenhum chip"}
Descrição livre: ${descricao || "Não fornecida"}`;

    try {
        const message = await client.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            system: systemPrompt,
            messages: [{ role: "user", content: userMsg }],
        });

        const raw = message.content[0].text.replace(/```json|```/g, "").trim();
        const result = JSON.parse(raw);
        res.json(result);
    } catch (err) {
        console.error("Erro na triagem:", err.message);
        res.status(500).json({ error: "Erro ao processar triagem." });
    }
});

// ── Rota de chat ─────────────────────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Histórico de mensagens inválido." });
    }

    try {
        const message = await client.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 600,
            system:
                "Você é um assistente de saúde orientativo do TriagemIA. Responda em português, de forma clara, empática e concisa (máx 3 frases). Sempre lembre que não substitui médico. Não forneça diagnósticos definitivos.",
            messages: messages.slice(-8), // mantém contexto de até 8 mensagens
        });

        const reply = message.content[0].text;
        res.json({ reply });
    } catch (err) {
        console.error("Erro no chat:", err.message);
        res.status(500).json({ error: "Erro ao processar mensagem." });
    }
});

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`\n🏥 TriagemIA Backend rodando em http://localhost:${PORT}`);
    console.log(`   ✅ Rota triagem: POST /api/triagem`);
    console.log(`   ✅ Rota chat:    POST /api/chat`);
    console.log(`   ✅ Health check: GET  /api/health\n`);
});
