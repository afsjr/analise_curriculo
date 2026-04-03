function renderCourseSelector(cursoAtual, onSelect) {
  const cs = document.getElementById("course-selector");
  if (!cs) return;
  
  cs.innerHTML = Object.entries(CURSOS).map(([key, value]) =>
    `<button class="course-btn ${key === cursoAtual ? "active" : ""}" onclick="selecionarCurso('${key}', this)">${value.nome}</button>`
  ).join("");
}

function renderGrade(curso, estado, obsState) {
  const container = document.getElementById("grade-tables");
  if (!container) return;
  
  container.innerHTML = "";
  
  curso.modulos.forEach(mod => {
    const chAtivas = mod.disciplinas.filter(d => estado[d.id] !== "dispensada").reduce((s, d) => s + d.ch, 0);
    const chDisp = mod.disciplinas.filter(d => estado[d.id] === "dispensada").reduce((s, d) => s + d.ch, 0);
    
    const header = document.createElement("div");
    header.className = "modulo-header";
    header.innerHTML = `
      <span class="modulo-tag ${mod.tagClass}">${mod.tag}</span>
      <span class="modulo-title">${mod.titulo} — ${mod.periodo}</span>
      <span class="modulo-ch" id="ch-${mod.id}">${chAtivas}h em aula · ${chDisp}h dispensadas / ${mod.totalCH}h total</span>
    `;
    container.appendChild(header);
    
    const table = document.createElement("table");
    table.className = "disc-table";
    table.innerHTML = `
      <thead>
        <tr>
          <th>Disciplina</th>
          <th>C/H</th>
          <th style="text-align:center">Status</th>
          <th>Observação</th>
        </tr>
      </thead>
    `;
    
    const tbody = document.createElement("tbody");
    mod.disciplinas.forEach(d => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${d.nome}</td>
        <td><span class="ch-badge">${d.ch}h</span></td>
        <td>
          <div class="status-group">
            ${["cursar", "complementar", "dispensada", "ementas"].map(s => `
              <button class="status-btn btn-${s} ${estado[d.id] === s ? "active" : ""}"
                onclick="setStatus('${d.id}', '${s}', '${mod.id}')">${STATUS_LABELS[s]}</button>
            `).join("")}
          </div>
        </td>
        <td><textarea class="obs-input" rows="1" placeholder="Observação (opcional)"
          onchange="obsState['${d.id}'] = this.value">${obsState[d.id] || ""}</textarea></td>
      `;
      tbody.appendChild(tr);
    });
    
    table.appendChild(tbody);
    container.appendChild(table);
  });
}

function renderValidationBanner(curso, estado) {
  const banner = document.getElementById("val-banner");
  const list = document.getElementById("val-list");
  if (!banner || !list) return;
  
  const ementas = [];
  curso.modulos.forEach(mod => {
    mod.disciplinas.forEach(d => {
      if (estado[d.id] === "ementas") ementas.push(d.nome);
    });
  });
  
  if (ementas.length > 0) {
    list.innerHTML = ementas.map(n => `<li>${n} — aguardando ementas: tratada como complementar (1/3) no cálculo</li>`).join("");
    banner.classList.add("show");
  } else {
    banner.classList.remove("show");
  }
}

function renderResults(resultado, dadosAluno) {
  const resultsSection = document.getElementById("results");
  if (!resultsSection) return;
  
  const { totalGeral, parcelasGeral, resMods, warnings, economia } = resultado;
  const { nome, matricula, origem, curso, valorMatricula, valorMensalidade } = dadosAluno;
  
  document.getElementById("result-aluno").innerHTML =
    `<strong>${nome || "Aluno"}</strong>${matricula ? " · Mat: " + matricula : ""}${origem ? " · Origem: " + origem : ""} · ${curso.nome} · <em>${new Date().toLocaleDateString("pt-BR")}</em>`;
  
  document.getElementById("modulos-grid").innerHTML = resMods.map((m, i) => `
    <div class="modulo-card ${["m1", "m2", "m3"][i]}">
      <div class="mc-label">${m.mod.tag}</div>
      <div class="mc-name">${m.mod.titulo}</div>
      <div class="mc-value">${m.nPCobradas === 0 ? "—" : m.nPCobradas}</div>
      <div class="mc-sub">${m.nPCobradas === 0 ? "Módulo dispensado" : `parcelas de ${fmt(m.vp)}`}</div>
      <div class="mc-total">${fmt(m.totalMod)}</div>
    </div>
  `).join("");
  
  document.getElementById("total-card").innerHTML = `
    <div class="tc-item">
      <div class="tc-label">Total a pagar</div>
      <div class="tc-value">${fmt(totalGeral)}</div>
      <div class="tc-sub">matrícula + mensalidades</div>
    </div>
    <div class="tc-divider"></div>
    <div class="tc-item">
      <div class="tc-label">Nº de parcelas</div>
      <div class="tc-value">${parcelasGeral}</div>
      <div class="tc-sub">de ${curso.totalParcelas} possíveis</div>
    </div>
    <div class="tc-divider"></div>
    <div class="tc-item">
      <div class="tc-label">Duração</div>
      <div class="tc-value">${curso.duracaoMeses} meses</div>
      <div class="tc-sub">integralização com a turma</div>
    </div>
  `;
  
  document.getElementById("economy-area").innerHTML = economia > 0
    ? `<div class="economy-banner">O aluno economiza <strong>${fmt(economia)}</strong> em relação ao curso sem aproveitamento (${fmt(resultado.cursoNormal)} → ${fmt(totalGeral)})</div>`
    : "";
  
  document.getElementById("warnings-area").innerHTML = warnings.map(w =>
    `<div class="warning-box"><span>${w}</span></div>`
  ).join("");
  
  const rows = document.getElementById("breakdown-rows");
  rows.innerHTML = `
    <div class="pb-row">
      <div class="pb-num">Parcela 1</div>
      <div>Matrícula</div>
      <div class="pb-val">${fmt(valorMatricula)}</div>
      <div class="pb-tot">${fmt(valorMatricula)}</div>
    </div>
  `;
  
  resMods.forEach((m, i) => {
    const p1 = curso.modulos[i].disciplinas.length > 0 ? [2, 11, 20][i] : "–";
    const p2 = [10, 19, 28][i];
    const desc = m.nPCobradas === 0
      ? "Módulo totalmente dispensado"
      : `${(m.fator * 100).toFixed(1)}% da mensalidade · ${m.r.chC}h integral + ${m.r.chComp}h compl. + ${m.r.chE}h em análise`;
    
    rows.innerHTML += `
      <div class="pb-row">
        <div class="pb-num">Parc. ${p1}–${p2}</div>
        <div>${m.mod.tag} — ${m.mod.titulo}<br><span class="pb-desc">${desc}</span></div>
        <div class="pb-val">${m.nPCobradas === 0 ? "—" : fmt(m.vp)}</div>
        <div class="pb-tot">${fmt(m.totalMod)}</div>
      </div>
    `;
  });
  
  rows.innerHTML += `
    <div class="pb-row" style="background:#fff0f0;font-weight:700">
      <div class="pb-num">TOTAL</div>
      <div>${parcelasGeral} parcelas</div>
      <div></div>
      <div class="pb-tot" style="font-size:14px">${fmt(totalGeral)}</div>
    </div>
  `;
  
  resultsSection.style.display = "block";
  resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderHistory(historyList) {
  const c = document.getElementById("history-container");
  if (!c) return;
  
  if (historyList.length === 0) {
    c.innerHTML = '<div class="history-empty">Nenhum atendimento calculado ainda nesta sessão.</div>';
    return;
  }
  
  c.innerHTML = `<div class="history-list">${historyList.map(e => `
    <div class="history-card" id="hc-${e.id}">
      <div class="hc-header">
        <div>
          <div class="hc-name">${e.nome || "Aluno sem nome"}</div>
          <div class="hc-mat">${e.matricula || "Sem matrícula"}${e.origem ? " · " + e.origem : ""}</div>
        </div>
        <span class="hc-curso">${e.curso}</span>
        <span class="hc-date">${e.ts}</span>
      </div>
      <div class="hc-grid">
        <div class="hc-stat"><div class="hc-stat-val">${fmt(e.totalGeral)}</div><div class="hc-stat-label">Total</div></div>
        <div class="hc-stat"><div class="hc-stat-val">${e.parcelasGeral}</div><div class="hc-stat-label">Parcelas</div></div>
        <div class="hc-stat"><div class="hc-stat-val">${fmt(e.economia)}</div><div class="hc-stat-label">Economia</div></div>
        <div class="hc-stat"><div class="hc-stat-val">${fmt(e.valorMensalidade)}</div><div class="hc-stat-label">Mensalidade</div></div>
      </div>
      <div class="hc-actions">
        <button class="hc-btn" onclick="recarregarAtendimento(${e.id})">Recarregar</button>
        <button class="hc-btn danger" onclick="removerHistorico(${e.id})">Remover</button>
      </div>
    </div>
  `).join("")}</div>`;
}

function renderImportedDisciplinas(disciplinas, onRemove) {
  const container = document.getElementById("imported-list-container");
  if (!container) return;
  
  if (disciplinas.length === 0) {
    container.innerHTML = '<div class="history-empty">Nenhuma disciplina importada. Carregue um arquivo ou adicione manualmente.</div>';
    return;
  }
  
  container.innerHTML = `
    <div class="imported-list">
      ${disciplinas.map((d, i) => `
        <div class="imported-item">
          <span class="disc-nome">${d.nome}</span>
          <span class="disc-ch">${d.ch}h</span>
          <span class="disc-status ${d.status}">${STATUS_LABELS[d.status] || d.status}</span>
          <button class="remove-btn" onclick="removerDisciplinaImportada(${i})">×</button>
        </div>
      `).join("")}
    </div>
  `;
}

function renderMatchingResult(matchingResults) {
  const container = document.getElementById("matching-result");
  if (!container) return;
  
  if (!matchingResults || matchingResults.length === 0) {
    container.style.display = "none";
    return;
  }
  
  container.style.display = "block";
  container.innerHTML = `
    <h4>Resultado do Matching Automático</h4>
    ${matchingResults.map(m => `
      <div class="mr-item">
        <span class="mr-from">${m.nome} (${m.ch}h)</span>
        <span class="mr-arrow">→</span>
        <span class="mr-to">${m.disciplinaDestino || "não encontrado"} (${m.status})</span>
      </div>
    `).join("")}
  `;
}

function fmt(v) {
  return "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function switchTab(tabName, btn) {
  document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.getElementById("tab-" + tabName).classList.add("active");
  btn.classList.add("active");
}

function switchUploadTab(tabName, btn) {
  document.querySelectorAll(".upload-tab").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  
  document.querySelectorAll(".upload-content").forEach(c => c.style.display = "none");
  document.getElementById("upload-" + tabName).style.display = "block";
}
