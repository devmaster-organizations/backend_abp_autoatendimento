import type { UserRole } from '@prisma/client';

export interface UserCreateData {
    name: string;
    email: string;
    passwordHash: string;
    role?: UserRole;
    mustChangePassword?: boolean;
    passwordUpdatedAt?: Date | null;
}

export interface UserPublic {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}