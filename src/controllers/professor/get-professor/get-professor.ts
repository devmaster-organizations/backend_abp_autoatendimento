import type { IGetProfessorController } from './protocols';

export class GetProfessorController implements IGetProfessorController {
    // constructor(private readonly getProfessorRepository: IGetProfessorController) {}

    async handler() {
        return {
            statusCode: 200,
            body: "String de sucesso ao se conectar ao body"
        }
    }
}