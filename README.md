# Calculadora de Aproveitamento de Estudos - CSM Tec

Ferramenta interna para análise de históricos acadêmicos e cálculo financeiro do curso Técnico em Enfermagem.

---

## 🚀 Funcionalidades

- **Carregamento de Histórico**: Imagem (OCR), PDF, Word ou digitação manual
- **Matching Automático**: Relaciona disciplinas da origem com o curso destino
- **Classificação Inteligente**: Aplica critérios pedagógicos automaticamente
- **Cálculo Financeiro**: Parcelas, total e economia
- **Relatórios**: Carta de aproveitamento, PDF, impressão
- **Histórico**: Salva atendimentos no navegador

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
3. Carregue o histórico acadêmico
4. Revise o matching automático
5. Ajuste classificações se necessário
6. Calcule as parcelas
7. Gere o relatório

Consulte [manual.md](./manual.md) para instruções detalhadas.

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
- [ ] Melhorar OCR
- [ ] Autenticação de usuários
- [ ] Backup em nuvem

---

## 📄 Licença

Uso interno - CSM Tec Santa Mônica

---

**Versão:** 2.0  
**Atualizado:** 2026-04-03
