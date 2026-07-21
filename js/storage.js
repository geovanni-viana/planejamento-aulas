/**
 * storage.js
 *
 * Duas fontes de dados:
 *
 * 1) AgendaLabStorage — LEITURA do que o Agenda Lab já guarda no localStorage
 *    (chave "lab_agendamentos_v1"). Como os dois apps ficam publicados no
 *    mesmo domínio do GitHub Pages (mesma origem, pastas diferentes), o
 *    localStorage é compartilhado — não precisa de servidor nem cópia de
 *    dados. Este app NUNCA escreve nessa chave, só lê.
 *
 * 2) PlanosStorage — os planos de aula propriamente ditos, numa chave própria
 *    ("lab_planos_v1"), com a mesma interface assíncrona (pronta para trocar
 *    por Firebase no futuro, se um dia precisar).
 */

const AGENDAMENTOS_KEY = "lab_agendamentos_v1"; // mesma chave do Agenda Lab — não alterar
const PLANOS_KEY = "lab_planos_v1";

function _ler(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error(`Erro ao ler ${key}:`, err);
    return [];
  }
}

function _salvar(key, lista) {
  try {
    localStorage.setItem(key, JSON.stringify(lista));
    return true;
  } catch (err) {
    console.error(`Erro ao salvar ${key}:`, err);
    return false;
  }
}

function _gerarId(prefixo) {
  return `${prefixo}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ---------- Leitura do Agenda Lab ----------

const AgendaLabStorage = {
  /** Todos os agendamentos avulsos cadastrados no Agenda Lab. */
  async getAll() {
    return _ler(AGENDAMENTOS_KEY);
  },

  /**
   * Monta a lista de "aulas do dia" (fixas + avulsas) para uma data ISO,
   * na mesma lógica do painel do Agenda Lab.
   */
  async aulasDoDia(isoDate) {
    const diaSemana = _diaSemanaDeData(isoDate);
    const avulsos = await this.getAll();

    return CONFIG.periodos
      .map((periodo) => {
        const fixo = (CONFIG.horarioFixo || []).find(
          (f) => f.dia === diaSemana && f.periodoId === periodo.id && fixoAtivoNaData(f, isoDate)
        );
        if (fixo) {
          return {
            tipo: "fixo",
            periodoId: periodo.id,
            professor: fixo.professor || "",
            disciplina: fixo.disciplina || "",
            turma: fixo.turma || "",
            ehPesquisa: !fixo.professor,
          };
        }
        const avulso = avulsos.find((a) => a.data === isoDate && a.periodoId === periodo.id);
        if (avulso) {
          return {
            tipo: "avulso",
            periodoId: periodo.id,
            agendamentoId: avulso.id,
            professor: avulso.professor,
            disciplina: avulso.disciplina,
            turma: avulso.turma || "",
          };
        }
        return { tipo: "livre", periodoId: periodo.id };
      })
      .filter((slot) => slot.tipo !== "livre" && !slot.ehPesquisa);
  },
};

function _diaSemanaDeData(isoDate) {
  const d = new Date(`${isoDate}T00:00:00`);
  const js = d.getDay();
  return js === 0 ? 7 : js;
}

// ---------- Planos de aula ----------

const PlanosStorage = {
  async getAll() {
    return _ler(PLANOS_KEY);
  },

  async get(id) {
    return _ler(PLANOS_KEY).find((p) => p.id === id) || null;
  },

  async add(dados) {
    const lista = _ler(PLANOS_KEY);
    const registro = {
      id: _gerarId("pl"),
      status: dados.vinculo ? "vinculado" : "rascunho",
      criadoEm: new Date().toISOString(),
      ...dados,
    };
    lista.push(registro);
    _salvar(PLANOS_KEY, lista);
    return registro;
  },

  async update(id, dados) {
    const lista = _ler(PLANOS_KEY);
    const idx = lista.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    lista[idx] = {
      ...lista[idx],
      ...dados,
      status: dados.vinculo !== undefined ? (dados.vinculo ? "vinculado" : "rascunho") : lista[idx].status,
      atualizadoEm: new Date().toISOString(),
    };
    _salvar(PLANOS_KEY, lista);
    return lista[idx];
  },

  async remove(id) {
    const lista = _ler(PLANOS_KEY);
    const nova = lista.filter((p) => p.id !== id);
    _salvar(PLANOS_KEY, nova);
    return nova.length !== lista.length;
  },

  async duplicar(id) {
    const original = await this.get(id);
    if (!original) return null;
    const { id: _old, criadoEm, atualizadoEm, ...resto } = original;
    return this.add({
      ...resto,
      titulo: `${original.titulo} (cópia)`,
      vinculo: null,
    });
  },
};
