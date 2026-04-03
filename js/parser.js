let tesseractWorker = null;

async function initOCR() {
  if (!tesseractWorker) {
    tesseractWorker = await Tesseract.createWorker('por');
  }
  return tesseractWorker;
}

async function processImageOCR(file, onProgress) {
  try {
    const worker = await initOCR();
    
    const result = await worker.recognize(file, {}, {
      logger: m => {
        if (onProgress && m.status === 'recognizing text') {
          onProgress(Math.round(m.progress * 100));
        }
      }
    });
    
    return parseTextoHistorico(result.data.text);
  } catch (error) {
    console.error("Erro no OCR:", error);
    throw new Error("Falha ao processar imagem. Tente uma imagem mais legível.");
  }
}

async function processPDF(file, onProgress) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async function(e) {
      try {
        const typedarray = new Uint8Array(e.target.result);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        
        let textoCompleto = "";
        const totalPages = pdf.numPages;
        
        for (let i = 1; i <= totalPages; i++) {
          if (onProgress) {
            onProgress(Math.round((i / totalPages) * 100));
          }
          
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(" ");
          textoCompleto += pageText + "\n";
        }
        
        resolve(parseTextoHistorico(textoCompleto));
      } catch (error) {
        console.error("Erro ao processar PDF:", error);
        reject(new Error("Falha ao extrair texto do PDF."));
      }
    };
    reader.onerror = () => reject(new Error("Falha ao ler arquivo."));
    reader.readAsArrayBuffer(file);
  });
}

async function processDOCX(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        mammoth.extractRawText({ arrayBuffer: e.target.result })
          .then(result => resolve(parseTextoHistorico(result.value)))
          .catch(err => {
            console.error("Erro ao processar DOCX:", err);
            reject(new Error("Falha ao processar arquivo Word."));
          });
      } catch (error) {
        reject(new Error("Falha ao ler arquivo Word."));
      }
    };
    reader.onerror = () => reject(new Error("Falha ao ler arquivo."));
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
    return await processImageOCR(file, onProgress);
  } else if (tipo === 'pdf' && extensoes.pdf.includes(ext)) {
    return await processPDF(file, onProgress);
  } else if (tipo === 'doc' && extensoes.doc.includes(ext)) {
    return await processDOCX(file);
  } else {
    throw new Error(`Tipo de arquivo não suportado para ${tipo}: .${ext}`);
  }
}
