let cursoAtual = "enfermagem";
let estado = {};
let obsState = {};
let disciplinasImportadas = [];
let matchingResults = [];
let history = [];
let uploadTabAtual = "imagem";

const STORAGE_KEY = "csm_tec_history";

function init() {
  console.log("Inicializando...");
  try {
    loadHistory();
    renderCourseSelector(cursoAtual);
    resetEstado();
    renderGrade(CURSOS[cursoAtual], estado, obsState);
    setupUploadArea();
    setupFileInputs();
    setupManualInput();
    console.log("Inicialização concluída com sucesso");
    console.log("estado inicial:", estado);
  } catch (e) {
    console.error("Erro na inicialização:", e);
  }
}

function loadHistory() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      history = JSON.parse(saved);
      renderHistory(history);
    }
  } catch (e) {
    console.error("Erro ao carregar histórico:", e);
  }
}

function saveHistory() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    console.error("Erro ao salvar histórico:", e);
  }
}

function selecionarCurso(key, btn) {
  cursoAtual = key;
  document.querySelectorAll(".course-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  resetEstado();
  matchingResults = [];
  renderGrade(CURSOS[cursoAtual], estado, obsState);
  document.getElementById("results").style.display = "none";
}

function resetEstado() {
  estado = {};
  obsState = {};
  const curso = CURSOS[cursoAtual];
  curso.modulos.forEach(mod => {
    mod.disciplinas.forEach(d => {
      estado[d.id] = d.def;
      obsState[d.id] = "";
    });
  });
}

function setStatus(discId, status, modId) {
  estado[discId] = status;
  renderGrade(CURSOS[cursoAtual], estado, obsState);
}

function validar(curso) {
  const ementas = [];
  curso.modulos.forEach(mod => {
    mod.disciplinas.forEach(d => {
      if (estado[d.id] === "ementas") ementas.push(d.nome);
    });
  });
  
  const banner = document.getElementById("val-banner");
  const list = document.getElementById("val-list");
  if (ementas.length > 0) {
    list.innerHTML = ementas.map(n => `<li>${n} — aguardando ementas: tratada como complementar (1/3) no cálculo</li>`).join("");
    banner.classList.add("show");
  } else {
    banner.classList.remove("show");
  }
  return true;
}

function calcular() {
  const curso = CURSOS[cursoAtual];
  validar(curso);
  
  const valorMensalidade = parseFloat(document.getElementById("mensalidade").value) || 370;
  const valorMatricula = parseFloat(document.getElementById("val_matricula").value) || 370;
  const nome = document.getElementById("nome").value.trim();
  const matricula = document.getElementById("matricula").value.trim();
  const origem = document.getElementById("origem").value.trim();
  
  const resultado = calcularTotalCurso(curso, estado, valorMatricula, valorMensalidade);
  
  const dadosAluno = {
    nome,
    matricula,
    origem,
    curso: curso.nome,
    valorMatricula,
    valorMensalidade
  };
  
  renderResults(resultado, dadosAluno);
  
  salvarHistorico({
    nome,
    matricula,
    origem,
    curso: curso.nome,
    totalGeral: resultado.totalGeral,
    parcelasGeral: resultado.parcelasGeral,
    economia: resultado.economia,
    valorMatricula,
    valorMensalidade,
    estadoSnap: { ...estado },
    obsSnap: { ...obsState }
  });
}

function salvarHistorico(entry) {
  entry.ts = new Date().toLocaleString("pt-BR");
  entry.id = Date.now();
  history.unshift(entry);
  
  if (history.length > 50) {
    history = history.slice(0, 50);
  }
  
  saveHistory();
  renderHistory(history);
}

function recarregarAtendimento(id) {
  const e = history.find(h => h.id === id);
  if (!e) return;
  
  document.getElementById("nome").value = e.nome || "";
  document.getElementById("matricula").value = e.matricula || "";
  document.getElementById("origem").value = e.origem || "";
  document.getElementById("mensalidade").value = e.valorMensalidade || 370;
  document.getElementById("val_matricula").value = e.valorMatricula || 370;
  
  estado = { ...e.estadoSnap };
  obsState = { ...e.obsSnap };
  
  renderGrade(CURSOS[cursoAtual], estado, obsState);
  calcular();
  switchTab("calc", document.querySelector(".tab-btn"));
}

function removerHistorico(id) {
  history = history.filter(h => h.id !== id);
  saveHistory();
  renderHistory(history);
}

function setupFileInputs() {
}

async function handleFileUpload(file, tipo) {
  if (!file) return;
  
  // Buscar elementos dentro da aba ativa
  const uploadContent = document.getElementById("upload-" + tipo);
  const loadingEl = uploadContent ? uploadContent.querySelector(".ocr-loading") : null;
  const statusEl = uploadContent ? uploadContent.querySelector(".ocr-status") : null;
  const previewEl = uploadContent ? uploadContent.querySelector(".upload-preview") : null;
  
  const tamanhoMB = file.size / (1024 * 1024);
  const tempoEstimado = estimateTime(tipo, tamanhoMB);
  
  if (loadingEl) loadingEl.style.display = "block";
  if (statusEl) {
    statusEl.className = "ocr-status";
    statusEl.innerHTML = `
      <div class="ocr-loading">
        <div class="spinner"></div>
      </div>
      <div style="margin-bottom:8px;font-weight:600;">Processando arquivo...</div>
      <div class="time-estimate">Tempo estimado: ${tempoEstimado}</div>
      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill animated" style="width:5%"></div>
        </div>
      </div>
      <div class="ocr-phase">
        <span class="phase-dot processing"></span>
        <span>Inicializando...</span>
      </div>
    `;
  }
  if (previewEl) previewEl.innerHTML = "";
  
  try {
    const disciplinas = await processarArquivo(file, tipo, (progressData) => {
      if (statusEl) {
        const progressFill = statusEl.querySelector(".progress-fill");
        const phaseSpan = statusEl.querySelector(".ocr-phase span:last-child");
        
        if (progressFill) {
          progressFill.style.width = `${progressData.percent}%`;
          if (progressData.percent > 20) {
            progressFill.classList.remove("animated");
          }
        }
        if (phaseSpan) {
          phaseSpan.textContent = progressData.phase;
        }
      }
    });
    
    disciplinasImportadas = disciplinas;
    
    if (disciplinas.length === 0) {
      throw new Error("não_conseguiu: Nenhuma disciplina encontrada no arquivo. O documento pode não conter disciplinas no formato esperado. Tente usar a digitação manual.");
    }
    
    const curso = CURSOS[cursoAtual];
    matchingResults = matchingDisciplinas(disciplinas, curso);
    
    aplicarMatchingAoEstadoUI(matchingResults);
    
    if (statusEl) {
      statusEl.className = "ocr-status success";
      statusEl.style.display = "block";
      statusEl.innerHTML = `
        <div style="font-weight:600;margin-bottom:4px;">✓ Sucesso!</div>
        <div>${disciplinas.length} disciplinas encontradas e processadas.</div>
        <div style="font-size:12px;margin-top:4px;">Revise o matching abaixo e clique em "Aplicar ao Curso".</div>
      `;
    }
    
    renderImportedDisciplinas(disciplinasImportadas);
    renderMatchingResult(matchingResults);
    
    const dadosAluno = {
      nome: document.getElementById("nome").value.trim(),
      matricula: document.getElementById("matricula").value.trim(),
      origem: document.getElementById("origem").value.trim()
    };
    renderResumoAnalise(matchingResults, dadosAluno);
    
    const applyBtn = document.getElementById("btn-aplicar-matching");
    if (applyBtn) applyBtn.style.display = "inline-flex";
    
  } catch (error) {
    if (loadingEl) loadingEl.style.display = "none";
    
    if (isCapableError(error)) {
      let titulo = "O sistema não conseguiu processar o documento";
      let mensagem = error.message;
      
      if (error.message.startsWith("timeout:")) {
        titulo = "Tempo limite excedido";
        mensagem = error.message.replace("timeout: ", "");
      } else {
        mensagem = error.message.replace("não_conseguiu: ", "");
      }
      
      if (statusEl) {
        statusEl.className = "ocr-status warning";
        statusEl.innerHTML = `
          <span class="warning-title">${titulo}</span>
          ${mensagem}
          <div class="warning-hint" style="margin-top:12px;">
            <strong>Alternativas:</strong>
            <ul style="margin:8px 0 0 16px;padding:0;">
              <li>Use a aba "Manual" para digitar as disciplinas</li>
              <li>Tente um arquivo menor (reduza o tamanho da imagem/PDF)</li>
              <li>Para PDFs scaneados, use a opção de Imagem</li>
              <li>Use um dispositivo com mais recursos (PC ao invés de mobile)</li>
            </ul>
          </div>
        `;
      }
    } else {
      if (statusEl) {
        statusEl.className = "ocr-status error";
        statusEl.textContent = "Erro: " + error.message;
      }
    }
  }
}

function aplicarMatchingAoEstadoUI(matching) {
  matching.forEach(m => {
    if (m.disciplinaDestino && m.moduloId) {
      const discId = m.disciplinaDestino.toLowerCase().replace(/\s+/g, '_');
      estado[discId] = m.status;
      obsState[discId] = m.justificativa;
    }
  });
  
  renderGrade(CURSOS[cursoAtual], estado, obsState);
}

function aplicarMatching() {
  if (matchingResults.length === 0) {
    alert("Nenhum resultado de matching para aplicar.");
    return;
  }
  
  aplicarMatchingAoEstadoUI(matchingResults);
  
  alert("Matching aplicado à grade curricular. Você pode ajustar manualmente se necessário.");
}

function setupManualInput() {
  const btnAdd = document.getElementById("btn-adicionar-manual");
  if (!btnAdd) return;
  
  btnAdd.addEventListener("click", () => {
    const nome = document.getElementById("manual-nome").value.trim();
    const ch = parseInt(document.getElementById("manual-ch").value) || 0;
    
    if (!nome || ch <= 0) {
      alert("Preencha o nome da disciplina e a carga horária.");
      return;
    }
    
    const curso = CURSOS[cursoAtual];
    let disciplinaDestino = null;
    let chDestino = 0;
    
    for (const mod of curso.modulos) {
      for (const d of mod.disciplinas) {
        const sim = calcularSimilaridade(nome, d.nome);
        if (sim > 0.5 && (!disciplinaDestino || sim > calcularSimilaridade(nome, disciplinaDestino.nome))) {
          disciplinaDestino = d;
          chDestino = d.ch;
        }
      }
    }
    
    const analise = analisarDisciplina(ch, chDestino);
    
    disciplinasImportadas.push({
      nome,
      ch,
      status: analise.status,
      justificativa: analise.justificativa
    });
    
    matchingResults.push({
      nome,
      ch,
      disciplinaDestino: disciplinaDestino ? disciplinaDestino.nome : null,
      disciplinaDestinoCh: chDestino,
      status: analise.status,
      justificativa: analise.justificativa,
      similaridade: disciplinaDestino ? calcularSimilaridade(nome, disciplinaDestino.nome) : 0
    });
    
    if (disciplinaDestino) {
      const discId = disciplinaDestino.nome.toLowerCase().replace(/\s+/g, '_');
      estado[discId] = analise.status;
      obsState[discId] = analise.justificativa;
    }
    
    document.getElementById("manual-nome").value = "";
    document.getElementById("manual-ch").value = "";
    
    renderImportedDisciplinas(disciplinasImportadas);
    renderMatchingResult(matchingResults);
    renderGrade(CURSOS[cursoAtual], estado, obsState);
  });
}

function removerDisciplinaImportada(index) {
  const disc = disciplinasImportadas[index];
  if (disc && disc.disciplinaDestino) {
    const discId = disc.disciplinaDestino.toLowerCase().replace(/\s+/g, '_');
    delete estado[discId];
  }
  
  disciplinasImportadas.splice(index, 1);
  matchingResults.splice(index, 1);
  
  renderImportedDisciplinas(disciplinasImportadas);
  renderMatchingResult(matchingResults);
  renderGrade(CURSOS[cursoAtual], estado, obsState);
}

function limparImportacao() {
  disciplinasImportadas = [];
  matchingResults = [];
  renderImportedDisciplinas([]);
  renderMatchingResult([]);
  renderResumoAnalise([], {});
  
  const applyBtn = document.getElementById("btn-aplicar-matching");
  if (applyBtn) applyBtn.style.display = "none";
}

document.addEventListener('DOMContentLoaded', init);

window.cursoAtual = cursoAtual;
window.estado = estado;
window.obsState = obsState;

window.selecionarCurso = selecionarCurso;
window.setStatus = setStatus;
window.calcular = calcular;
window.recarregarAtendimento = recarregarAtendimento;
window.removerHistorico = removerHistorico;
window.removerDisciplinaImportada = removerDisciplinaImportada;
window.switchTab = switchTab;
window.switchUploadTab = switchUploadTab;
window.aplicarMatching = aplicarMatching;
window.limparImportacao = limparImportacao;
window.imprimirRelatorio = imprimirRelatorio;
window.copiarResumo = copiarResumo;
window.gerarCarta = gerarCarta;
window.gerarPDF = gerarPDF;
