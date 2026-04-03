# Calculadora de Aproveitamento de Estudos - CSM Tec

Ferramenta interna para análise de históricos acadêmicos e cálculo financeiro do curso Técnico em Enfermagem.

---

## 🚀 Funcionalidades

- **Carregamento de Histórico**: Imagem (OCR), PDF, Word ou digitação manual
- **Indicador de Progresso**: Barra de progresso em tempo real com fases
- **Timeout Automático**: Evita travamentos (45s imagem, 30s PDF, 20s Word)
- **Feedback de Capacidade**: Mensagens claras quando sistema não consegue processar
- **Matching Automático**: Relaciona disciplinas da origem com o curso destino
- **Classificação Inteligente**: Aplica critérios pedagógicos automaticamente
- **Cálculo Financeiro**: Parcelas, total e economia
- **Relatórios**: Carta de aproveitamento, PDF, impressão
- **Histórico**: Salva atendimentos no navegador (localStorage)

---

## 📁 Estrutura

```
analise_curriculo/
├── index.html          # Interface principal
├── css/
│   └── estilos.css    # Estilos
├── js/
│   ├── dados.js       # Grades curriculares
│   ├── regras.js      # Critérios de análise
│   ├── ui.js          # Renderização de componentes
│   ├── parser.js      # OCR e parsing de arquivos
│   ├── relatorios.js  # Geração de PDF e carta
│   └── app.js         # Lógica principal e estado
├── manual.md          # Guia de uso
├── memoria.md        # Documentação técnica
└── README.md         # Este arquivo
```

---

## 🔧 Tecnologias

| Biblioteca | Uso |
|------------|-----|
| Tesseract.js 5.x | OCR (imagens) |
| PDF.js 3.11 | Extração de PDF |
| mammoth.js 1.6 | Extração de DOCX |
| jsPDF 2.5 | Geração de PDF |

---

## 📖 Como Usar

1. Abra `index.html` no navegador
2. Preencha os dados do aluno
3. Carregue o histórico acadêmico (imagem/PDF/Word/manual)
4. Observe o progresso do processamento
5. Se houver timeout, use a digitação manual
6. Revise o matching automático
7. Ajuste classificações se necessário
8. Calcule as parcelas
9. Gere o relatório

Consulte [manual.md](./manual.md) para instruções detalhadas.

---

## ⏱️ Tempo de Processamento

| Tipo | Tempo Limite | Tempo Típico (PC) |
|------|--------------|-------------------|
| Imagem (OCR) | 45s | 10-30s |
| PDF | 30s | 2-10s |
| Word | 20s | 1-5s |

---

## 📋 Critérios de Análise

| Carga Horária | Status | Cobrança |
|---------------|--------|----------|
| ≥ 75% | Dispensada | 0% |
| 40% - 75% | Complementar | 1/3 |
| < 40% | Cursar | 100% |

---

## 🔌 Próximos Passos

- [ ] Implementar banco de dados
- [ ] Adicionar outros cursos
- [ ] Melhorar OCR com cache
- [ ] Autenticação de usuários
- [ ] Backup em nuvem

---

## 📄 Licença

Uso interno - CSM Tec Santa Mônica

---

**Versão:** 2.1  
**Atualizado:** 2026-04-03
