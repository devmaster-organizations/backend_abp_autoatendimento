import type { HttpResponse } from '../protocols';
import { hashPassword } from '../../core/security/password';
import type { UserPublic } from '../../models/users';
import type { CreateUserInput, IPostUsersController, IPostUsersRepository } from './protocols';

export class CreateUsersController implements IPostUsersController {
    constructor(private readonly postUsersRepository: IPostUsersRepository) {}

    async handler(userData: CreateUserInput): Promise<HttpResponse<UserPublic>> {
        const createData = {
            name: userData.name,
            email: userData.email,
            passwordHash: hashPassword(userData.password),
            ...(userData.role ? { role: userData.role } : {}),
        };

        const createdUser = await this.postUsersRepository.postUser(createData);

        return {
            statusCode: 201,
            body: createdUser,
        };
    }
}