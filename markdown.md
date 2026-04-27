# Backlog de User Stories - Backend (Chatbot Autoatendimento)

## Objetivo
Organizar as entregas do backend para:
1. Cadastro de usuários.
2. Cadastro de logs/nós de navegação.
3. GETs necessários para consumo no front (chatbot).
4. Ajustes para deixar o cadastro de logs mais conciso e padronizado.

## Convenções sugeridas
1. Prefixo de rota: `/api`.
2. Resposta de erro padronizada: `{ message, code, details? }`.
3. Campos de data em ISO string.
4. IDs `bigint` serializados como string no JSON.

---

## US-01 - Cadastrar usuário

Como administrador do sistema,  
quero cadastrar usuários no backend,  
para permitir acesso e gestão do chatbot.

### Critérios de aceite
1. Deve existir endpoint `POST /api/users`.
2. Deve aceitar `name`, `email`, `password`.
3. Deve persistir `passwordHash` no banco.
4. Deve definir `role` padrão quando não informado.
5. Deve retornar `201` com usuário criado.
6. Deve retornar `409` se `email` já existir.
7. Não deve retornar senha em texto puro no payload de resposta.

### Passo a passo técnico
1. Validar payload de entrada no router/controller.
2. Converter `password` para `passwordHash`.
3. Chamar repository para persistência no Prisma.
4. Tratar erro de unicidade do Prisma (`P2002`).
5. Padronizar formato de resposta de sucesso/erro.
6. Criar testes de integração para sucesso e conflito de email.

---

## US-02 - Listar usuários

Como administrador,  
quero listar os usuários cadastrados,  
para consultar os perfis existentes.

### Critérios de aceite
1. Deve existir endpoint `GET /api/users`.
2. Deve retornar lista de usuários com status `200`.
3. Não deve expor senha ou hash sensível sem necessidade.
4. Deve retornar lista vazia `[]` quando não houver registros.

### Passo a passo técnico
1. Implementar consulta no repository (`findMany`).
2. Definir contrato de saída (campos públicos).
3. Ajustar controller para retornar `body` consistente.
4. Criar teste para lista com dados e lista vazia.

---

## US-03 - Ajustar cadastro de logs de navegação (mais conciso)

Como desenvolvedor backend,  
quero simplificar o cadastro de logs/nós de navegação,  
para reduzir complexidade no front e no próprio backend.

### Critérios de aceite
1. Deve existir endpoint de criação de nó de navegação.
2. O payload deve ser direto (sem necessidade de wrapper `data`).
3. Campos obrigatórios: `title`, `slug`.
4. Campos opcionais devem ter default no backend quando aplicável.
5. Deve retornar `409` para `slug` duplicado.
6. Deve retornar `201` com objeto criado.

### Passo a passo técnico
1. Revisar contrato atual de `POST /api/navagation-logs`.
2. Remover necessidade de `req.body.data` e aceitar objeto plano.
3. Aplicar defaults para `displayOrder` e `isActive`.
4. Manter serialização de `bigint` no retorno.
5. Padronizar mensagens de erro e sucesso.
6. Criar teste de payload mínimo e payload completo.

---

## US-04 - Cadastrar logs/nós de navegação

Como equipe de conteúdo,  
quero cadastrar os nós de navegação do chatbot,  
para estruturar o fluxo de perguntas e respostas.

### Critérios de aceite
1. Deve permitir criar nó raiz (`parentId` nulo).
2. Deve permitir criar nó filho (`parentId` existente).
3. Deve persistir `prompt`, `answerSummary`, `evidenceExcerpt`, `evidenceSource`.
4. Deve manter ordenação por `displayOrder`.
5. Deve validar `parentId` inválido com erro adequado (`400` ou `404`).

### Passo a passo técnico
1. Implementar validação de integridade para `parentId`.
2. Persistir campos no Prisma `navigationNode.create`.
3. Garantir retorno serializável para o front.
4. Cobrir com testes de raiz, filho e erro de parent inexistente.

---

## US-05 - GET de navegação para o chatbot (árvore para front)

Como frontend do chatbot,  
quero obter os nós de navegação ativos,  
para renderizar o fluxo de conversa.

### Critérios de aceite
1. Deve existir endpoint `GET /api/navigation-logs` (ou rota padronizada definida pelo time).
2. Deve retornar apenas nós ativos por padrão.
3. Deve permitir filtro por `parentId` para carregar próximos passos.
4. Deve retornar dados ordenados por `displayOrder`.
5. Deve retornar `200` com lista vazia quando não houver nós.

### Passo a passo técnico
1. Criar rota GET específica para consumo do chatbot.
2. Implementar query params: `parentId`, `onlyActive=true`.
3. Implementar ordenação padrão por `displayOrder`.
4. Garantir serialização de `bigint`.
5. Criar testes para filtros e ordenação.

---

## US-06 - GET por slug para avanço do chatbot

Como frontend do chatbot,  
quero buscar um nó por `slug`,  
para carregar contexto de pergunta/resposta de forma rápida.

### Critérios de aceite
1. Deve existir endpoint `GET /api/navigation-logs/:slug`.
2. Deve retornar `200` com nó encontrado.
3. Deve retornar `404` quando slug não existir.
4. Deve retornar filhos do nó quando aplicável (opcional conforme contrato).

### Passo a passo técnico
1. Criar consulta por `slug` no repository.
2. Definir se retorno inclui filhos (`children`) no mesmo payload.
3. Tratar `not found` com resposta padronizada.
4. Criar testes de sucesso e não encontrado.

---

## US-07 - GETs base e observabilidade mínima

Como equipe de operação,  
quero endpoints básicos de verificação,  
para monitorar saúde da API e integrações.

### Critérios de aceite
1. Deve manter `GET /api/health` respondendo `200`.
2. Deve incluir informação simples de status (`ok`) e timestamp.
3. Deve responder rapidamente sem depender de regras de negócio.
4. Deve estar documentado para uso em monitoramento.

### Passo a passo técnico
1. Revisar rota health existente.
2. Padronizar payload de healthcheck.
3. Adicionar teste simples de disponibilidade.
4. Documentar endpoint no README/API docs.

---

## Itens de padronização (cards técnicos)

### Card Técnico A - Padronizar nomenclatura de rota
1. Corrigir inconsistências de nome como `navagation`, `navagetion`, `navigation`.
2. Definir padrão final: `navigation-logs`.
3. Criar redirecionamento temporário ou manter compatibilidade por período de transição.

### Card Técnico B - Contratos DTO de entrada/saída
1. Definir DTOs para `User` e `NavigationNode`.
2. Evitar uso direto de model interno como payload externo.
3. Padronizar status code e envelope de resposta.

### Card Técnico C - Testes de integração das rotas principais
1. Cobrir `POST /api/users`.
2. Cobrir `GET /api/users`.
3. Cobrir `POST /api/navigation-logs`.
4. Cobrir `GET /api/navigation-logs`.
5. Cobrir `GET /api/navigation-logs/:slug`.

---

## Sugestão de ordem de implementação

1. US-01 (Cadastro de usuário).
2. US-02 (Listar usuários).
3. US-03 (Cadastro de logs mais conciso).
4. US-04 (Cadastro completo dos nós de navegação).
5. US-05 (GET de navegação para chatbot).
6. US-06 (GET por slug para chatbot).
7. US-07 (Health/observabilidade).