const REGRAS = {
  dispensadaMinimoPercentual: 75,
  complementarMinimoPercentual: 40,
  fatorComplementar: 1/3,
  fatorEmentas: 1/3
};

function analisarDisciplina(chOrigem, chDestino) {
  if (chOrigem === 0 || chDestino === 0) {
    return {
      status: "cursar",
      justificativa: "Carga horária não informada ou inválida",
      percentual: 0
    };
  }
  
  const percentual = (chOrigem / chDestino) * 100;
  
  if (percentual >= REGRAS.dispensadaMinimoPercentual) {
    return {
      status: "dispensada",
      justificativa: `Carga horária (${chOrigem}h) representa ${percentual.toFixed(1)}% do curso destino (${chDestino}h) - acima de ${REGRAS.dispensadaMinimoPercentual}%`,
      percentual: percentual
    };
  }
  
  if (percentual >= REGRAS.complementarMinimoPercentual) {
    return {
      status: "complementar",
      justificativa: `Carga horária (${chOrigem}h) representa ${percentual.toFixed(1)}% do curso destino (${chDestino}h) - requer avaliação complementar (1/3 da mensalidade)`,
      percentual: percentual
    };
  }
  
  return {
    status: "cursar",
    justificativa: `Carga horária (${chOrigem}h) representa apenas ${percentual.toFixed(1)}% do curso destino (${chDestino}h) - abaixo de ${REGRAS.complementarMinimoPercentual}%`,
    percentual: percentual
  };
}

function calcularFatorModulo(modulo, estadoDisciplinas) {
  let chC = 0, chComp = 0, chD = 0, chE = 0;
  
  modulo.disciplinas.forEach(d => {
    const s = estadoDisciplinas[d.id];
    if (s === "cursar") chC += d.ch;
    if (s === "complementar") chComp += d.ch;
    if (s === "dispensada") chD += d.ch;
    if (s === "ementas") chC += d.ch;
  });
  
  const total = modulo.totalCH;
  const fator = (chC / total) + ((chComp / total) * REGRAS.fatorComplementar);
  const dispensadoTotal = (chC + chComp + chE) === 0;
  
  return {
    fator,
    chC,
    chComp,
    chD,
    chE,
    dispensadoTotal
  };
}

function calcularTotalCurso(curso, estadoDisciplinas, valorMatricula, valorMensalidade) {
  let totalGeral = valorMatricula;
  let parcelasGeral = 1;
  const resMods = [];
  const warnings = [];
  
  curso.modulos.forEach(mod => {
    const r = calcularFatorModulo(mod, estadoDisciplinas);
    const numP = mod.disciplinas.length > 0 ? curso.parcelasPorModulo : 0;
    
    let vp = 0, totalMod = 0, nPCobradas = 0;
    
    if (!r.dispensadoTotal) {
      vp = Math.round(valorMensalidade * r.fator * 100) / 100;
      totalMod = Math.round(vp * numP * 100) / 100;
      nPCobradas = numP;
    }
    
    totalGeral += totalMod;
    parcelasGeral += nPCobradas;
    
    if (r.chE > 0) {
      warnings.push(`${mod.tag}: ${r.chE}h aguardando ementas - será cursada integralmente até definição.`);
    }
    
    resMods.push({
      mod,
      r,
      vp,
      totalMod,
      nPCobradas,
      numP,
      fator: r.fator
    });
  });
  
  const cursoNormal = curso.totalParcelas * valorMensalidade + (valorMatricula - valorMensalidade);
  const economia = cursoNormal - totalGeral;
  
  return {
    totalGeral,
    parcelasGeral,
    resMods,
    warnings,
    economia,
    cursoNormal
  };
}

function getStatusLabel(status) {
  return STATUS_LABELS[status] || status;
}

function getStatusCor(status) {
  return STATUS_CORES[status] || "#888";
}
