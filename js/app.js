/**
 * app.js — Planejamento de Aulas
 */

const state = {
  planos: [],
  editandoId: null,
  filtroStatus: "todas", // todas | vinculado | rascunho
  busca: "",
  vinculoSelecionado: null, // { data, periodoId, professor, disciplina, turma, tipo, agendamentoId? }
};

// ---------- Helpers ----------

function toISODate(date) {
  const d = new Date(date);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

function formatarDataBR(isoDate) {
  const [ano, mes, dia] = isoDate.split("-");
  return `${dia}/${mes}/${ano}`;
}

function formatarDataCurta(isoDate) {
  const d = new Date(`${isoDate}T00:00:00`);
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function labelPeriodo(periodoId) {
  const p = CONFIG.periodos.find((x) => x.id === periodoId);
  return p ? `${p.label} · ${p.inicio}–${p.fim}` : periodoId;
}

function turnoDoPeriodo(periodoId) {
  const p = CONFIG.periodos.find((x) => x.id === periodoId);
  return p ? p.turno : "manha";
}

// ---------- DOM ----------

const el = {
  form: document.getElementById("form-plano"),
  titulo: document.getElementById("input-titulo"),
  disciplina: document.getElementById("input-disciplina"),
  turma: document.getElementById("input-turma"),
  bncc: document.getElementById("input-bncc"),
  objetivos: document.getElementById("input-objetivos"),
  conteudo: document.getElementById("input-conteudo"),
  metodologia: document.getElementById("input-metodologia"),
  recursos: document.getElementById("input-recursos"),
  avaliacao: document.getElementById("input-avaliacao"),
  observacoes: document.getElementById("input-observacoes"),
  btnSubmit: document.getElementById("btn-submit"),
  btnCancelarEdicao: document.getElementById("btn-cancelar-edicao"),
  formTituloSecao: document.getElementById("form-titulo-secao"),
  formErro: document.getElementById("form-erro"),

  vinculoVazio: document.getElementById("vinculo-vazio"),
  vinculoAtivo: document.getElementById("vinculo-ativo"),
  vinculoChip: document.getElementById("vinculo-chip"),
  btnAbrirVinculo: document.getElementById("btn-abrir-vinculo"),
  btnRemoverVinculo: document.getElementById("btn-remover-vinculo"),
  vinculoPicker: document.getElementById("vinculo-picker"),
  vinculoData: document.getElementById("vinculo-data"),
  vinculoSlots: document.getElementById("vinculo-slots"),
  btnFecharVinculo: document.getElementById("btn-fechar-vinculo"),

  buscaInput: document.getElementById("input-busca"),
  filtros: document.getElementById("catalogo-filtros"),
  gradeFichas: document.getElementById("grade-fichas"),
  estadoVazio: document.getElementById("estado-vazio"),

  statTotal: document.getElementById("stat-total"),
  statVinculados: document.getElementById("stat-vinculados"),
  statRascunhos: document.getElementById("stat-rascunhos"),

  toast: document.getElementById("toast"),
  btnTema: document.getElementById("btn-tema"),
};

// ---------- Tema ----------

function aplicarTema(tema) {
  if (tema === "claro") {
    document.documentElement.setAttribute("data-tema", "claro");
    el.btnTema.querySelector(".btn-tema__icone").textContent = "☀";
  } else {
    document.documentElement.removeAttribute("data-tema");
    el.btnTema.querySelector(".btn-tema__icone").textContent = "☾";
  }
  try {
    localStorage.setItem("lab_tema", tema);
  } catch (err) {
    console.warn("Não foi possível salvar a preferência de tema:", err);
  }
}

function initTema() {
  const salvo = document.documentElement.getAttribute("data-tema") === "claro" ? "claro" : "escuro";
  aplicarTema(salvo);
  el.btnTema.addEventListener("click", () => {
    const atual = document.documentElement.getAttribute("data-tema") === "claro" ? "claro" : "escuro";
    aplicarTema(atual === "claro" ? "escuro" : "claro");
  });
}

// ---------- Inicialização ----------

async function init() {
  initTema();
  el.vinculoData.value = toISODate(new Date());

  state.planos = await PlanosStorage.getAll();
  renderCatalogo();

  el.form.addEventListener("submit", onSubmitForm);
  el.btnCancelarEdicao.addEventListener("click", cancelarEdicao);

  el.btnAbrirVinculo.addEventListener("click", () => abrirVinculoPicker());
  el.btnFecharVinculo.addEventListener("click", () => (el.vinculoPicker.hidden = true));
  el.btnRemoverVinculo.addEventListener("click", removerVinculo);
  el.vinculoData.addEventListener("change", renderVinculoSlots);

  el.buscaInput.addEventListener("input", (e) => {
    state.busca = e.target.value.trim().toLowerCase();
    renderCatalogo();
  });

  el.filtros.addEventListener("click", (e) => {
    const btn = e.target.closest(".filtro-chip");
    if (!btn) return;
    state.filtroStatus = btn.dataset.filtro;
    el.filtros.querySelectorAll(".filtro-chip").forEach((b) => b.classList.toggle("is-ativo", b === btn));
    renderCatalogo();
  });
}

// ---------- Vínculo com o Agenda Lab ----------

function abrirVinculoPicker() {
  el.vinculoPicker.hidden = false;
  renderVinculoSlots();
}

async function renderVinculoSlots() {
  const data = el.vinculoData.value;
  if (!data) return;
  const slots = await AgendaLabStorage.aulasDoDia(data);

  if (!slots.length) {
    el.vinculoSlots.innerHTML = `<p class="vinculo-slots__vazio">Nenhuma aula cadastrada no Agenda Lab para esta data.</p>`;
    return;
  }

  el.vinculoSlots.innerHTML = slots
    .map((slot, i) => {
      return `<button type="button" class="vinculo-slot" data-i="${i}" data-turno="${turnoDoPeriodo(slot.periodoId)}">
        <span class="vinculo-slot__periodo">${labelPeriodo(slot.periodoId)}</span>
        <span class="vinculo-slot__info"><strong>${escapeHtml(slot.disciplina)}</strong> · ${escapeHtml(slot.professor)}${slot.turma ? " · Turma " + escapeHtml(slot.turma) : ""}</span>
      </button>`;
    })
    .join("");

  el.vinculoSlots.querySelectorAll(".vinculo-slot").forEach((btn) => {
    btn.addEventListener("click", () => {
      const slot = slots[Number(btn.dataset.i)];
      selecionarVinculo(data, slot);
    });
  });
}

function selecionarVinculo(data, slot) {
  state.vinculoSelecionado = {
    data,
    periodoId: slot.periodoId,
    tipo: slot.tipo,
    agendamentoId: slot.agendamentoId || null,
    professor: slot.professor,
    disciplina: slot.disciplina,
    turma: slot.turma || "",
  };

  // Preenche automaticamente disciplina/turma se ainda vazios
  if (!el.disciplina.value) el.disciplina.value = slot.disciplina;
  if (!el.turma.value) el.turma.value = slot.turma || "";

  el.vinculoPicker.hidden = true;
  renderVinculoAtivo();
}

function removerVinculo() {
  state.vinculoSelecionado = null;
  renderVinculoAtivo();
}

function renderVinculoAtivo() {
  const v = state.vinculoSelecionado;
  if (!v) {
    el.vinculoVazio.hidden = false;
    el.vinculoAtivo.hidden = true;
    return;
  }
  el.vinculoVazio.hidden = true;
  el.vinculoAtivo.hidden = false;
  el.vinculoChip.dataset.turno = turnoDoPeriodo(v.periodoId);
  el.vinculoChip.innerHTML = `
    <strong>${formatarDataCurta(v.data)}</strong>
    <span>${labelPeriodo(v.periodoId)}</span>
    <span>${escapeHtml(v.professor)}${v.turma ? " · Turma " + escapeHtml(v.turma) : ""}</span>
  `;
}

// ---------- Formulário ----------

async function onSubmitForm(e) {
  e.preventDefault();
  esconderErroForm();

  const dados = {
    titulo: el.titulo.value.trim(),
    disciplina: el.disciplina.value.trim(),
    turma: el.turma.value.trim(),
    bncc: el.bncc.value.trim(),
    objetivos: el.objetivos.value.trim(),
    conteudo: el.conteudo.value.trim(),
    metodologia: el.metodologia.value.trim(),
    recursos: el.recursos.value.trim(),
    avaliacao: el.avaliacao.value.trim(),
    observacoes: el.observacoes.value.trim(),
    vinculo: state.vinculoSelecionado,
  };

  if (!dados.titulo || !dados.disciplina) {
    mostrarErroForm("Preencha ao menos o tema da aula e a disciplina.");
    return;
  }

  if (state.editandoId) {
    await PlanosStorage.update(state.editandoId, dados);
    mostrarToast("Ficha atualizada.");
  } else {
    await PlanosStorage.add(dados);
    mostrarToast("Ficha salva.");
  }

  state.planos = await PlanosStorage.getAll();
  cancelarEdicao();
  renderCatalogo();
}

function iniciarEdicao(id) {
  const item = state.planos.find((p) => p.id === id);
  if (!item) return;

  state.editandoId = id;
  el.titulo.value = item.titulo;
  el.disciplina.value = item.disciplina;
  el.turma.value = item.turma || "";
  el.bncc.value = item.bncc || "";
  el.objetivos.value = item.objetivos || "";
  el.conteudo.value = item.conteudo || "";
  el.metodologia.value = item.metodologia || "";
  el.recursos.value = item.recursos || "";
  el.avaliacao.value = item.avaliacao || "";
  el.observacoes.value = item.observacoes || "";
  state.vinculoSelecionado = item.vinculo || null;
  renderVinculoAtivo();

  el.formTituloSecao.textContent = "Editar ficha";
  el.btnSubmit.textContent = "Salvar alterações";
  el.btnCancelarEdicao.hidden = false;
  el.form.scrollIntoView({ behavior: "smooth", block: "start" });
  el.titulo.focus();
}

function cancelarEdicao() {
  state.editandoId = null;
  state.vinculoSelecionado = null;
  el.form.reset();
  renderVinculoAtivo();
  el.formTituloSecao.textContent = "Nova ficha";
  el.btnSubmit.textContent = "Salvar ficha";
  el.btnCancelarEdicao.hidden = true;
  esconderErroForm();
}

async function excluirFicha(id) {
  const item = state.planos.find((p) => p.id === id);
  if (!item) return;
  const ok = confirm(`Excluir a ficha "${item.titulo}"?`);
  if (!ok) return;

  await PlanosStorage.remove(id);
  state.planos = await PlanosStorage.getAll();
  if (state.editandoId === id) cancelarEdicao();
  renderCatalogo();
  mostrarToast("Ficha excluída.");
}

async function duplicarFicha(id) {
  await PlanosStorage.duplicar(id);
  state.planos = await PlanosStorage.getAll();
  renderCatalogo();
  mostrarToast("Ficha duplicada.");
}

function mostrarErroForm(msg) {
  el.formErro.textContent = msg;
  el.formErro.hidden = false;
}
function esconderErroForm() {
  el.formErro.hidden = true;
  el.formErro.textContent = "";
}

// ---------- Catálogo ----------

function renderCatalogo() {
  let itens = [...state.planos];

  if (state.filtroStatus !== "todas") {
    itens = itens.filter((p) => p.status === state.filtroStatus);
  }
  if (state.busca) {
    itens = itens.filter((p) =>
      [p.titulo, p.disciplina, p.turma, p.vinculo?.professor]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(state.busca)
    );
  }

  itens.sort((a, b) => {
    const da = a.vinculo?.data || "9999-99-99";
    const db = b.vinculo?.data || "9999-99-99";
    if (da !== db) return da.localeCompare(db);
    return (b.criadoEm || "").localeCompare(a.criadoEm || "");
  });

  el.statTotal.textContent = state.planos.length;
  el.statVinculados.textContent = state.planos.filter((p) => p.status === "vinculado").length;
  el.statRascunhos.textContent = state.planos.filter((p) => p.status === "rascunho").length;

  el.estadoVazio.hidden = itens.length !== 0;
  el.gradeFichas.innerHTML = itens.map(renderCard).join("");

  el.gradeFichas.querySelectorAll('[data-acao="editar"]').forEach((btn) =>
    btn.addEventListener("click", () => iniciarEdicao(btn.dataset.id))
  );
  el.gradeFichas.querySelectorAll('[data-acao="duplicar"]').forEach((btn) =>
    btn.addEventListener("click", () => duplicarFicha(btn.dataset.id))
  );
  el.gradeFichas.querySelectorAll('[data-acao="excluir"]').forEach((btn) =>
    btn.addEventListener("click", () => excluirFicha(btn.dataset.id))
  );
}

function renderCard(item) {
  const turno = item.vinculo ? turnoDoPeriodo(item.vinculo.periodoId) : "rascunho";
  const dataInfo = item.vinculo
    ? `${formatarDataCurta(item.vinculo.data)} · ${labelPeriodo(item.vinculo.periodoId)}`
    : "Sem data — rascunho";

  return `<article class="ficha" data-turno="${turno}">
    <div class="ficha__aba">
      <span class="ficha__status">${item.status === "vinculado" ? "Vinculada" : "Rascunho"}</span>
      <span class="ficha__data">${dataInfo}</span>
    </div>
    <div class="ficha__corpo">
      <h3>${escapeHtml(item.titulo)}</h3>
      <p class="ficha__meta">${escapeHtml(item.disciplina)}${item.turma ? " · Turma " + escapeHtml(item.turma) : ""}${item.bncc ? " · " + escapeHtml(item.bncc) : ""}</p>
      ${item.objetivos ? `<p class="ficha__trecho"><strong>Objetivos:</strong> ${escapeHtml(item.objetivos)}</p>` : ""}
      ${item.vinculo?.professor ? `<p class="ficha__trecho"><strong>Professor(a):</strong> ${escapeHtml(item.vinculo.professor)}</p>` : ""}
    </div>
    <div class="ficha__acoes">
      <button type="button" class="btn-icon" data-acao="editar" data-id="${item.id}" aria-label="Editar">✎</button>
      <button type="button" class="btn-icon" data-acao="duplicar" data-id="${item.id}" aria-label="Duplicar">⧉</button>
      <button type="button" class="btn-icon btn-icon--perigo" data-acao="excluir" data-id="${item.id}" aria-label="Excluir">✕</button>
    </div>
  </article>`;
}

// ---------- Toast ----------

let toastTimeout;
function mostrarToast(msg) {
  el.toast.textContent = msg;
  el.toast.classList.add("toast--visivel");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => el.toast.classList.remove("toast--visivel"), 3000);
}

document.addEventListener("DOMContentLoaded", init);

// ---------- PWA ----------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((err) => {
      console.warn("Falha ao registrar service worker:", err);
    });
  });
}
