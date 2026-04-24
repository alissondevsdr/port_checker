# 🛠️ Suporte HUB — Inovar

> **Plataforma web interna para equipes de suporte técnico** — monitoramento de portas, gestão de clientes, conexões remotas e tratamento de planilhas fiscais. Novas funcionalidades estão continuamente sendo desenvolvidas e serão lançadas em breve.

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Funcionalidades Atuais](#-funcionalidades-atuais)
- [Arquitetura](#-arquitetura)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Pré-requisitos](#-pré-requisitos)
- [Configuração e Instalação](#-configuração-e-instalação)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Banco de Dados](#-banco-de-dados)
- [Executando o Projeto](#-executando-o-projeto)
- [Deploy com PM2](#-deploy-com-pm2)
- [API Reference](#-api-reference)
- [Funcionalidades em Desenvolvimento](#-funcionalidades-em-desenvolvimento)
- [Contribuição](#-contribuição)

---

## 🔍 Visão Geral

**Suporte HUB** é uma aplicação web full-stack desenvolvida para centralizar e facilitar o trabalho diário de equipes de suporte técnico. A plataforma permite monitorar a disponibilidade de portas TCP em hosts de clientes, gerenciar informações de acesso remoto e padronizar planilhas fiscais de produtos — tudo em uma interface moderna, rápida e acessível na rede local.

A aplicação é composta por um **backend Node.js/Express** com banco de dados **MySQL** e um **frontend React** com **Tailwind CSS**, ambos comunicando-se via API REST.

---

## ✅ Funcionalidades Atuais

### 1. 📡 Port Checker — Monitoramento de Portas TCP

O módulo central da plataforma. Permite cadastrar clientes (empresas/filiais) e verificar em tempo real se determinadas portas TCP estão abertas e respondendo.

**Grupos**
- Organize clientes em grupos por região, segmento ou qualquer critério
- Visualize o resumo de status de cada grupo (quantos OK, com erro, pendentes)
- Teste todas as portas de todos os clientes de um grupo com um clique
- Alerta visual para clientes com portas fechadas, com botão de detalhamento

**Clientes**
- Cadastro completo: nome/razão social, CNPJ, telefone, host, portas, grupo, IP interno e provedor de internet
- Busca automática de dados pelo CNPJ via APIs públicas (BrasilAPI / publica.cnpj.ws)
- Formatação automática de CNPJ e telefone no formulário
- Teste individual de portas por cliente
- Exibição de status (OK / ERRO / PENDENTE), latência média e data do último teste
- Chips coloridos por porta mostrando se está aberta (✓) ou fechada (✗)
- Link direto para WhatsApp do telefone cadastrado
- Ordenação por nome, status, último teste ou latência
- Filtros por grupo e por status

**Motor de Testes**
- Conexão TCP real via `net.Socket` — sem dependência de ICMP/ping
- Timeout configurável (padrão: 5 segundos)
- Teste paralelo de todas as portas de um cliente simultaneamente
- Registro de logs detalhados por porta no banco de dados
- Cálculo de latência média considerando apenas portas abertas

---

### 2. 🖥️ Conexões Remotas

Gerencie os dados de acesso remoto dos seus clientes em um único lugar.

- Cadastre conexões do tipo **AnyDesk** ou **Rustdesk**
- Armazene o ID/string de conexão por empresa
- Busca por nome de empresa, string de conexão ou tipo
- Edição e exclusão com confirmação

---

### 3. 📊 Formatador de Planilhas Fiscais

Ferramenta para padronizar planilhas de produtos desorganizadas no formato exigido pelo sistema de gestão da empresa.

- Suporte a dois modos de tributação:
  - **SIMPLES NACIONAL** — 10 colunas (Código, Cód.Barra, Referência, NCM, Descrição, CSOSN, Class., CEST, IPPT, Sit. Trib. do ECF)
  - **NORMAL** — 24 colunas (acima + CST, ICMS, IPI, PIS, COFINS, ICMS ST, MVA e variantes de entrada/saída)
- Upload por clique ou **drag & drop**
- Detecção inteligente de colunas por nome exato, normalização (sem acentos) e aliases configuráveis
- Remove colunas desnecessárias, reordena e renomeia automaticamente
- Exibe contagem de linhas válidas e linhas removidas (sem código de produto)
- Download do arquivo `.xlsx` formatado com estilo visual idêntico ao template oficial (cores, fontes Tahoma 8pt, bordas, alinhamentos)
- Download do **template padrão** para referência
- Validação de tipo e tamanho de arquivo (máx. 10 MB)

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                     REDE LOCAL                       │
│                                                      │
│  ┌──────────────┐        ┌──────────────────────┐   │
│  │   Frontend   │◄──────►│      Backend         │   │
│  │  React/Vite  │  HTTP  │   Node.js/Express    │   │
│  │  :5173       │        │   :3001              │   │
│  └──────────────┘        └──────────┬───────────┘   │
│                                     │               │
│                           ┌─────────▼──────────┐   │
│                           │      MySQL          │   │
│                           │   portchecker DB    │   │
│                           └────────────────────┘   │
│                                                      │
│  Clientes na rede ←── Port Check (TCP Socket) ──►   │
│                         Hosts monitorados           │
└─────────────────────────────────────────────────────┘
```

O frontend se comunica com o backend via Axios. Em desenvolvimento, o Vite faz proxy das rotas `/api` para o backend. Em produção, o CORS é configurado para aceitar as origens da rede interna.

---

## 📁 Estrutura do Projeto

```
tools-inovar/
│
├── backend/                        # Servidor Node.js
│   ├── src/
│   │   ├── database/
│   │   │   └── connection.ts       # Pool MySQL + inicialização do schema
│   │   ├── models/
│   │   │   └── types.ts            # Interfaces TypeScript (Client, Group, etc.)
│   │   ├── routes/
│   │   │   └── api.ts              # Todas as rotas REST da aplicação
│   │   ├── services/
│   │   │   ├── api.ts              # Cliente Axios interno (não usado em prod)
│   │   │   ├── cnpjService.ts      # Consulta CNPJ em APIs públicas
│   │   │   ├── excelCleaner.ts     # Processamento e formatação de planilhas
│   │   │   ├── excelTemplate.ts    # Definição de templates e detecção de colunas
│   │   │   └── networkService.ts   # Verificação de portas TCP
│   │   └── server.ts               # Entry point — Express + CORS + inicialização
│   ├── dist/                       # Compilado TypeScript (gerado pelo build)
│   ├── .env                        # Variáveis de ambiente (não versionado)
│   ├── env.example                 # Exemplo de variáveis de ambiente
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                       # Aplicação React
│   ├── src/
│   │   ├── components/
│   │   │   ├── ClientModal.tsx     # Modal de criação/edição de cliente
│   │   │   ├── RemoteConnectionModal.tsx
│   │   │   └── Sidebar.tsx         # Navegação lateral
│   │   ├── services/
│   │   │   └── api.ts              # Funções de chamada à API (Axios)
│   │   ├── views/
│   │   │   ├── Clients.tsx         # Listagem e gestão de clientes
│   │   │   ├── Dashboard.tsx       # Dashboard geral (visão de infra)
│   │   │   ├── Groups.tsx          # Grupos + detalhamento por grupo
│   │   │   ├── RemoteConnections.tsx
│   │   │   ├── Reports.tsx         # Histórico de testes
│   │   │   └── SpreadsheetCleaner.tsx
│   │   ├── App.tsx                 # Roteamento principal
│   │   ├── index.css               # Design system (Tailwind + custom tokens)
│   │   └── main.tsx
│   ├── public/
│   ├── .env                        # VITE_API_URL (não versionado)
│   ├── env.example
│   ├── package.json
│   ├── tsconfig.app.json
│   └── vite.config.ts
│
├── package.json                    # Scripts raiz (dev com concurrently)
├── pm2.config.js                   # Configuração de produção com PM2
└── .gitignore
```

---

## 🔧 Tecnologias Utilizadas

### Backend
| Tecnologia | Versão | Uso |
|---|---|---|
| Node.js | ≥ 18 | Runtime |
| TypeScript | 6.x | Tipagem estática |
| Express | 5.x | Framework HTTP |
| mysql2 | 3.x | Driver MySQL com suporte a Promises |
| ExcelJS | 4.x | Geração de arquivos `.xlsx` formatados |
| XLSX (SheetJS) | 0.18 | Leitura de arquivos Excel enviados |
| Axios | 1.x | Consultas externas (CNPJ) |
| dotenv | 17.x | Variáveis de ambiente |
| tsx | — | Execução TypeScript em dev (watch mode) |

### Frontend
| Tecnologia | Versão | Uso |
|---|---|---|
| React | 19.x | UI framework |
| TypeScript | 6.x | Tipagem estática |
| Vite | 8.x | Build tool + dev server |
| Tailwind CSS | 4.x | Estilização utilitária |
| Axios | 1.x | Chamadas HTTP à API |
| Lucide React | 1.x | Ícones SVG |
| clsx + tailwind-merge | — | Utilitários de classes CSS |

### Infraestrutura / DevOps
| Ferramenta | Uso |
|---|---|
| MySQL | Banco de dados relacional |
| PM2 | Gerenciador de processos em produção |
| concurrently | Rodar frontend e backend juntos em dev |

---

## 📦 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** `>= 20.x` (recomendado: LTS)
- **npm** `>= 10.x`
- **MySQL** `>= 8.0` (rodando localmente ou em servidor acessível)
- **PM2** (apenas para produção): `npm install -g pm2`

---

## ⚙️ Configuração e Instalação

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd tools-inovar
```

### 2. Instale as dependências do Backend

```bash
cd backend
npm install
```

### 3. Instale as dependências do Frontend

```bash
cd ../frontend
npm install
```

### 4. Instale as dependências raiz (opcional, para `concurrently`)

```bash
cd ..
npm install
```

---

## 🔐 Variáveis de Ambiente

### Backend (`backend/.env`)

Crie o arquivo a partir do exemplo:

```bash
cp backend/env.example backend/.env
```

Edite com suas configurações:

```env
# Porta do servidor Express
PORT=3001

# URL do frontend (para configuração do CORS)
FRONTEND_URL=http://localhost:5173

# Configurações do banco de dados MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha_aqui
DB_DATABASE=toolsinovar
DB_PORT=3306
```

### Frontend (`frontend/.env`)

```bash
cp frontend/env.example frontend/.env
```

```env
# URL base da API backend
# Em desenvolvimento, o Vite proxy já resolve /api → localhost:3001
# Use esta variável apenas se o backend estiver em outro servidor
VITE_API_URL=http://localhost:3001/api
```

> **Nota:** Em desenvolvimento, o `vite.config.ts` já configura proxy para `/api → http://localhost:3001`, portanto a variável `VITE_API_URL` não é necessária. Em produção, configure com o IP/domínio do servidor backend.

---

## 🗄️ Banco de Dados

A aplicação **cria automaticamente todas as tabelas** ao iniciar, via `initializeSchema()`. Basta ter o banco de dados vazio criado:

```sql
CREATE DATABASE portchecker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Tabelas criadas automaticamente

#### `groups`
Agrupa clientes por qualquer critério organizacional.
```
id | name | created_at
```

#### `clients`
Registra todos os clientes monitorados.
```
id | name | cnpj | phone | host | ports | group_id | ip_interno | provedor_internet | status | last_test | avg_response_ms | created_at
```
- `ports`: armazenado como string separada por vírgulas (ex: `"80,443,3389"`)
- `status`: `'PENDING'` | `'OK'` | `'ERROR'`
- `avg_response_ms`: média de latência das portas abertas no último teste

#### `test_logs`
Histórico de cada execução de teste.
```
id | client_id | client_name | timestamp | status | duration_ms | details
```
- `details`: JSON com array de resultados por porta

#### `port_results`
Resultado individual por porta em cada teste.
```
id | log_id | port | is_open | response_ms | error
```

#### `remote_connections`
Dados de acesso remoto dos clientes.
```
id | company_name | connection_string | connection_type | created_at | updated_at
```

---

## 🚀 Executando o Projeto

### Desenvolvimento (ambos ao mesmo tempo)

Na raiz do projeto:

```bash
npm run dev
```

Isso inicia o backend em `http://localhost:3001` e o frontend em `http://localhost:5173` simultaneamente com hot reload.

### Somente o Backend

```bash
cd backend
npm run dev
```

### Somente o Frontend

```bash
cd frontend
npm run dev
```

O frontend ficará disponível em `http://localhost:5173` e também em `http://<seu-ip-local>:5173` para acesso pela rede.

### Build de Produção

**Backend:**
```bash
cd backend
npm run build
# Gera os arquivos em backend/dist/
```

**Frontend:**
```bash
cd frontend
npm run build
# Gera os arquivos em frontend/dist/
```

---

## 📦 Deploy com PM2

O arquivo `pm2.config.js` na raiz configura dois processos:

| Processo | Descrição | Porta |
|---|---|---|
| `tools-backend` | Servidor Node.js compilado | 3001 |
| `tools-frontend` | `serve` servindo o build estático | 5173 |

### Passos para deploy

```bash
# 1. Build do backend
cd backend && npm run build && cd ..

# 2. Build do frontend
cd frontend && npm run build && cd ..

# 3. Iniciar com PM2
pm2 start pm2.config.js

# 4. Salvar para reiniciar com o sistema
pm2 save
pm2 startup
```

### Comandos úteis do PM2

```bash
pm2 status              # Ver status dos processos
pm2 logs                # Ver logs em tempo real
pm2 logs tools-backend  # Logs apenas do backend
pm2 restart all         # Reiniciar todos
pm2 stop all            # Parar todos
pm2 delete all          # Remover todos os processos
```

Os logs ficam em:
- `backend/logs/backend-error.log`
- `backend/logs/backend-out.log`
- `frontend/logs/frontend-error.log`
- `frontend/logs/frontend-out.log`

---

## 📡 API Reference

Base URL: `http://localhost:3001/api`

### Health Check

```
GET /health
```
Retorna `{ status: "ok", timestamp: "..." }`

---

### Grupos

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/groups` | Lista todos os grupos com contagem de clientes e status |
| `POST` | `/groups` | Cria um novo grupo `{ name }` |
| `DELETE` | `/groups/:id` | Remove o grupo (clientes ficam sem grupo) |
| `POST` | `/groups/:id/test` | Testa todos os clientes do grupo |

---

### Clientes

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/clients` | Lista clientes (aceita `?group_id=N`) |
| `POST` | `/clients` | Cria cliente |
| `PUT` | `/clients/:id` | Atualiza cliente |
| `DELETE` | `/clients/:id` | Remove cliente |
| `POST` | `/clients/:id/test` | Testa portas do cliente |
| `POST` | `/clients/test-all` | Testa todos os clientes |

**Payload de criação/atualização de cliente:**
```json
{
  "name": "Empresa Exemplo",
  "cnpj": "12345678000195",
  "phone": "51999998888",
  "host": "192.168.1.100",
  "ports": [80, 443, 3389],
  "group_id": 1,
  "ip_interno": "10.0.0.5",
  "provedor_internet": "Claro"
}
```

---

### Conexões Remotas

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/remote-connections` | Lista todas as conexões |
| `POST` | `/remote-connections` | Cria conexão |
| `PUT` | `/remote-connections/:id` | Atualiza conexão |
| `DELETE` | `/remote-connections/:id` | Remove conexão |

**Payload:**
```json
{
  "company_name": "Empresa X",
  "connection_string": "123456789",
  "connection_type": "AnyDesk"
}
```

---

### CNPJ

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/cnpj/:cnpj` | Busca dados do CNPJ na Receita Federal |

Retorna: `{ razao_social, nome_fantasia, logradouro, numero, municipio, uf, bairro }`

---

### Excel / Planilhas

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/excel/process` | Processa planilha (corpo: `{ file: base64, mode: "simples"\|"normal" }`) |
| `GET` | `/excel/template` | Download do template padrão (`?mode=simples\|normal`) |

---

<div align="center">

**Suporte HUB** · Desenvolvido para otimizar o trabalho da equipe técnica

🚀 *Novas funcionalidades chegando em breve!*

</div>
