# Backend ABP Autoatendimento

Guia pratico para criar novas rotas seguindo o padrao atual do projeto.

## Endpoints principais

- `GET /api/health`: healthcheck simples para monitoramento
- `POST /api/users`: cria usuario (`name`, `email`, `password`)
- `GET /api/users`: lista usuarios sem campos sensiveis
- `POST /api/navigation-logs`: cria no de navegacao com payload plano
- `GET /api/navigation-logs`: lista nos com filtros `parentId` e `onlyActive`
- `GET /api/navigation-logs/:slug`: busca no por slug com filhos ativos

Compatibilidade temporaria:

- `POST /api/navagation-logs`
- `GET /api/navagation-logs`
- `GET /api/navagation-logs/:slug`

## Stack

- Node.js + TypeScript
- Express
- PostgreSQL
- Prisma ORM
- Arquitetura em camadas: `router -> controller -> repository -> model`

## Prisma no projeto

Hoje o projeto usa Prisma com PostgreSQL.

Arquivos principais:

- `prisma/schema.prisma`: define as tabelas e campos do banco
- `prisma.config.ts`: define a configuracao do Prisma 7 e a leitura da `DATABASE_URL`
- `src/core/database/prisma.ts`: cria a instancia unica do `PrismaClient`
- `.env`: define a conexao local com o banco

### Como o Prisma entra na arquitetura

No projeto, o Prisma fica na camada de repository.

Fluxo:

- o `router` recebe a requisicao
- o `controller` executa o caso de uso
- o `repository` usa o Prisma para consultar ou gravar no banco

Exemplo de import do client:

```ts
import { prisma } from '../core/database/prisma';
```

## Entendendo `src` e `dist`

O projeto e escrito em TypeScript dentro de `src/`.

A pasta `dist/` e gerada automaticamente no build e contem o JavaScript compilado que o Node executa em runtime.

Resumo:

- `src/`: codigo fonte que voce edita
- `dist/`: codigo compilado gerado pelo TypeScript

Voce nao deve editar `dist/` manualmente.

### Quando preciso rebuildar?

Hoje o projeto esta configurado assim:

- `npm run build`: gera o `dist/`
- `npm run start`: executa `node dist/server.js`
- o Docker da API tambem roda `npm run start`

Isso significa que, sempre que voce alterar arquivos em `src/`, o container nao vai enxergar a mudanca ate que o `dist/` seja gerado de novo.

Exemplos de mudancas que exigem build novo:

- adicionar uma rota em `src/routers`
- alterar controller em `src/controllers`
- alterar repository em `src/repositories`
- alterar inicializacao do servidor em `src/server.ts`

Fluxo atual para refletir mudancas no container:

```bash
npm run build
docker compose -f infra/compose.yml restart
```

Se voce tambem mudou dependencias, Dockerfile ou arquivos copiados para a imagem, prefira:

```bash
docker compose -f infra/compose.yml up -d --build
```

### Por que uma rota nova pode dar 404 mesmo existindo em `src`?

Porque o Express dentro do container esta executando o arquivo compilado em `dist/`, nao o arquivo TypeScript original em `src/`.

Entao este cenario pode acontecer:

1. voce cria `src/routers/create-noticias.ts`
2. voce registra a rota em `src/routers/index.ts`
3. voce testa no navegador ou no Postman
4. a API responde `Cannot POST /api/noticias`

Isso normalmente significa que o `dist/` ainda esta antigo.

Ou seja: a rota existe em `src`, mas ainda nao foi compilada e carregada pelo processo que esta rodando.

### Fluxo recomendado no desenvolvimento

Se estiver usando o setup atual com Docker e `node dist/server.js`:

```bash
npm run build
docker compose -f infra/compose.yml restart
```

Se estiver rodando localmente sem Docker, voce pode usar modo dev:

```bash
npm run dev
```

ou:

```bash
npm run start:dev
```

Nesses modos, a aplicacao roda direto do `src/`, entao a necessidade de rebuild manual diminui bastante.

## Como criar uma nova tabela com Prisma

Para criar uma tabela nova, voce edita o arquivo `prisma/schema.prisma`.

Exemplo de nova tabela `Product`:

```prisma
model Product {
  id          Int      @id @default(autoincrement())
  name        String
  description String?
  price       Decimal
  createdAt   DateTime @default(now())

  @@map("products")
}
```

Depois de alterar o schema, voce precisa sincronizar isso com o banco.

### Opcao 1: aplicar rapido no banco atual

Use quando voce quer sincronizar o banco sem criar historico formal de migration.

```bash
npm run prisma:push
```

Esse comando executa:

```bash
prisma db push
```

Ele atualiza o banco para refletir o `schema.prisma`.

### Opcao 2: criar migration versionada

Use quando voce quer manter historico de alteracoes do banco.

```bash
npx prisma migrate dev --name create-products
```

Isso cria uma migration em `prisma/migrations/` e aplica no banco local.

Para producao, o comum e usar:

```bash
npx prisma migrate deploy
```

## Da para migrar dados pelo Prisma?

Sim, mas depende do tipo de mudanca.

### Migracao de estrutura

Prisma faz muito bem mudancas de estrutura, por exemplo:

- criar tabela
- adicionar coluna
- remover coluna
- criar indice
- criar constraint

### Migracao de dados

Tambem da, mas normalmente nao e so "automatico".

Quando voce precisa transformar dados existentes, o caminho mais comum e:

1. gerar uma migration
2. editar o SQL da migration
3. incluir comandos `UPDATE`, `INSERT`, `DELETE` ou `ALTER TABLE` conforme a necessidade

Exemplo:

```bash
npx prisma migrate dev --name add-user-status
```

Depois disso, voce pode editar o SQL gerado e fazer algo como:

```sql
UPDATE users
SET status = 'active'
WHERE status IS NULL;
```

Se a migracao for mais complexa, outra alternativa e criar um script em TypeScript usando `PrismaClient` para ler dados antigos e gravar no novo formato.

Resumo:

- Prisma migra estrutura muito bem
- Prisma tambem pode migrar dados
- para transformacao de dados, normalmente voce usa SQL em migration ou script manual

## Comandos basicos do Prisma

### Gerar o client do Prisma

```bash
npm run prisma:generate
```

Ou:

```bash
npx prisma generate
```

### Aplicar schema no banco sem migration

```bash
npm run prisma:push
```

### Criar migration local

```bash
npx prisma migrate dev --name nome-da-migration
```

### Aplicar migrations em producao

```bash
npx prisma migrate deploy
```

### Abrir o Prisma Studio

```bash
npx prisma studio
```

### Validar o schema

```bash
npx prisma validate
```

### Ver o formato final do banco a partir do schema

```bash
npx prisma format
```

## Como usar Prisma no repository

Hoje o repository de users ainda esta mockado. Quando voce quiser usar o Prisma de verdade, o repository fica parecido com isso:

```ts
import type { IGetUsersRepository } from '../../controllers/get-user/protocols';
import { prisma } from '../../core/database/prisma';

export class PostgresGetUsers implements IGetUsersRepository {
  async getUsers() {
    return prisma.user.findMany();
  }
}
```

### Exemplos basicos para usar no repository

Buscar varios registros:

```ts
const users = await prisma.user.findMany();
```

Buscar um registro por id:

```ts
const user = await prisma.user.findUnique({
  where: { id: 1 },
});
```

Buscar um registro por email:

```ts
const user = await prisma.user.findUnique({
  where: { email: 'john.doe@example.com' },
});
```

Criar registro:

```ts
const user = await prisma.user.create({
  data: {
    name: 'Maria',
    email: 'maria@exemplo.com',
    password: '123456',
  },
});
```

Atualizar registro:

```ts
const user = await prisma.user.update({
  where: { id: 1 },
  data: {
    name: 'Maria Silva',
  },
});
```

Deletar registro:

```ts
await prisma.user.delete({
  where: { id: 1 },
});
```

Filtrar e ordenar:

```ts
const users = await prisma.user.findMany({
  where: {
    email: {
      contains: '@exemplo.com',
    },
  },
  orderBy: {
    name: 'asc',
  },
});
```

## Fluxo recomendado para usar Prisma em uma nova feature

1. criar ou editar o model em `prisma/schema.prisma`
2. executar `npm run prisma:generate`
3. sincronizar o banco com `npm run prisma:push` ou `npx prisma migrate dev --name ...`
4. implementar o repository usando `prisma.<model>`
5. usar o repository no controller
6. testar a rota

## Estrutura atual

```text
src/
  server.ts
  controllers/
    protocols.ts
    get-user/
      get-users.ts
      protocols.ts
  models/
    users.ts
  repositories/
    get-users/
      postgres-get-users.ts
  routers/
    get-users.ts
    index.ts
```

## Fluxo de trabalho para criar uma nova rota

Use este passo a passo para qualquer endpoint novo (`GET`, `POST`, etc.).

### 1) Defina o endpoint e o objetivo

Exemplo:
- Metodo: `GET`
- Rota: `/users`
- Objetivo: listar usuarios

Outro exemplo:
- Metodo: `POST`
- Rota: `/users`
- Objetivo: criar usuario

### 2) Crie ou reutilize um model

Se voce quiser manter uma camada de dominio separada do Prisma, crie ou reutilize um model em `src/models`.

Se o repository for usar Prisma diretamente e o projeto nao precisar dessa camada extra, esse model e opcional.

Exemplo (`src/models/user.ts`):

```ts
export class User {
  id: number;
  name: string;
  email: string;
  password: string;

  constructor(id: number, name: string, email: string, password: string) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.password = password;
  }
}
```

Se ja existir um model equivalente, reutilize.

### 3) Crie os protocolos do controller

Crie uma pasta para o caso de uso em `src/controllers/<nome-do-caso>/`.

Exemplo para `GET /users`:
- `src/controllers/get-user/protocols.ts`
- `src/controllers/get-user/get-users.ts`

No `protocols.ts`, defina os contratos do controller e repository:

```ts
import type { HttpResponse } from '../protocols';
import type { User } from '../../models/users';

export interface IGetUsersController {
  handler(): Promise<HttpResponse<User[]>>;
}

export interface IGetUsersRepository {
  getUsers(): Promise<User[]>;
}
```

### 4) Implemente o controller

O controller recebe o repository por injecao de dependencia.

Exemplo (`src/controllers/get-user/get-users.ts`):

```ts
import type { IGetUsersController, IGetUsersRepository } from './protocols';

export class GetUsersController implements IGetUsersController {
  constructor(private readonly getUsersRepository: IGetUsersRepository) {}

  async handler() {
    const users = await this.getUsersRepository.getUsers();

    return {
      statusCode: 200,
      body: users,
    };
  }
}
```

### 5) Implemente o repository

Crie em `src/repositories/<nome-do-caso>/`.

Exemplo (`src/repositories/get-users/postgres-get-users.ts`):

```ts
import type { IGetUsersRepository } from '../../controllers/get-user/protocols';

export class PostgresGetUsers implements IGetUsersRepository {
  async getUsers() {
    return [
      {
        id: 2,
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password123',
      },
      {
        id: 3,
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        password: 'password456',
      },
    ];
  }
}
```

## 6) Crie o arquivo de rota

Crie em `src/routers/<nome>.ts`.

Exemplo GET (`src/routers/get-users.ts`):

```ts
import express from 'express';
import { GetUsersController } from '../controllers/get-user/get-users';
import { PostgresGetUsers } from '../repositories/get-users/postgres-get-users';

const router = express.Router();

router.get('/users', async (req, res) => {
  const postgresGetRepository = new PostgresGetUsers();
  const getUsersController = new GetUsersController(postgresGetRepository);

  const result = await getUsersController.handler();
  res.json(result);
});

export default router;
```

### Template base para POST

Use este template como base para qualquer `POST`.

```ts
import express from 'express';
import { CreateUserController } from '../controllers/create-user/create-user';
import { PostgresCreateUser } from '../repositories/create-user/postgres-create-user';

const router = express.Router();

router.post('/users', async (req, res) => {
  const { name, email, password } = req.body;

  const repository = new PostgresCreateUser();
  const controller = new CreateUserController(repository);

  const result = await controller.handler({ name, email, password });
  res.status(result.statusCode).json(result.body);
});

export default router;
```

## 7) Conecte a nova rota no index de rotas

Edite `src/routers/index.ts` e registre o novo router:

```ts
import { Router } from 'express';
import getUsersRouter from './get-users';
import createUserRouter from './create-user';

const router = Router();

router.get('/health', (req, res) => {
  res.send('Api esta no ar!');
});

router.use('/', getUsersRouter);
router.use('/', createUserRouter);

export default router;
```

## 8) Teste localmente

Suba a API:

```bash
npm run start:dev
```

Teste os endpoints:

- `GET http://localhost:3000/api/health`
- `GET http://localhost:3000/api/users`
- `POST http://localhost:3000/api/users`

Exemplo body para POST:

```json
{
  "name": "Maria",
  "email": "maria@exemplo.com",
  "password": "123456"
}
```

## Checklist rapido para novas rotas

- [ ] Definir endpoint e metodo HTTP
- [ ] Criar/reutilizar model em `src/models` se precisar de camada de dominio
- [ ] Criar `protocols.ts` do caso de uso
- [ ] Implementar controller
- [ ] Implementar repository
- [ ] Criar arquivo de router (`GET`, `POST`, etc.)
- [ ] Registrar router em `src/routers/index.ts`
- [ ] Testar endpoint em `/api/...`

## Convencao recomendada de nomes

- Controller: `GetUsersController`, `CreateUserController`
- Repository: `PostgresGetUsers`, `PostgresCreateUser`
- Pasta por caso de uso: `get-user`, `create-user`
- Router por recurso/acao: `get-users.ts`, `create-user.ts`

Seguindo esse fluxo, voce mantem padrao, escalabilidade e separacao de responsabilidades no backend.
