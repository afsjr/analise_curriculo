const CURSOS = {
  enfermagem: {
    nome: "Téc. em Enfermagem",
    duracaoMeses: 27,
    totalParcelas: 28,
    parcelasPorModulo: 9,
    modulos: [
      {
        id: "mod1",
        tag: "Módulo I",
        tagClass: "",
        titulo: "Fundamentos",
        periodo: "Parcelas 1–10",
        totalCH: 410,
        disciplinas: [
          { id: "psicologia", nome: "Psicologia Aplicada", ch: 60, def: "cursar" },
          { id: "nutricao", nome: "Nutrição e Dietética", ch: 60, def: "complementar" },
          { id: "portugues", nome: "Português Instrumental", ch: 30, def: "cursar" },
          { id: "matematica", nome: "Matemática Instrumental", ch: 30, def: "cursar" },
          { id: "microbiologia", nome: "Microbiologia e Parasitologia", ch: 50, def: "dispensada" },
          { id: "higiene", nome: "Higiene e Profilaxia", ch: 50, def: "cursar" },
          { id: "etica", nome: "Ética Profissional", ch: 30, def: "dispensada" },
          { id: "anatomia", nome: "Anatomia e Fisiologia Humana", ch: 100, def: "cursar" }
        ]
      },
      {
        id: "mod2",
        tag: "Módulo II",
        tagClass: "ii",
        titulo: "Assistência Clínica",
        periodo: "Parcelas 11–19",
        totalCH: 440,
        disciplinas: [
          { id: "introducao", nome: "Introdução à Enfermagem", ch: 140, def: "complementar" },
          { id: "medica", nome: "Enfermagem Médica", ch: 120, def: "dispensada" },
          { id: "farmacologia", nome: "Noções de Farmacologia", ch: 40, def: "dispensada" },
          { id: "cirurgica", nome: "Enfermagem Cirúrgica", ch: 110, def: "dispensada" },
          { id: "adm", nome: "Noções de Adm. em Unidade de Enfermagem", ch: 30, def: "complementar" }
        ]
      },
      {
        id: "mod3",
        tag: "Módulo III",
        tagClass: "iii",
        titulo: "Especialidades",
        periodo: "Parcelas 20–28",
        totalCH: 350,
        disciplinas: [
          { id: "materno", nome: "Enf. Materno Infantil", ch: 130, def: "ementas" },
          { id: "pronto", nome: "Enf. em Pronto Socorro", ch: 60, def: "ementas" },
          { id: "neuro", nome: "Enf. Neuro Psiquiátrica", ch: 60, def: "dispensada" },
          { id: "saude", nome: "Enf. em Saúde Pública", ch: 100, def: "dispensada" }
        ]
      }
    ]
  }
};

const STATUS_LABELS = {
  cursar: "Cursará",
  complementar: "Complementar",
  dispensada: "Dispensada",
  ementas: "Ag. Ementas"
};

const STATUS_CORES = {
  cursar: "#dc2626",
  complementar: "#d97706",
  dispensada: "#16a34a",
  ementas: "#2563eb"
};

function getCurso(cursoId) {
  return CURSOS[cursoId] || null;
}

function getAllCursos() {
  return Object.keys(CURSOS);
}

function getDisciplinasDoCurso(cursoId) {
  const curso = getCurso(cursoId);
  if (!curso) return [];
  
  const disciplinas = [];
  curso.modulos.forEach(mod => {
    mod.disciplinas.forEach(d => {
      disciplinas.push({
        ...d,
        moduloId: mod.id,
        moduloTag: mod.tag,
        moduloTitulo: mod.titulo
      });
    });
  });
  return disciplinas;
}

function getTotalCH(cursoId) {
  const curso = getCurso(cursoId);
  if (!curso) return 0;
  
  return curso.modulos.reduce((total, mod) => total + mod.totalCH, 0);
}
