import { User } from "../entities/user.entity";

export interface Loginresponse{
    user: User;
    token: string

}