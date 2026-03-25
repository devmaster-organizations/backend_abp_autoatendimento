import type { IGetUsersRepository } from "../../controllers/get-user/protocols";

export class PostgresGetUsers implements IGetUsersRepository {
    async getUsers() {
        return [
            {
                id: 2,
                name: 'John Doe',
                email: 'john.doe@example.com',
                password: 'password123'
            },
            {
                id: 3,
                name: 'Jane Doe',
                email: 'jane.doe@example.com',
                password: 'password456'
            },
        ];
    }
}