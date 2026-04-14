import type { HttpResponse } from "../protocols";
import type { MaisUm } from "../../models/maisum";


export interface IPostMaisUmController {
    handler(maisum: MaisUm): Promise<HttpResponse<MaisUm>>;
}

export interface IPostMaisUmRepository {
    postMaisUm(maisum: MaisUm): Promise<MaisUm>;
}