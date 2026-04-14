import type { HttpResponse } from "../protocols";
import type { NavigationLogs } from "../../models/nagation-logs";

export interface IPostNavigationLogsController {

    handler(NavigationLogsData: NavigationLogs): Promise<HttpResponse<NavigationLogs>>;
}

export interface IPostNavagationRepository {

    postNavigationLogs(NavigationLogsData: NavigationLogs): Promise<NavigationLogs>;
}