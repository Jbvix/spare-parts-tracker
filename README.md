# ⚓ SPARES-CHAIN — Sistema de Rastreabilidade de Sobressalentes

<p align="center">
  <strong>Cadeia de custódia blockchain para gestão de peças sobressalentes em rebocadores ASD</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-6.3-blue" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
  <img src="https://img.shields.io/badge/tech-HTML%20%7C%20CSS%20%7C%20JS-orange" alt="Tech">
  <img src="https://img.shields.io/badge/zero-dependencies-brightgreen" alt="Zero Dependencies">
</p>

---

## 📋 Sobre

**SPARES-CHAIN** é um sistema interativo de rastreabilidade de peças sobressalentes para embarcações marítimas com propulsão azimutal (Azimuth Stern Drive). Simula uma cadeia de custódia completa inspirada em blockchain, cobrindo todo o ciclo de vida da peça — do recebimento ao descarte.

### Problema que resolve

Em operações marítimas, peças sobressalentes transitam entre múltiplos responsáveis (almoxarifado, transportadora, bordo). Sem rastreabilidade, garantias são invalidadas, fiscalizações falham e a conformidade é comprometida. O SPARES-CHAIN digitaliza esse fluxo com registro imutável de cada movimentação.

---

## 🔄 Fluxo de Custódia (7 Etapas)

```
FORNECEDOR → ALMOXARIFADO → TRANSPORTADORA → BORDO → INSTALAÇÃO → REMOÇÃO → DESCARTE
                 📦              🚚              🚢        ⚙️          🗑️        📄
              RECEBIDA        COLETADA        ENTREGUE   INSTALADA    REMOVIDA   DD-XXXX
```

| Etapa | Responsável | Ação |
|-------|-------------|------|
| 1. RECEBIDA | Almoxarife | Registra peça e gera QR Code |
| 2. COLETADA | Transportadora | Coleta no almoxarifado (scan obrigatório) |
| 3. ENTREGUE | Transportadora | Entrega a bordo (scan obrigatório) |
| 4. INSTALADA | Chefe de Máquinas | Instala no motor com registro de horas |
| 5. REMOVIDA | Chefe de Máquinas | Remove → quarentena automática |
| 6. COLETADA | Transportadora | Logística reversa |
| 7. DESCARTADA | Sistema | Documento DD-XXXX gerado |

---

## 👥 Papéis no Sistema

| Papel | Acesso | Responsabilidade |
|-------|--------|-----------------|
| 🏭 **Almoxarife** | Recebimento, scanner | Registra peças de fornecedores, gera QR |
| 🚚 **Transportadora** | Coleta, entrega, logística reversa | Transporte com scan obrigatório em cada ponta |
| ⚙️ **Chefe de Máquinas** | Instalação, remoção, prateleiras | Opera nos motores, gerencia estoque de bordo |
| 🔍 **Auditor** | Visualização total | Fiscaliza conformidade, identifica não-conformidades |

---

## ✨ Funcionalidades

- **Drag & Drop** — arraste peças entre painéis para simular movimentações
- **Scanner QR Code** — animação de escaneamento com validação
- **Dashboard KPIs** — total de peças, scans, trânsito, instaladas, quarentena, descartadas, conformidade
- **Análise de Conformidade** — detecta operações sem escaneamento obrigatório
- **Cadeia de Custódia Tripla** — ALMOX → TRANSPORTADORA → BORDO
- **Quarentena** — peças removidas vão direto para zona de quarentena
- **Logística Reversa** — transportadora coleta resíduos e gera documento DD-XXXX
- **Log Blockchain** — registro cronológico imutável de todos os eventos
- **Menu de Contexto** — clique direito em peças para ações rápidas
- **Persistência localStorage** — dados sobrevivem ao recarregar a página
- **Reset Total** — limpa todo o sistema com dupla confirmação
- **Responsivo** — funciona em desktop e mobile

---

## 🚀 Como Usar

1. **Abra** `index.html` em qualquer navegador moderno
2. **Feche** o modal de boas-vindas
3. **Faça login** com nome, papel e local/empresa
4. **Interaja** arrastando peças entre os painéis conforme seu papel

> Não requer servidor, build, nem dependências. Basta abrir o `index.html` no navegador.

---

## 🛠️ Stack Técnica

| Componente | Tecnologia |
|------------|-----------|
| Estrutura | HTML5 semântico |
| Estilo | CSS3 (grid, flexbox, gradients, animations, backdrop-filter) |
| Lógica | JavaScript vanilla (ES6+) |
| Persistência | localStorage |
| Dependências | **Zero** |

---

## 📁 Estrutura

```
SPARES-CHAIN/
├── index.html         # Estrutura HTML principal
├── css/
│   └── styles.css     # Estilos (grid, animações, temas)
├── js/
│   ├── app.js         # Bootstrap / Inicialização
│   ├── store.js       # Estado global e persistência (localStorage)
│   ├── ui.js          # Criação de painéis e elementos
│   ├── handlers.js    # Drag & Drop, ações, menu de contexto
│   ├── compliance.js  # Modais de conformidade, histórico, descarte
│   ├── icons.js       # Sistema de ícones SVG (Lucide/Feather)
│   └── utils.js       # Funções utilitárias (hash, escape, etc.)
├── LICENSE            # MIT License
└── README.md
```

---

## 🔒 Segurança

- Sanitização de inputs via `escapeHtml()` para prevenção de XSS
- Controle de acesso por papel (operações restritas por função)
- Dupla confirmação para ações destrutivas (reset)

---

## 📊 Conceitos Aplicados

- **Chain of Custody** — cadeia de custódia rastreável
- **Compliance Tracking** — rastreamento de conformidade
- **Three-Party Handoff** — transferência tripla com escaneamento
- **Anomaly Detection** — detecção de não-conformidades
- **Blockchain Logging** — registro imutável de eventos com hash

---

## 🗓️ Changelog

### v6.3 — 06 de Abril de 2026
- **Arquitetura modular** — código separado em 7 módulos JS + CSS externo
- **Ícones SVG profissionais** — todos os emojis substituídos por ícones Lucide/Feather
- **Gerenciamento de estado global** — store centralizado com persistência localStorage
- **Correções de CSS** — especificidade do `.hidden` corrigida com `!important`
- **Ordem de carregamento** — scripts reorganizados para dependências corretas

### v6.2 — 09 de Outubro de 2025
- Peças removidas vão direto para quarentena
- Botão RESET para limpar sistema
- Tutorial interativo de boas-vindas

---

## 👤 Autor

**Jossian Brito**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-jossianbrito-blue?logo=linkedin)](https://linkedin.com/in/jossianbrito)
[![X](https://img.shields.io/badge/X-@jossiancosta-black?logo=x)](https://x.com/jossiancosta)
[![Medium](https://img.shields.io/badge/Medium-@jossiancosta-black?logo=medium)](https://medium.com/@jossiancosta)

---

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE).