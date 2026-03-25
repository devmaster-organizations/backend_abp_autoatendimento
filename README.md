# Backend ABP Autoatendimento

Guia pratico para criar novas rotas seguindo o padrao atual do projeto.

## Stack

- Node.js + TypeScript
- Express
- Arquitetura em camadas: `router -> controller -> repository -> model`

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

Se o recurso ainda nao existir, crie em `src/models`.

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
- [ ] Criar/reutilizar model em `src/models`
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
