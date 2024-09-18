import {DatabaseObject} from "./DatabaseObjects/DatabaseObject"
import {v4 as uuidv4} from 'uuid';

/**
 * Credentials
 */
export class Credentials extends DatabaseObject<Credentials>{


    static UUID() : string {
        return uuidv4();
    }

    email : string
    password : string
    
    /**
     * Create a new Credentials object
     * @param email The email for the credentials
     * @param password The password for the credentials
     */
    constructor(email : string, password : string){
        super()
        this.email = email
        this.password = password
    }

    async getFullObject(): Promise<Credentials> {return Promise.resolve(new Credentials(this.email, null))}
    setID(id: string) {this.email = id}
    getID(): string {return this.email}
}