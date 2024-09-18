import {APIEndpoint, HTTPRequestMethod} from "../../API/APIEndpoint";

import {User} from "../../Models/DatabaseObjects/User";
import {DatabaseObjectService} from "./DatabaseObjectService";

export class UserService extends DatabaseObjectService<User>{

    currentUser : User = null

    constructor(){
        super(APIEndpoint.USER, User.fromResponse, User.fromObject, "USER")
    }

    /**
     * Register a new user
     * @param values Object of values to use for the new user
     * @returns The user if created or null
     */
    public async registerUser(values : any){
        return this.create(new User(values.firstname, values.surname, values.email, null, [], [], values.password, null))
    }

    override async update(newObj: User, updateEndpoint: string, value: any): Promise<User> {
        return super.update(newObj, updateEndpoint, value, HTTPRequestMethod.UPDATE_PATCH, false);
    }
}