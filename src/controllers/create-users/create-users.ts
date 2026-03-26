import type { IPostUsersRepository } from "./protocols";
import { User } from "../../models/users";
import { HttpResponse } from "../protocols";
import { IPostUsersController } from "./protocols";

export class CreateUsersController implements IPostUsersController {
    constructor(private readonly postUsersRepository: IPostUsersRepository) {}
    async handler(userData: User): Promise<HttpResponse<User>> {
        console.log("Handling request to create user...");
        const createdUser = await this.postUsersRepository.postUser(userData);
        return {
            statusCode: 201,
            body: createdUser
        };
    }
}