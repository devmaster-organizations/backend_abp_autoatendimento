import type { IGetUsersRepository } from "../../controllers/get-user/protocols";
import { prisma } from "../../core/database/prisma";

export class PostgresGetUsers implements IGetUsersRepository {
    async getUsers() {
        console.log("Getting users from PostgreSQL database...");
        // chamar usuários
        const users = await prisma.user.findMany();
        return users;
    }
}