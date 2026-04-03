# Manual da Calculadora de Aproveitamento - CSM Tec

**Versão:** 2.1  
**Última atualização:** 2026-04-03  
**Autor:** Equipe de Desenvolvimento

---

## 1. Visão Geral

A Calculadora de Aproveitamento de Estudos é uma ferramenta interna da equipe comercial do CSM Tec para analisar históricos acadêmicos de alunos Transferentes e realizar cálculo financeiro do curso técnico.

**Funcionalidades principais:**
- Carregamento de histórico acadêmico (imagem, PDF, Word ou manual)
- Matching automático de disciplinas
- Classificação das disciplinas conforme critérios pedagógicos
- Cálculo de parcelas e economia financeira
- Geração de relatórios e cartas de aproveitamento

---

## 2. Seções da Interface

### 2.1 Dados do Aluno

Campos obrigatórios:
| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| Nome completo | Nome do aluno | Larissa de Morais Félix |
| Matrícula | Número de matrícula no CSM Tec | ENF240253 |
| Instituição de origem | Escola de origem do aluno | Grau Técnico |
| Valor da matrícula (R$) | Valor da primera parcela | 370,00 |
| Mensalidade (R$) | Valor das mensalidades | 370,00 |

### 2.2 Carregar Histórico Acadêmico

Esta seção permite importar as disciplinas do histórico do aluno através de 4 métodos:

#### 2.2.1 Upload de Imagem
- **Formatos aceitos:** JPG, PNG, GIF, WEBP
- **Processo:** Utiliza OCR (Optical Character Recognition) via Tesseract.js
- **Limitações:**
  - Imagens de baixa qualidade podem não ser processadas corretamente
  - Recomendado usar imagens com resolução mínima de 300dpi
  - O texto deve estar legível e sem sombras
- **Como usar:**
  1. Clique na área ou arraste a imagem
  2. Aguarde o processamento (pode levar alguns segundos)
  3. Revise as disciplinas detectadas
  4. Clique em "Aplicar ao Curso"

#### 2.2.2 Upload de PDF
- **Formato aceito:** PDF
- **Processo:** Extrai texto do PDF e parser para identificar disciplinas
- **Limitações:**
  - PDFs scaneados funcionam como imagens (requer boa qualidade)
  - PDFs com texto selecionável têm melhor precisão
- **Como usar:**
  1. Clique na área ou arraste o arquivo PDF
  2. Aguarde a extração de texto
  3. Revise as disciplinas detectadas

#### 2.2.3 Upload de Word
- **Formatos aceitos:** DOC, DOCX
- **Processo:** Converte para texto e parseia disciplinas
- **Limitações:**
  - Formatação complexa pode afectar a extração
  - Tabelas são ignoradas
- **Como usar:**
  1. Clique na área ou arraste o arquivo
  2. Aguarde o processamento
  3. Revise as disciplinas detectadas

#### 2.2.4 Digitação Manual
- **Uso recomendado:** Quando os métodos acima falham ou para adicionar disciplinas específicas
- **Como usar:**
  1. Selecione a aba "Manual"
  2. Digite o nome da disciplina
  3. Digite a carga horária
  4. Clique em "Adicionar"
  5. Repita para todas as disciplinas

### 2.3 Curso

Permite selecionar o curso de destino. Atualmente disponível:
- **Técnico em Enfermagem** - Curso padrão do sistema

### 2.4 Grade Curricular

Esta seção exibe todas as disciplinas do curso dividido por módulos.

**Legenda de status:**
| Status | Cor | Descrição |
|--------|-----|-----------|
| Cursará | 🔴 Vermelho | Disciplina será cursada integralmente |
| Complementar | 🟡 Amarelo | Avaliação complementar (cobra 1/3 da mensalidade) |
| Dispensada | 🟢 Verde | Disciplina dispensada (equivalência ≥75%) |
| Ag. Ementas | 🔵 Azul | Aguardando análise das ementas |

**Como classificar:**
1. Para cada disciplina, clique no botão correspondente ao status
2. O sistema atualiza automaticamente o cálculo
3. Opcional: adicione observações no campo de texto

### 2.5 Resultados

Exibe o resumo financeiro do aproveitamento:

**Por módulo:**
- Número de parcelas
- Valor de cada parcela
- Total por módulo

**Geral:**
- Total a pagar
- Número de parcelas
- Duração do curso
- Economia em relação ao curso sem aproveitamento

**Detalhamento:**
- Breakdown completo por parcela
- Identificação do módulo de cada parcela

---

## 3. Critérios de Análise

O sistema utiliza as seguintes regras para classificar automaticamente as disciplinas:

### 3.1 Regras de Classificação

| Carga Horária | Status | Justificativa |
|---------------|--------|---------------|
| ≥ 75% do curso destino | Dispensada | Equivalência ≥75% da C/H |
| 40% - 75% do curso destino | Complementar | Requer avaliação complementar |
| < 40% do curso destino | Cursar | Carga horária insuficiente |

### 3.2 Cálculo Financeiro

- **Dispensada:** 0% da mensalidade
- **Complementar:** 1/3 (33,33%) da mensalidade
- **Cursar:** 100% da mensalidade
- **Ag. Ementas:** 1/3 (33,33%) da mensalidade (provisório)

### 3.3 Duração do Curso

- O aproveitamento **não altera** o prazo de conclusão
- O aluno integraliza junto com a turma
- Há redução proporcional da frequência nas disciplinas dispensadas

---

## 4. Fluxo de Uso

### 4.1 Fluxo Completo

```
1. Abrir a ferramenta
2. Preencher dados do aluno (nome, matrícula, origem)
3. Carregar histórico acadêmico
4. Revisar matching automático
5. Ajustar classificações se necessário
6. Clicar em "Calcular Parcelas"
7. Revisar resultados
8. Gerar relatório/carta
9. Salvar no histórico
```

### 4.2 Exemplo Prático

1. **Dados do aluno:**
   - Nome: João Silva
   - Matrícula: ENF240300
   - Origem: Escola Técnica Estadual

2. **Carregar histórico:**
   - Faz upload de imagem do histórico
   - Sistema detecta 5 disciplinas
   - Matching automático sugere 3 dispensadas, 2 complementares

3. **Revisão:**
   - Operador ajusta 1 classificação
   - Sistema recalcula automaticamente

4. **Resultado:**
   - Total: R$ 4.500,00 (era R$ 10.730,00)
   - Economia: R$ 6.230,00
   - Parcelas: 15 (era 28)

5. **Relatório:**
   - Gera carta para o aluno

---

## 5. Relatórios

### 5.1 Imprimir / Salvar PDF
- Gera relatório para impressão (Ctrl+P)
- Oculta elementos de navegação
- Layout otimizado para A4

### 5.2 Copiar Resumo
- Copia resumo formatado para clipboard
- Formato texto para fácil colagem em emails

### 5.3 Carta de Aproveitamento
- Documento formal para o aluno
- Lista todas as disciplinas por categoria
- Inclui condições financeiras
- Abre em nova aba para impressão

### 5.4 Exportar PDF
- Gera PDF oficial para download
- Incluye logo e formatação profissional

---

## 6. Histórico

O sistema salva automaticamente os atendimentos no localStorage do navegador.

**Funcionalidades:**
- Visualizar atendimentos anteriores
- Recarregar atendimento para edição
- Remover atendimentos
- Limite de 50 registros

**Persistência:**
- Os dados ficam no navegador do usuário
- Não são enviados para nenhum servidor
- Limpeza do cache apaga o histórico

---

## 7. Glossário

| Termo | Significado |
|-------|-------------|
| C/H | Carga Horária |
| OCR | Optical Character Recognition (Reconhecimento Óptico de Caracteres) |
| Matching | Processo de relacionar disciplinas de diferentes cursos |
| Complementar | Avaliação que substituirá parte da disciplina |
| Ementas | Plano de ensino da disciplina |
| Dispensa | Isenção de cursar a disciplina |

---

## 8. Solução de Problemas

### 8.1 OCR não reconhece texto
- **Causa:** Imagem de baixa qualidade ou texto illegível
- **Solução:** Use imagem mais clara ou digite manualmente

### 8.2 Matching incorreto
- **Causa:** Nomes de disciplinas muito diferentes
- **Solução:** Ajuste manualmente após o matching

### 8.3 Histórico não salva
- **Causa:** localStorage cheio ou desabilitado
- **Solução:** Limpe dados de navegação ou use outro navegador

### 8.4 PDF não gera
- **Causa:** Biblioteca jsPDF não carregou
- **Solução:** Use a opção "Imprimir / Salvar PDF" como alternativa

### 8.5 Pop-ups bloqueados
- **Causa:** Gerador de carta detectado como pop-up
- **Solução:** Permita pop-ups para o site nas configurações do navegador

---

## 9. Limitações Conhecidas

### 9.1 Ambiente de Hospedagem
Ao usar a calculadora em hospedagem online (como GitHub Pages):
- Alguns navegadores podem bloquear a geração de pop-ups para a carta de aproveitamento
- A função de copiar resumo usa método alternativo quando a API de clipboard não está disponível

### 9.2 Navegadores Suportados
- Chrome/Edge (recomendado)
- Firefox
- Safari

### 9.3 Dispositivos
- **Desktop**: Funcionalidade completa
- **Mobile**: Limitado (OCR pode ser lento)

---

## 10. Contato e Suporte

Para dúvidas ou problemas, contacte a equipe de desenvolvimento.

**Versão do documento:** 2.1
