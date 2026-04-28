# Plano de Desenvolvimento: Nova Aba de Atendimentos no Suporte HUB

Este documento detalha o planejamento para a criação de uma nova aba de "Atendimentos" no projeto "Suporte HUB", com o objetivo de centralizar o registro e gerenciamento de atendimentos. O desenvolvimento será guiado pelo Gemini CLI, garantindo alinhamento com a arquitetura e identidade visual existentes do projeto.

## 1. Visão Geral e Objetivos

**Objetivo Principal:** Implementar uma funcionalidade completa de registro e acompanhamento de atendimentos, integrada ao sistema "Suporte HUB".

**Alinhamento com o Projeto Existente:**

- **Frontend:** Utilizar React, TypeScript e TailwindCSS, seguindo o padrão de componentes e estilos já estabelecidos (tema escuro, cards arredondados, cores de destaque).

- **Backend:** Utilizar Node.js, Express e MySQL, estendendo a API existente com novos modelos, rotas e controladores para gerenciar os dados de atendimento.

- **Experiência do Usuário:** Manter a navegação intuitiva e a usabilidade presente nas outras seções do Suporte HUB.

## 2. Análise do Projeto Existente (Repositório `tools`)

O repositório `tools` é composto por um frontend em React/TypeScript e um backend em Node.js/Express. A estrutura observada é a seguinte:

### Frontend (`frontend/src`)

- **`App.tsx`****:** Componente principal que gerencia o estado de autenticação e a navegação entre as páginas (`home`, `port-checker`, `remote-connections`, etc.) através do componente `Sidebar`.

- **`components/Sidebar.tsx`****:** Componente de navegação lateral que define as rotas e seus ícones. A nova aba de atendimentos será adicionada aqui.

- **`views/`****:** Contém os componentes de página para cada funcionalidade (ex: `Clients.tsx`, `Dashboard.tsx`). Uma nova view será criada para os atendimentos.

- **Estilo:** Utiliza TailwindCSS para estilização, com um tema escuro predominante e cores de destaque específicas (vermelho).

### Backend (`backend/src`)

- **`routes/api.ts`****:** Define as rotas da API, com separação por funcionalidade (auth, groups, clients, remote-companies, etc.). Novas rotas serão adicionadas para os atendimentos.

- **`controllers/`****:** Contém a lógica de negócio para cada rota (ex: `AuthController.ts`, `ClientController.ts`). Um novo controlador será criado para os atendimentos.

- **`models/types.ts`****:** Define as interfaces TypeScript para os modelos de dados (ex: `Group`, `Client`, `TestLog`). Novos tipos serão adicionados para os atendimentos.

- **`database/connection.ts`****:** Gerencia a conexão com o banco de dados MySQL.

## 3. Funcionalidades Detalhadas da Nova Aba "Atendimentos"

### 3.1. Frontend

#### 3.1.1. Integração com a Navegação

- Adicionar um novo item à constante `NAV` em `frontend/src/components/Sidebar.tsx` com `id: "atendimentos"`, `label: "Atendimentos"` e um ícone relevante (ex: `MessageSquare` ou `Headphones` do `lucide-react`).

- Adicionar um novo item à constante `NAV` em `frontend/src/components/Sidebar.tsx` com `id: "configuracoes-atendimento"`, `label: "Config. Atendimento"` e um ícone relevante (ex: `Settings` do `lucide-react`).

- Atualizar `App.tsx` para renderizar o novo componente `AtendimentosView` quando `active === 'atendimentos'` e `ConfiguracoesAtendimentoView` quando `active === 'configuracoes-atendimento'`.

#### 3.1.2. Dashboard de Atendimentos (Baseado em `image.png` e `image5.png`)

- **Componente:** `frontend/src/views/AtendimentosView.tsx`.

- **Layout:** Dividido em seções: Estatísticas no topo, "Meus Atendimentos em Aberto", "Todos Atendimentos em Aberto", e um feed de "Atividade" ou "Últimos 10 registros".

- **Estatísticas:** Cards exibindo `Totais`, `Em Aberto`, `Encerrados`, `Cancelados`, `Tempo Médio` (Hoje vs Mês).

- **Cards de Atendimento:** Exibir informações como: Nome do Cliente, ID do Atendimento, Data/Hora de Início, Tempo Decorrido, Atendente, e Tags de Categoria/Status. Deverão ser clicáveis para abrir a tela de detalhe.

- **Filtros/Busca:** Implementar funcionalidade de busca e filtragem para os atendimentos.

#### 3.1.3. Modal de Busca de Cliente (Baseado em `image2.png`)

- **Componente:** `frontend/src/components/ClientSearchModal.tsx`.

- **Funcionalidade:** Campo de entrada para buscar clientes. Botões para "Cadastro" (se o cliente não existir) e "Abrir Atendimento (F4)" para o cliente selecionado.

- **Integração:** Este modal será acionado pelo botão "Novo Atendimento (F4)" no cabeçalho.

#### 3.1.4. Formulário de Novo Atendimento (Baseado em `image3.png`)

- **Componente:** `frontend/src/components/NewAtendimentoForm.tsx`.

- **Campos:**
  - `Cliente`: Preenchido automaticamente após a seleção no modal de busca.
- `Origem`: Dropdown, populado a partir das configurações.
- `Tipo`: Dropdown, populado a partir das configurações.
- `Categoria`: Dropdown, populado a partir das configurações.
- `Aplicação`: Dropdown, populado a partir das configurações.
- `Módulo`: Dropdown, populado a partir das configurações.
- `Problema Inicial`: Textarea para descrição do problema.

- **Botões:** "Voltar" e "Iniciar Atendimento (F4)".

#### 3.1.5. Tela de Detalhe do Atendimento (Baseado em `image4.png`)

- **Componente:** `frontend/src/views/AtendimentoDetailView.tsx`.

- **Layout:** Seção de resumo do atendimento à esquerda e histórico/últimos atendimentos à direita.

- **Resumo do Atendimento:** Exibir informações como Atendente, ID, Data/Hora, Dados da Empresa do Cliente.

- **Campos Editáveis:** `Origem`, `Tipo`, `Categoria`, `Aplicação`, `Módulo` (todos como dropdowns populados a partir das configurações), `Problema Inicial` (textarea).

- **Histórico de Respostas:** Área para registrar e visualizar as interações e soluções aplicadas ao atendimento.

- **Últimos Atendimentos:** Cards compactos dos atendimentos anteriores do mesmo cliente, para referência rápida.

- **Botões de Ação:** "Voltar", "Salvar Alterações (F6)", "Encerrar (F11)", "Cancelar (F7)".

### 3.2. Backend

#### 3.2.1. Modelos de Dados (`backend/src/models/types.ts`)

- **`Atendimento` Interface:**

   ```typescript
   export interface Atendimento {
     id?: number;
     cliente_id: number;
     atendente_id: number;
     data_inicio: string; // datetime
     data_fim?: string; // datetime, opcional
     origem_id: number; // Referência à tabela de configurações
     tipo_id: number; // Referência à tabela de configurações
     categoria_id?: number; // opcional, referência à tabela de configurações
     aplicacao_id?: number; // opcional, referência à tabela de configurações
     modulo_id?: number; // opcional, referência à tabela de configurações
     problema_inicial: string;
     status: 'ABERTO' | 'ENCERRADO' | 'CANCELADO';
     tempo_decorrido?: number; // em minutos, calculado
     // Outros campos relevantes
   }
   ```

- **`HistoricoResposta` Interface:**

   ```typescript
   export interface HistoricoResposta {
     id?: number;
     atendimento_id: number;
     atendente_id: number;
     data_registro: string; // datetime
     descricao: string;
   }
   ```

- **Interfaces para Configurações de Atendimento:**
    ```typescript
    export interface AtendimentoConfig {
      id?: number;
      nome: string;
      tipo: 'origem' | 'tipo' | 'categoria' | 'aplicacao' | 'modulo';
    }
    ```

- **Atualização do `Client` Interface:** Adicionar campos que possam ser relevantes para o atendimento, se necessário.

#### 3.2.2. Rotas da API (`backend/src/routes/api.ts`)

- **Rotas para Atendimentos:**
    *   `router.get('/atendimentos')`: Listar todos os atendimentos (com filtros por status, cliente, atendente, data).
    *   `router.get('/atendimentos/me')`: Listar atendimentos do usuário autenticado.
    *   `router.get('/atendimentos/:id')`: Obter detalhes de um atendimento específico.
    *   `router.post('/atendimentos')`: Criar um novo atendimento.
    *   `router.put('/atendimentos/:id')`: Atualizar um atendimento existente.
    *   `router.delete('/atendimentos/:id')`: Excluir um atendimento.
    *   `router.post('/atendimentos/:id/encerrar')`: Encerrar um atendimento.
    *   `router.post('/atendimentos/:id/cancelar')`: Cancelar um atendimento.
    *   `router.get('/atendimentos/:id/historico')`: Obter histórico de respostas de um atendimento.
    *   `router.post('/atendimentos/:id/historico')`: Adicionar uma resposta ao histórico.
    *   `router.get('/atendimentos/stats')`: Obter estatísticas para o dashboard (totais, em aberto, encerrados, tempo médio).

- **Novas Rotas para Configurações de Atendimento:**
    *   `router.get('/atendimento-configs/:tipo')`: Listar todas as configurações de um tipo específico (origem, tipo, categoria, aplicação, módulo).
    *   `router.post('/atendimento-configs')`: Criar uma nova configuração de atendimento.
    *   `router.put('/atendimento-configs/:id')`: Atualizar uma configuração de atendimento existente.
    *   `router.delete('/atendimento-configs/:id')`: Excluir uma configuração de atendimento.

#### 3.2.3. Controladores (`backend/src/controllers/AtendimentoController.ts` e `backend/src/controllers/AtendimentoConfigController.ts`)

- **`AtendimentoController`:** Implementar a lógica para cada rota da API de atendimentos, interagindo com o banco de dados.

- **`AtendimentoConfigController`:** Novo controlador para gerenciar as operações CRUD das configurações de atendimento.

#### 3.2.4. Banco de Dados

- **Tabela `atendimentos`:**

   ```sql
   CREATE TABLE atendimentos (
     id INT AUTO_INCREMENT PRIMARY KEY,
     cliente_id INT NOT NULL,
     atendente_id INT NOT NULL,
     data_inicio DATETIME NOT NULL,
     data_fim DATETIME,
     origem_id INT NOT NULL,
     tipo_id INT NOT NULL,
     categoria_id INT,
     aplicacao_id INT,
     modulo_id INT,
     problema_inicial TEXT NOT NULL,
     status ENUM('ABERTO', 'ENCERRADO', 'CANCELADO') NOT NULL DEFAULT 'ABERTO',
     tempo_decorrido INT, -- em minutos
     FOREIGN KEY (cliente_id) REFERENCES clients(id),
     FOREIGN KEY (atendente_id) REFERENCES users(id), -- Assumindo uma tabela de usuários
     FOREIGN KEY (origem_id) REFERENCES atendimento_configs(id),
     FOREIGN KEY (tipo_id) REFERENCES atendimento_configs(id),
     FOREIGN KEY (categoria_id) REFERENCES atendimento_configs(id),
     FOREIGN KEY (aplicacao_id) REFERENCES atendimento_configs(id),
     FOREIGN KEY (modulo_id) REFERENCES atendimento_configs(id)
   );
   ```

- **Tabela `historico_respostas`:**

   ```sql
   CREATE TABLE historico_respostas (
     id INT AUTO_INCREMENT PRIMARY KEY,
     atendimento_id INT NOT NULL,
     atendente_id INT NOT NULL,
     data_registro DATETIME NOT NULL,
     descricao TEXT NOT NULL,
     FOREIGN KEY (atendimento_id) REFERENCES atendimentos(id),
     FOREIGN KEY (atendente_id) REFERENCES users(id)
   );
   ```

- **Nova Tabela `atendimento_configs`:**
    ```sql
    CREATE TABLE atendimento_configs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      tipo ENUM('origem', 'tipo', 'categoria', 'aplicacao', 'modulo') NOT NULL,
      UNIQUE(nome, tipo)
    );
    ```

- **Atualização da Tabela `clients`:** Adicionar campos como `last_atendimento_id` ou `total_atendimentos` se for útil para o dashboard.

## 4. Passos de Desenvolvimento (Sugestão)

1.1. **Configuração do Banco de Dados:** Criar as tabelas `atendimento_configs`, `atendimentos` e `historico_respostas` no MySQL.
2. **Backend - Modelos e Controladores de Configurações:**
  - Definir a interface `AtendimentoConfig` em `backend/src/models/types.ts`.
  - Criar `backend/src/controllers/AtendimentoConfigController.ts` com a lógica CRUD para as configurações.
  - Adicionar as novas rotas de configurações em `backend/src/routes/api.ts`.
3. **Backend - Modelos e Controladores de Atendimentos:**
  - Atualizar a interface `Atendimento` em `backend/src/models/types.ts` para usar IDs de configuração.
  - Criar `backend/src/controllers/AtendimentoController.ts` com a lógica CRUD e de estatísticas para atendimentos.
  - Adicionar as rotas de atendimentos em `backend/src/routes/api.ts`.
4. **Frontend - Integração da Navegação:**
  - Adicionar "Atendimentos" e "Config. Atendimento" à `Sidebar.tsx`.
  - Criar arquivos `frontend/src/views/AtendimentosView.tsx` e `frontend/src/views/ConfiguracoesAtendimentoView.tsx` iniciais.
5. **Frontend - Gerenciamento de Configurações:**
  - Desenvolver `ConfiguracoesAtendimentoView.tsx` para permitir o cadastro, edição e exclusão de Origens, Tipos, Categorias, Aplicações e Módulos.
  - Integrar com as novas APIs de configurações.
6. **Frontend - Dashboard de Atendimentos:**
  - Implementar a UI para o dashboard, buscando dados da nova API de estatísticas e listagem de atendimentos.
  - Criar componentes para os cards de atendimento individuais.
7. **Frontend - Modal de Busca de Cliente:**
  - Desenvolver `ClientSearchModal.tsx` e integrá-lo ao botão "Novo Atendimento".
  - A busca de cliente pode reutilizar a rota `clients` existente ou uma nova rota de busca otimizada.
8. **Frontend - Formulário de Novo Atendimento:**
  - Criar `NewAtendimentoForm.tsx` com os campos definidos, populando os dropdowns de Origem, Tipo, Categoria, Aplicação e Módulo a partir das APIs de configurações.
  - Integrar com a API para criar novos atendimentos.
9. **Frontend - Tela de Detalhe do Atendimento:**
  - Desenvolver `AtendimentoDetailView.tsx` com as seções de resumo, campos editáveis (dropdowns populados), histórico e últimos atendimentos.
  - Integrar com as APIs de obtenção, atualização, encerramento e cancelamento de atendimentos, bem como a API de histórico de respostas.
10. **Testes:** Realizar testes unitários e de integração para garantir o funcionamento correto de todas as funcionalidades.ades.

## 5. Considerações Adicionais

- **Autenticação:** As novas rotas da API devem ser protegidas pelo `authMiddleware` existente.

- **Validação:** Implementar validação de entrada de dados tanto no frontend quanto no backend.

- **Tratamento de Erros:** Utilizar o `errorHandler` existente no backend para padronizar as respostas de erro.

- **Responsividade:** Garantir que a nova aba seja responsiva e funcione bem em diferentes tamanhos de tela.

- **Notificações:** Considerar a implementação de notificações em tempo real para novos atendimentos ou atualizações.

Este plano fornece uma base sólida para o desenvolvimento da nova aba de atendimentos. O Gemini CLI pode seguir estas diretrizes para implementar a funcionalidade de forma eficiente e alinhada ao projeto "Suporte HUB".

