
export interface IGetUsersController {

    handler(): Promise<void> | Promise<{
        message: string;
    }>;
}