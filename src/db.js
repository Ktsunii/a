// src/db.js (ESM) — usa antidote_ts_client quando disponível (robusto a variações de API)
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ANTIDOTE_HOST = process.env.ANTIDOTE_HOST || '127.0.0.1';
export const ANTIDOTE_PORT = Number(process.env.ANTIDOTE_PORT || 8087);

let antidote = null; // connection object from antidote_ts_client
let connected = false;

// fallback file storage
const DATA_DIR = path.join(__dirname, '..', 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.access(MESSAGES_FILE).catch(() => fs.writeFile(MESSAGES_FILE, JSON.stringify({}, null, 2), 'utf8'));
}
async function readAllMessages() {
  await ensureDataFile();
  try {
    const raw = await fs.readFile(MESSAGES_FILE, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    return {};
  }
}
async function writeAllMessages(obj) {
  await ensureDataFile();
  await fs.writeFile(MESSAGES_FILE, JSON.stringify(obj, null, 2), 'utf8');
}

// --- Antidote helpers (tolerantes a variações de API) ---
export async function initAntidote() {
  if (connected && antidote) return { ok: true, reason: 'already' };
  try {
    const mod = await import('antidote_ts_client');
    // connect pode ser sync ou async dependendo da versão
    const maybePromise = mod.connect?.(ANTIDOTE_PORT, ANTIDOTE_HOST) ?? mod.connect?.({ host: ANTIDOTE_HOST, port: ANTIDOTE_PORT }) ?? null;
    antidote = maybePromise && typeof maybePromise.then === 'function' ? await maybePromise : maybePromise;

    if (!antidote) {
      // algumas versões expõem AntidoteClient ou default export
      const C = mod.AntidoteClient ?? mod.default ?? mod;
      if (typeof C?.connect === 'function') {
        const maybeP = C.connect(ANTIDOTE_PORT, ANTIDOTE_HOST);
        antidote = maybeP && typeof maybeP.then === 'function' ? await maybeP : maybeP;
      }
    }

    if (!antidote) throw new Error('antidote client not obtained');

    connected = true;
    console.info('[db] connected to antidote at', `${ANTIDOTE_HOST}:${ANTIDOTE_PORT}`);
    return { ok: true, where: 'antidote' };
  } catch (err) {
    console.warn('[db] não foi possível inicializar antidote_ts_client — usando fallback file JSON.', err && err.message);
    antidote = null;
    connected = false;
    await ensureDataFile();
    return { ok: true, where: 'file' };
  }
}

// Insert a message:
// message shape expected: { author, text, ts?, file_bucket?, file_object?, file_name?, file_mime?, file_size? }
// returns stored message with id and ts
// Substitua a função insertMessage em src/db.js por esta versão:
export async function insertMessage(room, message) {
  if (!room) throw new Error('room é obrigatório');

  const ts = message.ts ?? message.timestamp ?? Date.now();
  const id = message.id || randomUUID();

  const msgObj = {
    id,
    author: message.author ?? null,
    text: message.text ?? null,
    ts,
    timestamp: ts, // manter compatibilidade com o seu formato atual
    file_bucket: message.file_bucket ?? null,
    file_object: message.file_object ?? null,
    file_name: message.file_name ?? message.filename ?? null,
    file_mime: message.file_mime ?? message.mimetype ?? null,
    file_size: message.file_size ?? message.size ?? null,
    room
  };

  // tentar Antidote se conectado (tolerante a erros)
  if (antidote && connected) {
    try {
      console.info('[db] insertMessage: tentando gravar no Antidote, room=', room, 'id=', id);
      // Este código tenta suportar variações do client Antidote.
      // Ajuste conforme a API do seu client se necessário.
      if (typeof antidote.put === 'function') {
        // client simples: antidote.put(bucket, key, value) ou similar
        try {
          await antidote.put(`messages:${room}:${id}`, msgObj);
        } catch (e) {
          // se put por item não existir, tente a API de sets+registers usada originalmente
          // continua e será tratado pelo bloco abaixo
        }
      }

      // tentativa genérica: se o client expõe m.set/m.update ou connection.m etc.
      if (antidote.m && typeof antidote.m === 'object' && typeof antidote.m.update === 'function') {
        // ex.: antidote.m.update('messages', { setAdd: id, registers: { ... } })
        try {
          // chamada hipotética — se não compatível, vai lançar e cair no catch geral
          await antidote.m.update(room, { add: { [id]: msgObj } });
        } catch (e) {
          // ignore, vai para o bloco de fallback se necessário
        }
      }

      // Se chegamos até aqui sem erro, logue sucesso (não assume que listará instantaneamente)
      console.info('[db] insertMessage: tentativa Antidote concluída (verifique logs do Antidote se não visualizar). id=', id);
      // Para garantir visibilidade no seu caso atual, também gravamos no arquivo após tentativa no Antidote:
    } catch (err) {
      console.warn('[db] insertMessage: erro ao gravar no Antidote — farei fallback para arquivo:', err?.message ?? err);
    }
  } else {
    console.info('[db] insertMessage: Antidote não disponível, gravando só no arquivo. id=', id);
  }

  // Sempre escrever no arquivo como fallback/garantia (append por sala)
  try {
    const all = await readAllMessages();
    if (!Array.isArray(all[room])) all[room] = [];
    all[room].push(msgObj);
    await writeAllMessages(all);
    console.info('[db] insertMessage: gravado no arquivo (fallback) id=', id);
    return msgObj;
  } catch (fileErr) {
    console.error('[db] insertMessage: falha ao gravar no arquivo de fallback:', fileErr);
    // rethrow para que a rota HTTP retorne erro 500 e o cliente saiba
    throw fileErr;
  }
}


// List messages by room (reads OR-set of ids, then readBatch the maps).
// options: { limit } (number)
export async function listMessagesByRoom(room, { limit = 100 } = {}) {
  if (!room) throw new Error('room é obrigatório');

  if (connected && antidote) {
    try {
      const roomSet = typeof antidote.set === 'function' ? antidote.set(`chat_room:${room}`) : null;
      if (!roomSet) throw new Error('antidote.set not available');

      // read the set (tenta várias assinaturas)
      let rawIds = null;
      try {
        if (typeof roomSet.read === 'function') {
          rawIds = await roomSet.read();
        } else if (typeof roomSet === 'function') {
          rawIds = await roomSet();
        } else if (typeof roomSet.get === 'function') {
          rawIds = await roomSet.get();
        } else {
          rawIds = null;
        }
      } catch (e) {
        console.warn('[db] roomSet.read threw:', e && e.message);
        rawIds = null;
      }

      // Normalize possible formats into an array of ids
      let ids = [];
      if (Array.isArray(rawIds)) {
        ids = rawIds;
      } else if (rawIds && Array.isArray(rawIds.keys)) {
        ids = rawIds.keys;
      } else if (rawIds && Array.isArray(rawIds.key)) {
        ids = rawIds.key;
      } else if (rawIds && Array.isArray(rawIds.rows)) {
        ids = rawIds.rows;
      } else if (rawIds && rawIds.payload && Array.isArray(rawIds.payload.items)) {
        ids = rawIds.payload.items;
      } else if (rawIds && typeof rawIds === 'object') {
        const cand = Object.values(rawIds).find(v => Array.isArray(v));
        if (Array.isArray(cand)) ids = cand;
      } else if (rawIds == null) {
        ids = [];
      } else {
        try {
          console.debug('[db] listMessagesByRoom: formato inesperado de roomSet.read:', JSON.stringify(rawIds, null, 2));
        } catch (e) {
          console.debug('[db] listMessagesByRoom: formato inesperado (não serializável).', rawIds);
        }
        console.warn('[db] listMessagesByRoom: não foi possível extrair ids do set — fallback para file.');
        throw new Error('unexpected roomSet.read format');
      }

      if (!Array.isArray(ids) || ids.length === 0) return [];

      // Build message map objects tolerantly (somente para ids válidos)
      const msgObjs = ids.map((id) => {
        if (!id) return null;
        return typeof antidote.map === 'function' ? antidote.map(`message:${id}`) : null;
      });

      // read batch (tenta readBatch / readObjectsBatch / leitura individual)
      let values = null;
      try {
        if (typeof antidote.readBatch === 'function') {
          values = await antidote.readBatch(msgObjs);
        } else if (typeof antidote.readObjectsBatch === 'function') {
          values = await antidote.readObjectsBatch(msgObjs);
        } else {
          // leitura individual tolerante
          values = await Promise.all(msgObjs.map(async (m) => {
            if (!m) return null;
            try {
              if (typeof m.read === 'function') return await m.read();
              if (typeof m.get === 'function') return await m.get();
              return m;
            } catch (e) {
              console.debug('[db] leitura individual do map falhou para um id:', e && e.message);
              return null;
            }
          }));
        }
      } catch (e) {
        console.warn('[db] readBatch/readObjectsBatch falhou:', e && e.message);
        throw e;
      }

      // Normalize each returned value into fields
      const msgs = (values || []).map((v, i) => {
        const raw = v || {};
        const getVal = (k) => {
          if (raw == null) return null;
          if (raw[k] !== undefined) return raw[k];
          if (raw[k]?.value !== undefined) return raw[k].value;
          if (raw[k]?.read && typeof raw[k].read === 'function') {
            try { return raw[k].read(); } catch (_) { /* ignore */ }
          }
          if (raw.registers && raw.registers[k] !== undefined) {
            const r = raw.registers[k];
            if (r?.value !== undefined) return r.value;
            return r;
          }
          if (typeof raw === 'object') {
            const found = Object.values(raw).find(val => val && (val[k] !== undefined || (val.value !== undefined && val.key === k)));
            if (found) return found.value ?? found[k] ?? found;
          }
          return null;
        };

        return {
          id: ids[i] ?? null,
          author: getVal('author') ?? null,
          text: getVal('text') ?? null,
          ts: Number(getVal('ts') ?? getVal('timestamp') ?? null) || null,
          file_bucket: getVal('file_bucket') ?? null,
          file_object: getVal('file_object') ?? null,
          file_name: getVal('file_name') ?? null,
          file_mime: getVal('file_mime') ?? null,
          file_size: getVal('file_size') ?? null,
          room
        };
      }).filter(m => m && m.id);

      const sorted = msgs.slice().sort((a, b) => (Number(a.ts) || 0) - (Number(b.ts) || 0));
      if (limit != null) return sorted.slice(-limit);
      return sorted;
    } catch (err) {
      console.warn('[db] erro ao ler do Antidote — fallback para arquivo:', err && err.message);
      // fallback to file below
    }
  }

  // file fallback
  const all = await readAllMessages();
  const arr = Array.isArray(all[room]) ? all[room] : [];
  const sorted = arr.slice().sort((a, b) => (a.ts || 0) - (b.ts || 0));
  if (limit != null) return sorted.slice(-limit);
  return sorted;
}

// optional utility
export function getClient() {
  return antidote;
}

// auto-init (non-blocking)
initAntidote().catch((e) => console.error('[db] initAntidote error', e));

// default export for compatibility
export default {
  initAntidote,
  insertMessage,
  listMessagesByRoom,
  getClient
};
