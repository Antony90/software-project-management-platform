import mOrganisation from "common/build-models/Organisation"
import {Session, useCurrentUser} from "../../Services/SessionServices/Session"
import {DatabaseObject} from "./DatabaseObject"
import {ForeignKeyReference} from "./ForeignKeyReference"
import {User} from "./User"
import {useEffect, useState} from "react";
import {NavRoute} from "../../Services/NavigationServices/NavRoutes";
import {message} from "antd";
import {useNavigate} from "react-router-dom";

/**
 * An organisation
 */
export interface Organisation extends mOrganisation<string, ForeignKeyReference<User>>{}
export class Organisation extends DatabaseObject<Organisation>{



    
    /**
     * Construct a new organisation
     * @param name Name of the organisation
     * @param admin The administrator of the organisation
     * @param members Member IDs of the organisation
     * @param _id The organisation's id
     * @param numMembers The number of members in the organisation
     * @param githubInstallationID The GitHub repo installed for this organisation
     */
    constructor(
        public name: string,
        admin: any = null,
        members: any[] = null,
        public _id: string = null,
        public numMembers : number = null,
        public githubInstallationID : string = null)
    {
        super()
        if(members != null) this.members = ForeignKeyReference.Builder.ARRAY(members, ForeignKeyReference.TYPE.USER)
        if(admin != null) this.admin = ForeignKeyReference.Builder.USER(admin)
        if(numMembers == null) this.numMembers = this.members?.length
    }


    /**
     * Get the org from a JS object API response
     * @param obj The obj parsed from JSON
     * @return The organisation
     */
    static fromResponse(obj : any) : Organisation{

        if(obj.organisation != undefined){
            if(obj.id != null) obj.organisation.id = obj.id
            return Organisation.fromObject(obj.organisation)
        }
        return Organisation.fromObject(obj)
    }


    /**
     * Get the org from a JS object
     * @param obj The obj to convert
     * @return The organisation
     */
    static fromObject(obj : any) : Organisation{
        let id = obj._id
        if(id == null) id = obj.id
        return new Organisation(obj.name, obj.admin, obj.members, id, obj.numMembers, obj.githubInstallationID)
    }


    async getFullObject(): Promise<Organisation> {return Session.organisationService.get("")}
    getID(): string {return this._id}
    setID(id: string) {this._id = id}

}


/**
 * Hook to use the current user's organisation
 * @param setLoading The function to set the caller's loading bar
 * @return The current organisation as a stateful variable
 */
export function useCurrentOrganisation(setLoading : (b : boolean)=>void = ()=>{}){
    const currentUser = useCurrentUser()

    const navigate = useNavigate()

    const [organisation, setOrganisation] = useState<Organisation>(null)

    useEffect(()=>{

        if(currentUser != null){
            if(currentUser.organisation == null){
                navigate(NavRoute.JOIN_ORGANISATION, {state:{popBackTimes:2}})
            }
            else{
                setLoading(true)
                Session.organisationService.getMyOrganisation(currentUser.organisation.getID())
                    .then((o : Organisation)=>{
                        setOrganisation(o)
                    })
                    .catch(()=>{
                        
                        message.error("Could not load organisation data")
                        navigate(-1)
                    })
                    .finally(()=>setLoading(false))
            }
        }
    }, [currentUser])
    return organisation
}


/**
 * Hook to use the developers in the current user's organisation
 * @param setLoading The function to set the caller's loading bar
 * @return The current organisation developers as a stateful variable
 */
export function useCurrentOrganisationDevelopers(setLoading : (b: boolean)=>void = ()=>{}){
    const organisation = useCurrentOrganisation(setLoading)
    const [members, setMembers] = useState<User[]>(null)
    const navigate = useNavigate()
    useEffect(()=>{
        if(organisation != null){
            setLoading(true)
            Session.userService.getMultiple(organisation.members)
                .then((members)=>{
                    setMembers(members)
                })
                .catch(()=>{
                    
                    message.error("Failed to resolve organisation members")
                    navigate(-1)
                })
                .finally(()=>setLoading(false))
        }
    }, [organisation])

    return members
}