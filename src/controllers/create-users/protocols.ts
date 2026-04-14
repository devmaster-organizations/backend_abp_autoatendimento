import type { HttpResponse } from "../protocols";
import type { User } from "../../models/users";

export interface IPostUsersController {
    handler(userData: User): Promise<HttpResponse<User>>;
}

export interface IPostUsersRepository {
    postUser(userData: User): Promise<User>;
}