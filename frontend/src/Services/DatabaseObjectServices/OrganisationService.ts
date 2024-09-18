import {Organisation} from "../../Models/DatabaseObjects/Organisation"
import {DatabaseObjectService} from "./DatabaseObjectService"
import {Session} from "../SessionServices/Session"
import {URLService} from "../NavigationServices/URLService"
import {APIEndpoint, HTTPRequestMethod} from "../../API/APIEndpoint"
import {APIRequest} from "../../API/APIRequest"
import {User} from "../../Models/DatabaseObjects/User"
import {NavRoute} from "../NavigationServices/NavRoutes"

/**
 * Handles organisations
 */
export class OrganisationService extends DatabaseObjectService<Organisation>{


    /**
     * Create a new organisation service
     */
    constructor(){
        super(APIEndpoint.ORGANISATION, Organisation.fromResponse, Organisation.fromObject, "ORGANISATION")
    }


    /**
     * Get the current user's organisation
     * @param id ID of the current user's organisation
     * @param checkCache If the service should check the cache for this organisation
     */
    public async getMyOrganisation(id : string, checkCache:boolean=true){
        if(checkCache) {
            let fromCache = await this.getFromCache(id)
            if (fromCache != null) return fromCache
        }
        return await this.get("", false)
    }

    /**
     * Join an organisation
     * @param org The organisation to join
     * @return If the join was successful
     */
    public async join(org : Organisation){
        try {
            await new APIRequest<any, Organisation>(APIEndpoint.JOIN_ORG, "").execute(HTTPRequestMethod.CREATE, {_id : org.getID()})
            return await this.getMyOrganisation(org._id, false)
        }
        catch(e){
            throw e
        }
    }

    /**
     * Leave an organisation
     * @param u The current user
     */
    public async leave(u : User){
        try {
            await new APIRequest<User, any>(APIEndpoint.JOIN_ORG, "").execute(HTTPRequestMethod.DELETE_POST, u)
            Session.userService.currentUser.setOrganisation(null)
            Session.userService.currentUser.projects = []
        }
        catch(e){
            throw e
        }
    }

    /**
     * Get the join link
     * @param orgID ID of the organisation to join
     * @returns A join link for the organisation
     */
    static joinURLFromID(orgID : string) : string{
        return new URLService().getCurrentBaseUrl() + NavRoute.JOIN_ORGANISATION + "/" + orgID
    }

}