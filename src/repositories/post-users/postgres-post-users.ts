import type { IPostUsersRepository } from "../../controllers/create-users/protocols";
import { prisma } from "../../core/database/prisma";
import { User } from "../../models/users";



export class PostgresPostUsers implements IPostUsersRepository {
    async postUser(userData: User) {
        console.log("Posting user to PostgreSQL database...");
        // postar usuário
        const newUser = await prisma.user.create({
            data: {
                name: userData.name,
                email: userData.email,
                password: userData.password
            }
        });
        return newUser;
    }
}