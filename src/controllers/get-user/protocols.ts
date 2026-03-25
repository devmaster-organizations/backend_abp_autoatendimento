import type { HttpResponse } from "../protocols";
import type { User } from "../../models/users";

export interface IGetUsersController {

    handler(): Promise<HttpResponse<User[]>>;
}

export interface IGetUsersRepository {

    getUsers(): Promise<User[]>;
}