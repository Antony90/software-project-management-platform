import {APIEndpoint, HTTPRequestMethod} from "../../API/APIEndpoint"
import {APIRequest} from "../../API/APIRequest"
import {Credentials} from "../../Models/Credentials"
import {User} from "../../Models/DatabaseObjects/User"
import {Session} from "./Session";

/**
 * Deals with user authentication
 */
export class AuthService{


    /**
     * Logouts out a user
     * @returns If the logout was successful
     */
    static async logout(){
        return new APIRequest(APIEndpoint.AUTHORISATION).execute(HTTPRequestMethod.DELETE_POST)
    }

    /**
     * Logs in a user
     * @param username The user's username
     * @param password The user's password
     * @returns A user if login was successful, null otherwise
     */
    static async authorise(username : string, password : string) {
        let user = await new APIRequest<Credentials, User>(APIEndpoint.AUTHORISATION).execute(HTTPRequestMethod.CREATE, new Credentials(username, password), User.fromResponse)
        Session.userService.cache(user)
        return user
    }

    /**
     * Automatically authorises a user
     * @returns A user if login was successful, null otherwise
     */
    static async autoAuthorise(){
        
        let user = await new APIRequest<any, User>(APIEndpoint.AUTHORISATION).execute(HTTPRequestMethod.GET, null, User.fromResponse)
        Session.userService.cache(user)
        return user
    }
}
