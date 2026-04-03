let tesseractWorker = null;

const PROCESS_PHASES = {
  INIT: { range: [0, 10], text: "Inicializando...", estimate: "1-2s" },
  LOAD: { range: [10, 30], text: "Carregando arquivo...", estimate: "1-3s" },
  OCR: { range: [30, 70], text: "Reconhecendo texto (OCR)...", estimate: "5-30s" },
  PARSE: { range: [70, 85], text: "Analisando disciplinas...", estimate: "2-5s" },
  MATCH: { range: [85, 95], text: "Comparando com curso destino...", estimate: "1-3s" },
  DONE: { range: [95, 100], text: "Concluído!", estimate: "" }
};

function getPhaseFromProgress(progress) {
  if (progress < 10) return PROCESS_PHASES.INIT;
  if (progress < 30) return PROCESS_PHASES.LOAD;
  if (progress < 70) return PROCESS_PHASES.OCR;
  if (progress < 85) return PROCESS_PHASES.PARSE;
  if (progress < 95) return PROCESS_PHASES.MATCH;
  return PROCESS_PHASES.DONE;
}

function estimateTime(tipo, tamanhoMB) {
  const estimates = {
    imagem: { base: 5, perMB: 8 },
    pdf: { base: 2, perMB: 3 },
    doc: { base: 1, perMB: 2 }
  };
  
  const config = estimates[tipo] || estimates.imagem;
  const segundos = config.base + (tamanhoMB * config.perMB);
  
  if (segundos < 10) return "~5-10 segundos";
  if (segundos < 30) return "~10-30 segundos";
  if (segundos < 60) return "~30-60 segundos";
  return "~1-2 minutos";
}

function createProgressCallback(onProgress) {
  let startTime = Date.now();
  let lastUpdate = 0;
  
  return (progress, message) => {
    const now = Date.now();
    if (now - lastUpdate < 200 && progress < 100) return;
    lastUpdate = now;
    
    const phase = getPhaseFromProgress(progress);
    const elapsed = Math.round((now - startTime) / 1000);
    const elapsedStr = elapsed > 60 ? `${Math.floor(elapsed/60)}m ${elapsed%60}s` : `${elapsed}s`;
    
    const progressData = {
      percent: progress,
      phase: message || phase.text,
      estimate: phase.estimate,
      elapsed: elapsedStr
    };
    
    if (onProgress) onProgress(progressData);
  };
}

async function initOCR() {
  if (!tesseractWorker) {
    tesseractWorker = await Tesseract.createWorker('por');
  }
  return tesseractWorker;
}

async function processImageOCR(file, onProgress) {
  const progressCb = createProgressCallback(onProgress);
  
  try {
    progressCb(5, "Inicializando OCR...");
    const worker = await initOCR();
    
    progressCb(20, "Processando imagem...");
    
    const result = await worker.recognize(file, {}, {
      logger: m => {
        if (m.status === 'loading tesseract core') {
          progressCb(25, "Carregando motor OCR...");
        } else if (m.status === 'initializing api') {
          progressCb(30, "Inicializando API...");
        } else if (m.status === 'recognizing text') {
          const ocrProgress = 30 + Math.round(m.progress * 40);
          progressCb(ocrProgress, "Reconhecendo texto...");
        }
      }
    });
    
    progressCb(75, "Analisando texto extraído...");
    const disciplinas = parseTextoHistorico(result.data.text);
    
    progressCb(90, "Finalizando...");
    return disciplinas;
    
  } catch (error) {
    console.error("Erro no OCR:", error);
    if (error.message.includes("Failed to load image")) {
      throw new Error("não_conseguiu: O sistema não conseguiu ler a imagem. O arquivo pode estar corrompido ou em formato não suportado. Tente usar a digitação manual.");
    }
    if (error.message.includes("timeout") || error.message.includes("network")) {
      throw new Error("timeout: O processamento demorou mais que o esperado. Tente uma imagem menor ou use a digitação manual.");
    }
    throw new Error("não_conseguiu: Falha ao processar imagem. Tente uma imagem mais legível ou adicione manualmente.");
  }
}

async function processPDF(file, onProgress) {
  const progressCb = createProgressCallback(onProgress);
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async function(e) {
      try {
        progressCb(10, "Lendo arquivo PDF...");
        const typedarray = new Uint8Array(e.target.result);
        
        progressCb(20, "Abrindo documento...");
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        
        let textoCompleto = "";
        const totalPages = pdf.numPages;
        
        progressCb(25, `Processando ${totalPages} páginas...`);
        
        for (let i = 1; i <= totalPages; i++) {
          const progressPage = 25 + Math.round((i / totalPages) * 50);
          progressCb(progressPage, `Processando página ${i} de ${totalPages}...`);
          
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(" ");
          textoCompleto += pageText + "\n";
        }
        
        progressCb(80, "Extraindo disciplinas...");
        const disciplinas = parseTextoHistorico(textoCompleto);
        
        if (disciplinas.length === 0) {
          progressCb(95, "Verificando resultado...");
          reject(new Error("não_conseguiu: O sistema não encontrou disciplinas no PDF. O documento pode estar em formato de imagem (scaneado) ou sem texto selecionável. Tente usar OCR (imagem) ou a digitação manual."));
          return;
        }
        
        progressCb(95, "Finalizando...");
        resolve(disciplinas);
        
      } catch (error) {
        console.error("Erro ao processar PDF:", error);
        if (error.message.includes("não_conseguiu")) {
          reject(error);
        } else if (error.name === "MissingPDFException") {
          reject(new Error("não_conseguiu: O arquivo PDF está corrompido ou inválido. Tente outro arquivo."));
        } else {
          reject(new Error("não_conseguiu: Falha ao processar PDF. Tente outro arquivo ou use a digitação manual."));
        }
      }
    };
    
    reader.onerror = () => reject(new Error("não_conseguiu: Falha ao ler arquivo. O arquivo pode estar corrompido."));
    reader.readAsArrayBuffer(file);
  });
}

async function processDOCX(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      try {
        mammoth.extractRawText({ arrayBuffer: e.target.result })
          .then(result => {
            if (!result.value || result.value.trim().length < 10) {
              reject(new Error("não_conseguiu: O documento está vazio ou o sistema não conseguiu extrair o texto. Tente usar outro arquivo ou a digitação manual."));
              return;
            }
            const disciplinas = parseTextoHistorico(result.value);
            resolve(disciplinas);
          })
          .catch(err => {
            console.error("Erro ao processar DOCX:", err);
            reject(new Error("não_conseguiu: Falha ao processar arquivo Word. O formato pode não ser suportado. Tente salvar como .docx ou use a digitação manual."));
          });
      } catch (error) {
        reject(new Error("não_conseguiu: Falha ao ler arquivo Word. O arquivo pode estar corrompido."));
      }
    };
    
    reader.onerror = () => reject(new Error("não_conseguiu: Falha ao ler arquivo Word."));
    reader.readAsArrayBuffer(file);
  });
}

function parseTextoHistorico(texto) {
  const disciplinas = [];
  
  const linhas = texto.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  const padroes = [
    /(\d{1,3})\s*h\s*(?:mensal|total)?/i,
    /(\d{1,3})\s*(?:horas?|h\b)/i,
    /carga\s*hor[áa]ria\s*:?\s*(\d{1,3})/i
  ];
  
  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    
    if (linha.length < 3 || linha.length > 150) continue;
    
    const palavrasExcluir = ['histórico', '-curricular', 'instituição', 'curso', 'aluno', 'nome', 'matrícula', 'período', 'semestre', 'ano', 'data', 'assinatura', 'coordenação'];
    const temExcluir = palavrasExcluir.some(p => linha.toLowerCase().includes(p));
    if (temExcluir) continue;
    
    let ch = null;
    for (const padrao of padroes) {
      const match = linha.match(padrao);
      if (match) {
        ch = parseInt(match[1]);
        break;
      }
    }
    
    if (ch === null) {
      const palavras = linha.split(/\s+/);
      for (const palavra of palavras) {
        const num = parseInt(palavra.replace(/\D/g, ''));
        if (num >= 10 && num <= 500 && linha.includes(palavra)) {
          ch = num;
          break;
        }
      }
    }
    
    let nome = linha.replace(/\d{1,3}\s*h?\b/gi, '').trim();
    nome = nome.replace(/^\d+[\.\)]?\s*/, '');
    nome = nome.replace(/[A-Z]{2,}\s*$/, '');
    
    if (nome.length < 3) continue;
    
    nome = normalizarNome(nome);
    
    if (nome.length > 3 && ch && ch >= 20 && ch <= 500) {
      disciplinas.push({
        nome: nome,
        ch: ch,
        status: null,
        justificativa: null
      });
    }
  }
  
  return disciplinas;
}

function normalizarNome(nome) {
  return nome
    .replace(/\s+/g, ' ')
    .replace(/^[\s\.\-\*]+|[\s\.\-\*]+$/g, '')
    .trim();
}

function matchingDisciplinas(disciplinasOrigem, cursoDestino) {
  const resultados = [];
  
  const disciplinasDestino = [];
  cursoDestino.modulos.forEach(mod => {
    mod.disciplinas.forEach(d => {
      disciplinasDestino.push({
        ...d,
        moduloId: mod.id,
        moduloTag: mod.tag
      });
    });
  });
  
  disciplinasOrigem.forEach(discOrigem => {
    let melhorMatch = null;
    let maiorSimilaridade = 0;
    
    for (const discDestino of disciplinasDestino) {
      const similaridade = calcularSimilaridade(discOrigem.nome, discDestino.nome);
      
      if (similaridade > maiorSimilaridade && similaridade >= 0.3) {
        maiorSimilaridade = similaridade;
        melhorMatch = discDestino;
      }
    }
    
    if (melhorMatch) {
      const analise = analisarDisciplina(discOrigem.ch, melhorMatch.ch);
      
      resultados.push({
        nome: discOrigem.nome,
        ch: discOrigem.ch,
        disciplinaDestino: melhorMatch.nome,
        disciplinaDestinoCh: melhorMatch.ch,
        moduloTag: melhorMatch.moduloTag,
        moduloId: melhorMatch.moduloId,
        status: analise.status,
        justificativa: analise.justificativa,
        similaridade: maiorSimilaridade
      });
    } else {
      resultados.push({
        nome: discOrigem.nome,
        ch: discOrigem.ch,
        disciplinaDestino: null,
        disciplinaDestinoCh: null,
        moduloTag: null,
        moduloId: null,
        status: "cursar",
        justificativa: "Disciplina não encontrada na grade do curso destino",
        similaridade: 0
      });
    }
  });
  
  return resultados;
}

function calcularSimilaridade(str1, str2) {
  const s1 = normalizarNome(str1).toLowerCase();
  const s2 = normalizarNome(str2).toLowerCase();
  
  if (s1 === s2) return 1;
  
  const palavras1 = s1.split(/\s+/);
  const palavras2 = s2.split(/\s+/);
  
  let palavrasIguais = 0;
  for (const p1 of palavras1) {
    for (const p2 of palavras2) {
      if (p1 === p2 || p1.includes(p2) || p2.includes(p1)) {
        palavrasIguais++;
        break;
      }
    }
  }
  
  const intersection = palavrasIguais;
  const union = new Set([...palavras1, ...palavras2]).size;
  
  return union > 0 ? intersection / union : 0;
}

function aplicarMatchingAoEstado(matchingResults) {
  const estado = {};
  
  matchingResults.forEach(m => {
    if (m.disciplinaDestino && m.moduloId) {
      const key = `${m.moduloId}_${m.disciplinaDestino.toLowerCase().replace(/\s+/g, '_')}`;
      estado[m.disciplinaDestino.toLowerCase().replace(/\s+/g, '_')] = m.status;
    }
  });
  
  return estado;
}

function setupUploadArea() {
  const uploadAreas = document.querySelectorAll('.upload-area');
  
  uploadAreas.forEach(area => {
    area.addEventListener('click', () => {
      const input = area.querySelector('input[type="file"]');
      if (input) input.click();
    });
    
    area.addEventListener('dragover', (e) => {
      e.preventDefault();
      area.classList.add('dragover');
    });
    
    area.addEventListener('dragleave', () => {
      area.classList.remove('dragover');
    });
    
    area.addEventListener('drop', (e) => {
      e.preventDefault();
      area.classList.remove('dragover');
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const input = area.querySelector('input[type="file"]');
        if (input) {
          const dt = new DataTransfer();
          dt.items.add(files[0]);
          input.files = dt.files;
          input.dispatchEvent(new Event('change'));
        }
      }
    });
  });
}

async function processarArquivo(file, tipo, onProgress) {
  const extensoes = {
    imagem: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'],
    pdf: ['pdf'],
    doc: ['doc', 'docx']
  };
  
  const ext = file.name.split('.').pop().toLowerCase();
  
  if (tipo === 'imagem' && extensoes.imagem.includes(ext)) {
    return await processWithTimeout(file, 'imagem', onProgress, () => processImageOCR(file, onProgress));
  } else if (tipo === 'pdf' && extensoes.pdf.includes(ext)) {
    return await processWithTimeout(file, 'pdf', onProgress, () => processPDF(file, onProgress));
  } else if (tipo === 'doc' && extensoes.doc.includes(ext)) {
    return await processWithTimeout(file, 'doc', onProgress, () => processDOCX(file));
  } else {
    throw new Error(`Tipo de arquivo não suportado para ${tipo}: .${ext}`);
  }
}

async function processWithTimeout(file, tipo, onProgress, processFn) {
  const timeouts = {
    imagem: 45000,
    pdf: 30000,
    doc: 20000
  };
  
  const timeoutMs = timeouts[tipo] || 30000;
  
  let timeoutHandle;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`timeout: O processamento excedeu o tempo limite (${timeoutMs/1000}s). O arquivo pode ser muito grande ou o dispositivo não tem recursos suficientes. Tente um arquivo menor ou use a digitação manual.`));
    }, timeoutMs);
  });
  
  try {
    const result = await Promise.race([processFn(), timeoutPromise]);
    clearTimeout(timeoutHandle);
    return result;
  } catch (error) {
    clearTimeout(timeoutHandle);
    throw error;
  }
}

function isCapableError(error) {
  return error.message && (error.message.startsWith("não_conseguiu:") || error.message.startsWith("timeout:"));
}
