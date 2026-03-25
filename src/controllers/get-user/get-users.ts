import type { IGetUsersController, IGetUsersRepository } from './protocols';

export class GetUsersController implements IGetUsersController {
    constructor(private readonly getUsersRepository: IGetUsersRepository) {}
    async handler() {
        const users = await this.getUsersRepository.getUsers();
        return {
            statusCode: 200,
            body: users
        };
    }
}