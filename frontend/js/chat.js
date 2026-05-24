const chatHistory = [];

function initChat() {
    document.getElementById("chat-send-btn").addEventListener("click", enviarMensagem);
    document.getElementById("chat-input").addEventListener("keydown", e => {
        if (e.key === "Enter") enviarMensagem();
    });
}

async function enviarMensagem() {
    const input = document.getElementById("chat-input");
    const btn = document.getElementById("chat-send-btn");
    const msg = input.value.trim();
    if (!msg) return;

    btn.disabled = true;
    input.value = "";

    addMsg(msg, "user");
    chatHistory.push({ role: "user", content: msg });

    const loading = addMsg("...", "bot");

    try {
        const data = await apiChat(chatHistory.slice(-8));
        const reply = data.reply || "Desculpe, não consegui processar.";
        chatHistory.push({ role: "assistant", content: reply });
        loading.textContent = reply;
    } catch {
        loading.textContent = "Erro de conexão. Verifique se o back-end está rodando.";
    } finally {
        btn.disabled = false;
        scroll();
    }
}

function addMsg(text, type) {
    const el = document.createElement("div");
    el.className = `msg ${type}`;
    el.textContent = text;
    document.getElementById("chat-messages").appendChild(el);
    scroll();
    return el;
}

function scroll() {
    const el = document.getElementById("chat-messages");
    el.scrollTop = el.scrollHeight;
}