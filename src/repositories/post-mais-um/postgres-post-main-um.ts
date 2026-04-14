import type { IPostMaisUmRepository } from "../../controllers/create-main-um/protocols";
import { prisma } from "../../core/database/prisma";
import { MaisUm } from "../../models/maisum";



export class PostgresPostMaisUm implements IPostMaisUmRepository {
    async postMaisUm(maisum: MaisUm) {
        console.log("Posting MaisUm to PostgreSQL database...");
        // postar usuário
        const newMaisUm = await prisma.maisUma.create({
            data: {
                descricao: maisum.descricao
            }
        });
        return newMaisUm;
    }
}