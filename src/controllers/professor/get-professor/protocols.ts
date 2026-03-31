import type { HttpResponse } from "../../protocols";
import type { Professor } from "../../../models/professor";

export interface IGetProfessorController {

    handler(): Promise<HttpResponse<Professor[]>>;
}

export interface IGetProfessorRepository {

    getProfessor(): Promise<Professor[]>;
}