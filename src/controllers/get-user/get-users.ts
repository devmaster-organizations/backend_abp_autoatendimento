import type { IGetUsersController } from './protocol';

export class GetUsersController implements IGetUsersController {
    async handler() {
        return {
            message: 'Mensagem enviada da controller de get users'
        };
    }
}