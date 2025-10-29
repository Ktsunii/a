// src/storage.js
// Storage mínimo em memória — serve para o servidor rodar agora.
// Exports: saveMessage, listMessages, storageHealth

const mem = {
  messages: [],
  startedAt: Date.now(),
};

export async function saveMessage(msg) {
  if (!msg?.id) throw new Error("msg.id ausente");
  if (!msg?.room  ) throw new Error("msg.room ausente");
  if (typeof msg.ts !== "number") msg.ts = Date.now();
  mem.messages.push({ ...msg });
  return true;
}

export async function listMessages(room, opts = {}) {
  const since = typeof opts.since === "number" ? opts.since : -Infinity;
  const limit = typeof opts.limit === "number" ? opts.limit : 1000;

  return mem.messages
    .filter(m => m.room === room && m.ts >= since)
    .sort((a, b) => a.ts - b.ts)
    .slice(-limit);
}

export async function storageHealth() {
  return {
    ok: true,
    provider: "memory",
    count: mem.messages.length,
    startedAt: mem.startedAt,
    now: Date.now(),
  };
}
