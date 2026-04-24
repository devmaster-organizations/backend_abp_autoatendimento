import type { HttpResponse } from '../protocols';
import type { UserPublic } from '../../models/users';

export interface IGetUsersController {
    handler(): Promise<HttpResponse<UserPublic[]>>;
}

export interface IGetUsersRepository {
    getUsers(): Promise<UserPublic[]>;
}