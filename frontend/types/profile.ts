export interface MyProfile {
    userId: number;
    name: string;
    email: string;
    authProvider: string;
    phone: string | null;
    /** Fecha ISO yyyy-MM-dd */
    birthDate: string | null;
    photoUrl: string | null;
}

export interface PersonalDataInput {
    phone: string;
    birthDate: string | null;
}
