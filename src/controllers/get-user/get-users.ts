import type { IGetUsersController, IGetUsersRepository } from './protocols';

export class GetUsersController implements IGetUsersController {
    constructor(private readonly getUsersRepository: IGetUsersRepository) {}
    async handler() {
        console.log("Handling request to get users...");
        const users = await this.getUsersRepository.getUsers();
        return {
            statusCode: 200,
            body: users
        };
    }
}