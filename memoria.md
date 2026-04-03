# Memória Técnica do Projeto

**Projeto:** Calculadora de Aproveitamento de Estudos - CSM Tec  
**Última atualização:** 2026-04-03  
**Versão do código:** 2.1

---

## 1. Estrutura de Arquivos

```
analise_curriculo/
├── index.html          # Interface principal (entrada)
├── css/
│   └── estilos.css    # Todo o CSS compilado
├── js/
│   ├── dados.js       # Grades curriculares (cursos, disciplinas)
│   ├── regras.js      # Lógica de análise e cálculo
│   ├── ui.js          # Renderização de componentes
│   ├── parser.js     # OCR + parsing de arquivos
│   ├── relatorios.js # Geração de PDF e carta
│   └── app.js        # Estado global e lógica principal
├── assets/           # Recursos estáticos (logo, etc.)
└── manual.md          # Documentação de uso
```

---

## 2. Dependências Externas

Todas as bibliotecas são carregadas via CDN:

| Biblioteca | Versão | URL | Uso |
|------------|--------|-----|-----|
| Tesseract.js | 5.x | cdn.jsdelivr.net/npm/tesseract.js@5 | OCR (reconhecimento de texto em imagens) |
| PDF.js | 3.11.174 | cdnjs.cloudflare.com | Extração de texto de PDFs |
| mammoth.js | 1.6.0 | cdnjs.cloudflare.com | Conversão DOCX → texto |
| jsPDF | 2.5.1 | cdnjs.cloudflare.com | Geração de PDFs |

**Fonte das fonts:**
- Google Fonts: DM Serif Display, DM Sans

---

## 3. Dados dos Cursos

### 3.1 Curso: Técnico em Enfermagem

**Estrutura:**
```javascript
{
  id: "enfermagem",
  nome: "Téc. em Enfermagem",
  duracaoMeses: 27,
  totalParcelas: 28,
  parcelasPorModulo: 9,
  modulos: [
    {
      id: "mod1",
      tag: "Módulo I",
      titulo: "Fundamentos",
      periodo: "Parcelas 1–10",
      totalCH: 410,
      disciplinas: [
        { id, nome, ch, def }
      ]
    },
    // ... mais módulos
  ]
}
```

### 3.2 Adicionar Novo Curso

Para adicionar um novo curso, editar `js/dados.js`:

1. Adicionar entrada no objeto `CURSOS`
2. Definir módulos e disciplinas
3. Cada disciplina precisa de: `id`, `nome`, `ch` (carga horária), `def` (status default)

---

## 4. Regras de Negócio

### 4.1 Critérios de Análise

Constantes definidas em `js/regras.js`:

```javascript
const REGRAS = {
  dispensadaMinimoPercentual: 75,    // >= 75% = dispensada
  complementarMinimoPercentual: 40,  // 40-75% = complementar
  fatorComplementar: 1/3,            // 33,33% da mensalidade
  fatorEmentas: 1/3                  // mesmo que complementar
};
```

### 4.2 Lógica de Cálculo

```
Fator do módulo = (CH_Cursar / CH_Total) 
                 + (CH_Complementar / CH_Total) * 1/3 
                 + (CH_Ementas / CH_Total) * 1/3

Valor parcela módulo = Mensalidade * Fator
```

### 4.3 Cálculo de Economia

```
Curso normal = (28 * mensalidade) + (matrícula - mensalidade)
Economia = Curso normal - Total com aproveitamento
```

---

## 5. Variáveis de Estado

### 5.1 Estado Global (app.js)

```javascript
let cursoAtual = "enfermagem";        // Curso selecionado
let estado = {};                       // { discId: status }
let obsState = {};                      // { discId: observação }
let disciplinasImportadas = [];        // Disciplinas do histórico importado
let matchingResults = [];               // Resultado do matching automático
let history = [];                       // Histórico de atendimentos
let uploadTabAtual = "imagem";          // Aba de upload ativa
```

### 5.2 Status de Disciplinas

| Valor | Significado |
|-------|-------------|
| `"cursar"` | Cursará integralmente |
| `"complementar"` | Avaliação complementar |
| `"dispensada"` | Dispensada |
| `"ementas"` | Aguardando ementas |

### 5.3 Persistência

- **Chave:** `csm_tec_history` no localStorage
- **Formato:** JSON array de atendimentos
- **Limite:** 50 registros

---

## 6. Fluxo de Processamento de Arquivos

### 6.1 Imagem (OCR)
```
Arquivo → Tesseract.js → Texto → parseTextoHistorico() → disciplinas
```

### 6.2 PDF
```
Arquivo → PDF.js → Texto extraído (página a página) → parseTextoHistorico() → disciplinas
```

### 6.3 DOCX
```
Arquivo → mammoth.js → Texto raw → parseTextoHistorico() → disciplinas
```

### 6.4 Matching
```
disciplinasImportadas → matchingDisciplinas() → matchingResults
                           ↓
             Para cada disciplina importada:
             - Calcula similaridade com grade destino
             - Aplica regras de análise (75%, 40%)
             - Retorna status sugerido
```

### 6.5 Sistema de Progresso

O sistema implementa feedback visual em tempo real:

**Fases (PROCESS_PHASES em parser.js):**
```javascript
const PROCESS_PHASES = {
  INIT: { range: [0, 10], text: "Inicializando..." },
  LOAD: { range: [10, 30], text: "Carregando arquivo..." },
  OCR: { range: [30, 70], text: "Reconhecendo texto (OCR)..." },
  PARSE: { range: [70, 85], text: "Analisando disciplinas..." },
  MATCH: { range: [85, 95], text: "Comparando com curso destino..." },
  DONE: { range: [95, 100], text: "Concluído!" }
};
```

**Estrutura do callback de progresso:**
```javascript
{
  percent: 65,
  phase: "Reconhecendo texto (OCR)...",
  estimate: "15-25s",
  elapsed: "8s"
}
```

### 6.6 Timeout

| Tipo de Arquivo | Timeout | Justificativa |
|-----------------|---------|---------------|
| Imagem (OCR) | 45 segundos | OCR é mais pesado |
| PDF | 30 segundos | Extração mais rápida |
| DOCX | 20 segundos | Processamento leve |

**Implementação (parser.js):**
```javascript
async function processWithTimeout(file, tipo, onProgress, processFn) {
  const timeouts = { imagem: 45000, pdf: 30000, doc: 20000 };
  const timeoutMs = timeouts[tipo] || 30000;
  
  return Promise.race([
    processFn(),
    new Promise((_, reject) => setTimeout(() => 
      reject(new Error("timeout: ...")), timeoutMs))
  ]);
}
```

**Tipos de erro:**
- `"não_conseguiu:"` - Sistema não conseguiu processar o documento
- `"timeout:"` - Tempo limite excedido

---

## 7. Funções Principais

### 7.1 parser.js

| Função | Descrição |
|--------|-----------|
| `processImageOCR(file, onProgress)` | OCR de imagem com suporte a progresso |
| `processPDF(file, onProgress)` | Extração de PDF com progresso por página |
| `processDOCX(file)` | Extração de DOCX |
| `parseTextoHistorico(texto)` | Parser genérico de texto |
| `matchingDisciplinas(origem, destino)` | Matching automático |
| `calcularSimilaridade(s1, s2)` | Similaridade entre textos |
| `processWithTimeout(file, tipo, onProgress, processFn)` | Wrapper com timeout |
| `estimateTime(tipo, tamanhoMB)` | Estima tempo baseado no tipo/tamanho |
| `createProgressCallback(onProgress)` | Callback estruturado de progresso |
| `getPhaseFromProgress(progress)` | Retorna fase atual do processo |
| `isCapableError(error)` | Verifica se erro é de capacidade do sistema |

### 7.2 regras.js

| Função | Descrição |
|--------|-----------|
| `analisarDisciplina(chOrigem, chDestino)` | Aplica regras e retorna status |
| `calcularFatorModulo(modulo, estado)` | Calcula fator do módulo |
| `calcularTotalCurso(...)` | Calcula total geral |

### 7.3 ui.js

| Função | Descrição |
|--------|-----------|
| `renderCourseSelector()` | Renderiza seletor de curso |
| `renderGrade()` | Renderiza tabela de disciplinas |
| `renderResults()` | Renderiza resultados |
| `renderHistory()` | Renderiza histórico |
| `renderMatchingResult()` | Renderiza resultado do matching |

### 7.4 relatorios.js

| Função | Descrição |
|--------|-----------|
| `gerarCarta()` | Gera carta de aproveitamento |
| `abrirCarta()` | Abre carta em nova aba |
| `copiarResumo()` | Copia resumo para clipboard |
| `gerarPDF()` | Gera PDF oficial |
| `imprimirRelatorio()` | Impressão via browser |

---

## 8. Decisões Técnicas

### 8.1 Separação de Responsabilidades

- **dados.js**: Apenas dados puros (courses, labels)
- **regras.js**: Lógica de negócio pura (sem DOM)
- **ui.js**: Apenas renderização (sem lógica de negócio)
- **app.js**: Orquestração e estado

### 8.2 Por que Tesseract.js?

- ✅ Gratuito e open source
- ✅ Funciona no navegador (sem backend)
- ✅ Suporte para português
- ❌ Processo pode ser lento (>10s para imagens grandes)

### 8.3 Por que localStorage?

- ✅ Implementação simples
- ✅ Persiste entre sessões
- ✅ Sem necessidade de backend
- ❌ Limite de ~5MB
- ❌ Dados ficam no navegador do usuário

---

## 9. Integrações Futuras

### 9.1 Banco de Dados

Quando migrar para banco de dados:

1. Criar API REST (sugestão: Node.js/Express)
2. Criar endpoints:
   - `POST /api/atendimentos` - Salvar
   - `GET /api/atendimentos` - Listar
   - `GET /api/atendimentos/:id` - Detalhar
   - `PUT /api/atendimentos/:id` - Atualizar
   - `DELETE /api/atendimentos/:id` - Deletar
3. Autenticação (JWT ou similar)
4. Substituir localStorage por chamadas API

### 9.2 Outros Cursos

Para adicionar novos cursos:

1. Editar `js/dados.js`
2. Adicionar objeto do curso
3. Definir módulos e disciplinas
4. Testar com dados reais

### 9.3 OCR Melhorado

Opções para melhorar reconhecimento:
- API Google Cloud Vision (pago)
- API Azure Computer Vision (pago)
- AWS Textract (pago)
- Fine-tuning de modelo local

### 9.4 Backup/Exportação

Para exportar dados:
- JSON: simples serialization de `history`
- CSV: converter array para CSV
- PDF: usar jsPDF com template

---

## 10. Dívidas Técnicas

| Item | Prioridade | Descrição |
|------|------------|-----------|
| Testes unitários | Média | Falta cobertura de testes |
| Validação de input | Alta | Sanitizar entradas do usuário |
| Loading states | Média | Indicadores de carregamento |
| Tratamento de erros | Alta |try/catch mais robusto |
| Acessibilidade | Média | ARIA labels, keyboard nav |
| Mobile responsive | Baixa | Layout já responsivo,mas testar |
| Performance OCR | Média | Otimizar imagens antes do OCR |

---

## 11. Variáveis de Ambiente Futuras

Quando implementar configuração:

```javascript
// config.js
const CONFIG = {
  apiUrl: "https://api.csmtec.com.br",
  storageKey: "csm_tec_history",
  maxHistoryItems: 50,
  cursoDefault: "enfermagem",
  valoresDefault: {
    matricula: 370,
    mensalidade: 370
  }
};
```

---

## 12. Mapa de Navegação

```
index.html
├── Dados do Aluno (form)
├── Carregar Histórico
│   ├── Upload Imagem → input-imagem
│   ├── Upload PDF → input-pdf
│   ├── Upload Word → input-doc
│   └── Manual → manual-nome, manual-ch
├── Course Selector
├── Validation Banner
├── Grade Curricular (table)
├── Results Section
│   ├── Módulos Grid
│   ├── Total Card
│   ├── Economy Banner
│   ├── Parcelas Breakdown
│   └── Action Buttons
└── History Tab
```

---

## 13. Referências

- Tesseract.js: https://tesseract.projectnaptha.com/
- PDF.js: https://mozilla.github.io/pdf.js/
- mammoth.js: https://github.com/mongodb-js/mammoth
- jsPDF: https://github.com/parallax/jsPDF

---

## 14. Contato Técnico

Para dúvidas de implementação, consulte este documento antes de modificar o código.

**Última revisão:** 2026-04-03
**Versão:** 2.1
