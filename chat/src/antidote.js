// src/antidote.js
// Adaptador robusto para antidote_ts_client (compatível CommonJS/ESM e variações de API)
import { ANTIDOTE_HOST, ANTIDOTE_PORT } from './db.js';

let client = null;

/**
 * Tenta carregar antidote_ts_client de forma compatível com CommonJS/ESM.
 * Retorna o módulo carregado (default ou named).
 */
async function loadAntidoteModule() {
  try {
    const mod = await import('antidote_ts_client');
    return mod.default ?? mod;
  } catch (e) {
    throw new Error(`não foi possível importar antidote_ts_client: ${e && e.message}`);
  }
}

/**
 * Inicializa e retorna o client Antidote.
 * Tenta várias formas de API:
 *  - módulo.connect(port, host)
 *  - classe AntidoteClient / Antidote (instanciada)
 *  - módulo já sendo um client (heurística)
 */
export async function initAntidote() {
  if (client) return client;

  try {
    const m = await loadAntidoteModule();

    // 1) função connect(port, host)
    if (typeof m.connect === 'function') {
      const maybe = m.connect(Number(ANTIDOTE_PORT), ANTIDOTE_HOST);
      client = (maybe instanceof Promise) ? await maybe : maybe;
      console.info('[antidote] conectado via m.connect');
      return client;
    }

    // 2) classe exportada (AntidoteClient, Antidote)
    const C = m.AntidoteClient ?? m.Antidote ?? m.AntidoteClientImpl;
    if (typeof C === 'function') {
      try {
        client = new C({ host: ANTIDOTE_HOST, port: Number(ANTIDOTE_PORT) });
        console.info('[antidote] conectado via new AntidoteClient({host,port})');
        return client;
      } catch (e) {
        client = new C();
        console.info('[antidote] conectado via new AntidoteClient() (fallback)');
        return client;
      }
    }

    // 3) módulo já é um cliente (heurística: checar métodos comuns)
    if (m && (typeof m.read === 'function' || typeof m.set === 'function' || typeof m.map === 'function')) {
      client = m;
      console.info('[antidote] usando módulo exportado diretamente como client');
      return client;
    }

    throw new Error('antidote_ts_client carregado, mas formato desconhecido');
  } catch (err) {
    console.warn('[antidote] init falhou:', err && err.message);
    client = null;
    throw err;
  }
}

/**
 * Retorna o client (ou null se não inicializado).
 */
export function getClient() {
  return client;
}

export default {
  initAntidote,
  getClient
};
