import type { IPostMaisUmRepository } from "./protocols";
import { MaisUm } from "../../models/maisum";
import { HttpResponse } from "../protocols";
import { IPostMaisUmController } from "./protocols";

export class CreateMaisUmController implements IPostMaisUmController {
    constructor(private readonly postMaisUmRepository: IPostMaisUmRepository) {}
    async handler(maisUmData: MaisUm): Promise<HttpResponse<MaisUm>> {
        console.log("Handling request to create MaisUm...");
        const createdMaisUm = await this.postMaisUmRepository.postMaisUm(maisUmData);
        return {
            statusCode: 201,
            body: createdMaisUm
        };
    }
}