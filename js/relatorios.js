function gerarCarta(dadosAluno, resultado, curso) {
  const hoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const { nome, matricula, origem, valorMatricula, valorMensalidade } = dadosAluno;
  const { totalGeral, parcelasGeral } = resultado;
  
  let linhasDisp = [], linhasComp = [], linhasCursar = [], linhasEmentas = [];
  let justificativas = [];
  
  curso.modulos.forEach(mod => {
    mod.disciplinas.forEach(d => {
      const status = window.estado ? window.estado[d.id] : d.def;
      const obs = window.obsState ? window.obsState[d.id] : "";
      
      if (status === "dispensada") {
        linhasDisp.push(`  • ${d.nome} (${d.ch}h)${obs ? ` - ${obs}` : ""}`);
      }
      if (status === "complementar") {
        linhasComp.push(`  • ${d.nome} (${d.ch}h)${obs ? ` - ${obs}` : ""}`);
      }
      if (status === "cursar") {
        linhasCursar.push(`  • ${d.nome} (${d.ch}h)${obs ? ` - ${obs}` : ""}`);
      }
      if (status === "ementas") {
        linhasEmentas.push(`  • ${d.nome} (${d.ch}h)${obs ? ` - ${obs}` : ""}`);
      }
    });
  });
  
  const carta = `COLÉGIO SANTA MÔNICA TÉCNICO — CSM TEC
Carta de Análise de Aproveitamento de Estudos

Limoeiro/PE, ${hoje}

Prezado(a) ${nome},

Após análise do histórico acadêmico apresentado pela instituição de origem (${origem || "não informada"}), informamos o resultado da avaliação de aproveitamento de estudos para ingresso no Curso Técnico em Enfermagem do CSM Tec (Matrícula: ${matricula || "não informada"}).

DISCIPLINAS DISPENSADAS (equivalência ≥75% da C/H):
${linhasDisp.length > 0 ? linhasDisp.join("\n") : "  Nenhuma"}

DISCIPLINAS COM AVALIAÇÃO COMPLEMENTAR (C/H parcial — cobrança de 1/3 da mensalidade):
${linhasComp.length > 0 ? linhasComp.join("\n") : "  Nenhuma"}

DISCIPLINAS AGUARDANDO EMENTAS (dispensa sujeita à análise das ementas):
${linhasEmentas.length > 0 ? linhasEmentas.join("\n") : "  Nenhuma"}

DISCIPLINAS A CURSAR INTEGRALMENTE:
${linhasCursar.length > 0 ? linhasCursar.join("\n") : "  Nenhuma"}

CONDIÇÕES FINANCEIRAS:
  Matrícula: ${fmt(valorMatricula)}
  Mensalidade padrão: ${fmt(valorMensalidade)}
  Total com aproveitamento: ${fmt(totalGeral)} em ${parcelasGeral} parcelas
  Duração do curso: ${curso.duracaoMeses} meses (integralização com a turma)

O aproveitamento de estudos não altera o prazo de conclusão do curso. O aluno integraliza junto com a turma, com redução proporcional da frequência nas disciplinas dispensadas e complementares.

Esta análise está sujeita à homologação final pela Coordenação Pedagógica do CSM Tec.

Atenciosamente,
Equipe Comercial — CSM Tec Santa Mônica`;

  return carta;
}

function abrirCarta(dadosAluno, resultado, curso) {
  const carta = gerarCarta(dadosAluno, resultado, curso);
  
  const win = window.open("", "_blank", "width=700,height=600");
  win.document.write(`
    <html>
    <head>
      <title>Carta de Aproveitamento — ${dadosAluno.nome || "Aluno"}</title>
      <style>
        body {
          font-family: monospace;
          font-size: 13px;
          padding: 40px;
          white-space: pre-wrap;
          line-height: 1.7;
          max-width: 700px;
          margin: 0 auto;
        }
        .print-btn {
          display: block;
          margin: 20px auto;
          padding: 10px 24px;
          background: #9b1c1c;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
        }
        @media print {
          .print-btn { display: none !important; }
        }
      </style>
    </head>
    <body>
      <button class="print-btn" onclick="window.print()">Imprimir / Salvar PDF</button>
      ${carta.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}
      <button class="print-btn" onclick="window.print()">Imprimir / Salvar PDF</button>
    </body>
    </html>
  `);
  win.document.close();
}

function copiarResumo(dadosAluno, resultado, curso) {
  const { nome, matricula, origem, valorMatricula, valorMensalidade } = dadosAluno;
  const { totalGeral, parcelasGeral } = resultado;
  
  let linhas = [
    "APROVEITAMENTO DE ESTUDOS — CSM TEC",
    `Aluno: ${nome}${matricula ? " | Mat: " + matricula : ""}${origem ? " | Origem: " + origem : ""}`,
    `Curso: ${curso.nome}`,
    `Data: ${new Date().toLocaleDateString("pt-BR")}`,
    "",
    `Matrícula (Parcela 1): ${fmt(valorMatricula)}`,
  ];
  
  curso.modulos.forEach((mod, i) => {
    const r = calcularFatorModulo(mod, window.estado || {});
    const numP = curso.parcelasPorModulo;
    
    if (r.dispensadoTotal) {
      linhas.push(`${mod.tag} (Parc. ${[2, 11, 20][i]}–${[10, 19, 28][i]}): DISPENSADO — R$ 0,00`);
    } else {
      const vp = Math.round(valorMensalidade * r.fator * 100) / 100;
      const tot = Math.round(vp * numP * 100) / 100;
      linhas.push(`${mod.tag} (Parc. ${[2, 11, 20][i]}–${[10, 19, 28][i]}): ${numP}x ${fmt(vp)} = ${fmt(tot)}`);
    }
  });
  
  linhas.push("", "TOTAL: " + fmt(totalGeral) + " em " + parcelasGeral + " parcelas");
  linhas.push("Duração: " + curso.duracaoMeses + " meses (integralização com a turma)");
  
  navigator.clipboard.writeText(linhas.join("\n"))
    .then(() => alert("Resumo copiado para a área de transferência!"))
    .catch(err => {
      console.error("Erro ao copiar:", err);
      alert("Erro ao copiar. Tente novamente.");
    });
}

async function gerarPDF(dadosAluno, resultado, curso) {
  if (typeof jspdf === 'undefined') {
    alert("Biblioteca jsPDF não carregada. Use a opção de imprimir.");
    return;
  }
  
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;
  
  doc.setFillColor(26, 3, 3);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("CSM Tec", 15, 20);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Calculadora de Aproveitamento de Estudos", 15, 28);
  
  y = 45;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Resultado da Análise", pageWidth / 2, y, { align: "center" });
  
  y += 15;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  
  doc.text(`Aluno: ${dadosAluno.nome || "não informado"}`, 15, y);
  y += 7;
  doc.text(`Matrícula: ${dadosAluno.matricula || "não informada"}`, 15, y);
  y += 7;
  doc.text(`Instituição de origem: ${dadosAluno.origem || "não informada"}`, 15, y);
  y += 7;
  doc.text(`Curso: ${curso.nome}`, 15, y);
  y += 7;
  doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 15, y);
  
  y += 15;
  doc.setFillColor(240, 240, 240);
  doc.rect(15, y - 5, pageWidth - 30, 25, 'F');
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Total a pagar: ${fmt(resultado.totalGeral)}`, 20, y + 5);
  doc.setFont("helvetica", "normal");
  doc.text(` em ${resultado.parcelasGeral} parcelas`, 80, y + 5);
  
  y += 30;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo por Módulo:", 15, y);
  
  y += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  resultado.resMods.forEach((m, i) => {
    const bgColors = [[255, 248, 248], [248, 250, 255], [248, 255, 254]];
    doc.setFillColor(...bgColors[i % 3]);
    doc.rect(15, y - 4, pageWidth - 30, 18, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.text(`${m.mod.tag} - ${m.mod.titulo}`, 20, y + 3);
    doc.setFont("helvetica", "normal");
    doc.text(`${m.nPCobradas} parcelas de ${fmt(m.vp)}`, 20, y + 10);
    doc.setFont("helvetica", "bold");
    doc.text(fmt(m.totalMod), pageWidth - 35, y + 6, { align: "right" });
    
    y += 22;
  });
  
  if (resultado.economia > 0) {
    y += 5;
    doc.setFillColor(240, 253, 244);
    doc.rect(15, y - 5, pageWidth - 30, 15, 'F');
    doc.setTextColor(22, 101, 52);
    doc.text(`Economia: ${fmt(resultado.economia)}`, 20, y + 3);
    doc.setTextColor(0, 0, 0);
  }
  
  y += 25;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Detalhamento:", 15, y);
  
  y += 10;
  doc.setFontSize(9);
  
  curso.modulos.forEach((mod, i) => {
    mod.disciplinas.forEach(d => {
      const status = window.estado ? window.estado[d.id] : d.def;
      const label = STATUS_LABELS[status] || status;
      
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFont("helvetica", "normal");
      doc.text(`${d.nome} (${d.ch}h)`, 20, y);
      doc.text(label, 120, y);
      doc.setFont("helvetica", "bold");
      doc.text(`${(calcularFatorModulo(mod, window.estado || {})[status === 'cursar' ? 'chC' : 
                   status === 'complementar' ? 'chComp' : 
                   status === 'dispensada' ? 'chD' : 'chE'])}h`, 160, y, { align: "right" });
      
      y += 7;
    });
    y += 5;
  });
  
  y += 10;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text("Este documento é um resumo informativo. Está sujeito à homologação da Coordenação Pedagógica.", pageWidth / 2, y, { align: "center" });
  
  const nomeArquivo = `aproveitamento_${dadosAluno.nome || "aluno"}_${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.pdf`;
  doc.save(nomeArquivo);
}

function imprimirRelatorio() {
  const results = document.getElementById("results");
  if (results.style.display === "none") {
    alert("Calcule as parcelas primeiro.");
    return;
  }
  
  const nome = document.getElementById("nome").value || "Aluno";
  const mat = document.getElementById("matricula").value || "";
  const old = document.title;
  document.title = `CSM Tec — Aproveitamento — ${nome}${mat ? " (" + mat + ")" : ""}`;
  window.print();
  setTimeout(() => { document.title = old; }, 1000);
}
