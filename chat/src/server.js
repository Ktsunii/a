// src/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

// db.js deve exportar: insertMessage, listMessagesByRoom (camada de persistência)
import { insertMessage, listMessagesByRoom } from "./db.js";
// antidote.js exporta initAntidote (inicialização do cliente Antidote)
import { initAntidote } from "./antidote.js";

initAntidote().catch(err => console.warn('Antidote não disponível no startup:', err?.message ?? err));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// middlewares base
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// estáticos: index.html e uploads
app.use(express.static(path.join(__dirname, "..", "public")));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// health
app.get("/health", (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// “banco” em memória por sala (mantemos como fallback local)
const rooms = new Map();
function getRoom(id) {
  if (!rooms.has(id)) rooms.set(id, []);
  return rooms.get(id);
}

// caminho para o arquivo local de fallback
const dataPath = path.resolve(__dirname, "..", "data", "messages.json");

// util: lê data/messages.json e retorna objeto/array (não lança, retorna null se erro)
async function readDataFile() {
  try {
    const raw = await fsp.readFile(dataPath, "utf8");
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn(`[readDataFile] não conseguiu ler ${dataPath}:`, err?.message ?? err);
    return null;
  }
}

// util: escreve o objeto para data/messages.json (cria pasta se necessário)
async function writeDataFile(obj) {
  try {
    await fsp.mkdir(path.dirname(dataPath), { recursive: true });
    await fsp.writeFile(dataPath, JSON.stringify(obj, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error(`[writeDataFile] erro ao escrever ${dataPath}:`, err);
    return false;
  }
}

// normaliza messages array e campos mínimos
function normalizeArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((m) => ({
    id: m.id ?? (m.ts ? `${m.ts}-${Math.random().toString(36).slice(2,6)}` : randomUUID()),
    author: m.author ?? m.autor ?? "desconhecido",
    text: m.text ?? m.message ?? "",
    type: m.type ?? (m.filename ? "file" : "text"),
    ts: m.ts ?? m.timestamp ?? Date.now(),
    filename: m.filename ?? m.file_name ?? m.fileName ?? null,
    mimetype: m.mimetype ?? m.file_mime ?? null,
    size: m.size ?? m.file_size ?? null,
    url: m.url ?? m.file_url ?? null,
    room: m.room ?? m.roomId ?? undefined
  })).sort((a, b) => (a.ts || 0) - (b.ts || 0));
}

// listar mensagens
app.get("/rooms/:id/messages", async (req, res) => {
  const id = req.params.id || "geral";
  try {
    // 1) tenta camada de persistência (Antidote via db.js)
    let list = [];
    try {
      const fromDb = await listMessagesByRoom(id);
      if (Array.isArray(fromDb) && fromDb.length > 0) {
        list = normalizeArray(fromDb);
        console.log(`[GET] /rooms/${id}/messages -> retornando ${list.length} itens (via db)`);
        return res.json(list);
      }
      // se veio array vazio, continuamos para fallback
    } catch (errDb) {
      console.warn(`[GET] listMessagesByRoom falhou para room=${id}:`, errDb?.message ?? errDb);
    }

    // 2) lê arquivo data/messages.json como fallback
    const parsed = await readDataFile();
    let arr = [];
    if (Array.isArray(parsed)) {
      arr = parsed;
    } else if (parsed && typeof parsed === "object") {
      arr = Array.isArray(parsed[id]) ? parsed[id] : [];
    } else {
      arr = getRoom(id);
    }

    const normalized = normalizeArray(arr);
    console.log(`[GET] /rooms/${id}/messages -> retornando ${normalized.length} itens (via file/memory)`);
    res.json(normalized);
  } catch (err) {
    console.error("GET /rooms/:id/messages error:", err);
    res.status(500).json({ error: String(err) });
  }
});

// enviar mensagem de texto
app.post("/rooms/:id/messages", async (req, res) => {
  const id = req.params.id || "geral";
  const { author, autor, text, texto } = req.body || {};
  const payload = {
    id: randomUUID(),
    author: (author ?? autor ?? "anon").toString(),
    text: (text ?? texto ?? "").toString(),
    type: "text",
    ts: Date.now(),
    room: id
  };
  if (!payload.text.trim()) {
    return res.status(400).json({ error: "text obrigatório" });
  }

  // 1) tenta persistir via camada (Antidote via db.js)
  try {
    const msg = await insertMessage(id, payload);
    console.log(`[POST] /rooms/${id}/messages -> salvo via db`);
    return res.status(201).json(msg ?? payload);
  } catch (err) {
    console.warn(`[POST] insertMessage falhou para room=${id}:`, err?.message ?? err);
  }

  // 2) fallback: grava em memória + atualiza data/messages.json
  try {
    const mem = getRoom(id);
    mem.push(payload);

    const parsed = await readDataFile();
    let toWrite;
    if (Array.isArray(parsed)) {
      toWrite = { [id]: parsed };
    } else if (parsed && typeof parsed === "object") {
      toWrite = { ...parsed };
      if (!Array.isArray(toWrite[id])) toWrite[id] = [];
      toWrite[id].push(payload);
    } else {
      toWrite = { [id]: [payload] };
    }

    const ok = await writeDataFile(toWrite);
    if (!ok) {
      console.error("[POST] fallback: não foi possível escrever data file");
      return res.status(500).json({ error: "persistência local falhou" });
    }

    console.log(`[POST] /rooms/${id}/messages -> salvo em fallback file (${dataPath})`);
    return res.status(201).json(payload);
  } catch (err) {
    console.error("POST /rooms/:id/messages fallback error:", err);
    return res.status(500).json({ error: String(err) });
  }
});

// upload de arquivo
const uploadsDir = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, Date.now() + "_" + safe);
  }
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } }); // 25 MB

app.post("/rooms/:id/upload", upload.single("file"), async (req, res) => {
  const id = req.params.id || "geral";
  const author = (req.body?.author ?? req.body?.autor ?? "anon").toString();

  if (!req.file) return res.status(400).send("arquivo ausente (campo 'file')");

  const url = `/uploads/${req.file.filename}`;
  const msg = {
    id: randomUUID(),
    room: id,
    author,
    type: "file",
    filename: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    url,
    ts: Date.now()
  };

  // tenta persistir via camada (Antidote via db.js)
  try {
    const saved = await insertMessage(id, msg);
    if (saved) {
      console.log(`[UPLOAD] /rooms/${id}/upload -> salvo via db`);
      return res.status(201).json(saved);
    }
  } catch (err) {
    console.warn(`[UPLOAD] insertMessage falhou para room=${id}:`, err?.message ?? err);
  }

  // fallback: grava em memória e atualiza data file
  try {
    const mem = getRoom(id);
    mem.push(msg);

    const parsed = await readDataFile();
    let toWrite;
    if (Array.isArray(parsed)) {
      toWrite = { [id]: parsed };
    } else if (parsed && typeof parsed === "object") {
      toWrite = { ...parsed };
      if (!Array.isArray(toWrite[id])) toWrite[id] = [];
      toWrite[id].push(msg);
    } else {
      toWrite = { [id]: [msg] };
    }

    const ok = await writeDataFile(toWrite);
    if (!ok) {
      console.error("[UPLOAD] fallback: não foi possível escrever data file");
      return res.status(500).json({ error: "persistência local falhou" });
    }

    console.log(`[UPLOAD] /rooms/${id}/upload -> salvo em fallback file (${dataPath})`);
    return res.status(201).json(msg);
  } catch (err) {
    console.error("POST /rooms/:id/upload fallback error:", err);
    return res.status(500).json({ error: String(err) });
  }
});

// iniciar somente se for entrypoint direto
const isDirectRun = import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun && !process.env.__SERVER_STARTED__) {
  process.env.__SERVER_STARTED__ = "1";

  async function start() {
    await initAntidote(); // inicializa Antidote (ou falhará para fallback)
    const PORT = Number(process.env.PORT || 4000);
    const server = app.listen(PORT, () => {
      console.log(`API on http://localhost:${PORT}`);
    });
    const shutdown = (sig) => () => {
      console.log(`${sig} recebido, fechando servidor...`);
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(1), 5000).unref();
    };
    process.on("SIGINT", shutdown("SIGINT"));
    process.on("SIGTERM", shutdown("SIGTERM"));
  }

  start().catch((err) => {
    console.error("Erro ao iniciar:", err);
    process.exit(1);
  });
}

// exporta app para testes (opcional)
export default app;
