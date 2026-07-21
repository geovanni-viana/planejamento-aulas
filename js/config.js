/**
 * config.js
 * IMPORTANTE: este arquivo é uma cópia do config.js do Agenda Lab
 * (mesma grade fixa, mesmos períodos e dias). Se você editar os horários
 * no Agenda Lab, replique a mudança aqui também — os dois apps precisam
 * enxergar a mesma grade para os planos ficarem vinculados corretamente.
 */

const CONFIG = {
  labNome: "Laboratório de Informática Magnante",

  semanaReferenciaA: "2026-08-03",

  dias: [
    { id: 1, sigla: "SEG", nome: "Segunda-feira" },
    { id: 2, sigla: "TER", nome: "Terça-feira" },
    { id: 3, sigla: "QUA", nome: "Quarta-feira" },
    { id: 4, sigla: "QUI", nome: "Quinta-feira" },
    { id: 5, sigla: "SEX", nome: "Sexta-feira" },
    { id: 6, sigla: "SAB", nome: "Sábado" },
  ],

  periodos: [
    { id: "m1", turno: "manha", label: "1ª aula", inicio: "08:05", fim: "08:50" },
    { id: "m2", turno: "manha", label: "2ª aula", inicio: "08:55", fim: "09:40" },
    { id: "m3", turno: "manha", label: "3ª aula", inicio: "10:05", fim: "10:50" },
    { id: "m4", turno: "manha", label: "4ª aula", inicio: "11:10", fim: "11:55" },
    { id: "t1", turno: "tarde", label: "5ª aula", inicio: "13:30", fim: "14:30" },
    { id: "t2", turno: "tarde", label: "6ª aula", inicio: "14:35", fim: "15:35" },
    { id: "t3", turno: "tarde", label: "7ª aula", inicio: "16:00", fim: "17:15" },
  ],

  turnos: {
    manha: { label: "Manhã", cor: "var(--accent-amber)" },
    tarde: { label: "Tarde", cor: "var(--accent-teal)" },
  },

  horarioFixo: [
    { dia: 1, periodoId: "m1", professor: "Paula", turma: "53", disciplina: "Informática", periodicidade: "quinzenal", semana: "A" },
    { dia: 1, periodoId: "m2", professor: "Denise", turma: "21", disciplina: "Informática", periodicidade: "quinzenal", semana: "A" },
    { dia: 1, periodoId: "m3", professor: "", turma: "", disciplina: "Pesquisa" },
    { dia: 1, periodoId: "m4", professor: "Adriane", turma: "12", disciplina: "Informática", periodicidade: "quinzenal", semana: "A" },

    { dia: 2, periodoId: "m1", professor: "Lidiane", turma: "41", disciplina: "Informática", periodicidade: "quinzenal", semana: "A" },
    { dia: 2, periodoId: "m2", professor: "Bruna", turma: "22", disciplina: "Informática", periodicidade: "quinzenal", semana: "A" },
    { dia: 2, periodoId: "m3", professor: "", turma: "", disciplina: "Pesquisa" },
    { dia: 2, periodoId: "m4", professor: "Claudete", turma: "43", disciplina: "Informática", periodicidade: "quinzenal", semana: "A" },
    { dia: 2, periodoId: "t3", professor: "Alice", turma: "55", disciplina: "Informática" },

    { dia: 3, periodoId: "m1", professor: "Graziela", turma: "42", disciplina: "Informática", periodicidade: "quinzenal", semana: "A" },
    { dia: 3, periodoId: "m2", professor: "Lúcia", turma: "32", disciplina: "Informática", periodicidade: "quinzenal", semana: "A" },
    { dia: 3, periodoId: "m3", professor: "Eliane", turma: "33", disciplina: "Informática", periodicidade: "quinzenal", semana: "A" },
    { dia: 3, periodoId: "m4", professor: "Luciana", turma: "31", disciplina: "Informática", periodicidade: "quinzenal", semana: "A" },

    { dia: 4, periodoId: "m1", professor: "Bruna", turma: "52", disciplina: "Informática", periodicidade: "quinzenal", semana: "A" },
    { dia: 4, periodoId: "m2", professor: "Bibiana", turma: "51", disciplina: "Informática", periodicidade: "quinzenal", semana: "A" },
    { dia: 4, periodoId: "m3", professor: "", turma: "", disciplina: "Pesquisa" },
    { dia: 4, periodoId: "m4", professor: "Adriane Lessa", turma: "11", disciplina: "Informática", periodicidade: "quinzenal", semana: "A" },

    { dia: 5, periodoId: "m1", professor: "", turma: "", disciplina: "Pesquisa" },
    { dia: 5, periodoId: "m2", professor: "", turma: "", disciplina: "Pesquisa" },
    { dia: 5, periodoId: "m3", professor: "", turma: "", disciplina: "Pesquisa" },
    { dia: 5, periodoId: "m4", professor: "", turma: "", disciplina: "Pesquisa" },
    { dia: 5, periodoId: "t3", professor: "Gisele", turma: "54", disciplina: "Informática" },
  ],
};

function _segundaFeiraDe(isoDate) {
  const d = new Date(`${isoDate}T00:00:00`);
  const dia = d.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  d.setDate(d.getDate() + diff);
  return d;
}

function ehSemanaA(isoDate) {
  const ref = _segundaFeiraDe(CONFIG.semanaReferenciaA);
  const alvo = _segundaFeiraDe(isoDate);
  const diffSemanas = Math.round((alvo - ref) / (7 * 86400000));
  return ((diffSemanas % 2) + 2) % 2 === 0;
}

function fixoAtivoNaData(fixo, isoDate) {
  if (fixo.periodicidade !== "quinzenal") return true;
  const naSemanaA = ehSemanaA(isoDate);
  return fixo.semana === "B" ? !naSemanaA : naSemanaA;
}
