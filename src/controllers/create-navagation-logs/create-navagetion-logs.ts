import type { IPostNavagationRepository } from "./protocols";
import { NavigationLogs } from "../../models/nagation-logs";
import { HttpResponse } from "../protocols";
import { IPostNavigationLogsController } from "./protocols";


export class CreateNavigationController implements IPostNavigationLogsController {
    constructor(private readonly postNavagationRepository: IPostNavagationRepository) {}
    async handler(NavigationLogsData: NavigationLogs): Promise<HttpResponse<NavigationLogs>> {
        console.log("Handling request to create navigation log...");
        const createdNavagationLog = await this.postNavagationRepository.postNavigationLogs(NavigationLogsData);
        return {
            statusCode: 201,
            body: createdNavagationLog
        };
    }
}