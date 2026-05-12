import type { UserRole } from '@prisma/client';
import type { HttpResponse } from '../protocols';
import type { UserCreateData, UserPublic } from '../../models/users';

export interface CreateUserInput {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
}

export interface IPostUsersController {
    handler(userData: CreateUserInput): Promise<HttpResponse<UserPublic>>;
}

export interface IPostUsersRepository {
    postUser(userData: UserCreateData): Promise<UserPublic>;
}