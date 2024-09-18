import {useEffect, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {User} from "../../Models/DatabaseObjects/User";
import {AuthService} from "./AuthService";
import {OrganisationService} from "../DatabaseObjectServices/OrganisationService";
import {ProjectService} from "../DatabaseObjectServices/ProjectService";
import {UserService} from "../DatabaseObjectServices/UserService";
import {NavRoute} from "../NavigationServices/NavRoutes";
import {Callback} from "../../Models/Callback";
import {Credentials} from "../../Models/Credentials";
import {SchedulerService} from "./SchedulerService";
import {SessionStorageService} from "../StorageServices/SessionStorageService";

/**
 * Handles session
 */
export class Session{

    //Services
    static projectService = new ProjectService()
    static userService = new UserService()
    static organisationService = new OrganisationService()
    static schedulerService = new SchedulerService()
    static started = false
    static loading = false
    static onUserChangedCallbacks : Callback<User, void>[] = []

    /**
     * Get the current user from the server
     */
    static async getUser(){
        if(this.userService.currentUser == null) {
            if(!this.loading) {
                this.loading = true
                try {
                    let user = await AuthService.autoAuthorise()
                    this.setCurrentUser(user)
                    return user
                } catch (e) {
                    throw e
                }
            }
            else{
                return null
            }
        }
        else{
            return this.userService.currentUser
        }
    }


    /**
     * Start a session
     */
    static start(){
        this.started = true
        this.schedulerService.start()
        this.projectService.startSession()
        this.userService.startSession()
        this.organisationService.startSession()
    }

    /**
     * End a session
     */
    static end(){
        SessionStorageService.clear()
        this.started = false
        this.schedulerService.stop()
        this.projectService.endSession()
        this.userService.endSession()
        this.organisationService.endSession()
        this.onUserChangedCallbacks = []
        this.setCurrentUser(null)
    }

    /**
     * Register a callback for when the user changes
     * @param id The id of the callback
     * @param callback The callback to register
     */
    static registerForOnUserChange(id : string, callback : (u : User)=>void){
        this.onUserChangedCallbacks.push(new Callback(id, callback))
    }

    /**
     * Unregister a previously registered callback for when the user changes
     * @param id The id of the callback to unregister
     */
    static unregisterForOnUserChange(id : string){
        let removeIndex = this.onUserChangedCallbacks.findIndex((r)=>{return r.id == id})
        if(removeIndex != -1){
            this.onUserChangedCallbacks.splice(removeIndex, 1)
        }

    }
    
    /**
     * Set the current user
     * @param u The new user for this session
     */
    static setCurrentUser(u : User){
        this.userService.currentUser = u
        this.onUserChangedCallbacks.forEach((callback)=>{
            callback.call(u)
        })

    }

    /**
     * Refresh the session
     */
    static refresh(){
        this.end()
        this.start()
    }

}

export enum RefreshReason{
    LOGOUT = "LOGOUT",
    SESSION_EXPIRY = "SESSION_EXPIRED"
}


/**
 * Get the current user
 * @param setLoading The function to set the current loading status of the get
 * @returns User of this session
 */
export function useCurrentUser(setLoading : (b:boolean)=>void = ()=>{}) : User{

    const [currentUser, setCurrentUser] = useState(null);
    const [callbackUUID, setCallbackUUID] = useState("")
    const location = useLocation()
    const navigate = useNavigate()

    useEffect(() => {
        setLoading(true)
        Session.getUser()
            .then((u: User) => {
                if (u != null) setCurrentUser(Session.userService.currentUser)
            })
            .catch(() => {
                
                if (location.pathname.indexOf(NavRoute.AUTHORISATION) == -1) {
                    navigate(NavRoute.AUTHORISATION, {state: {redirect: location.pathname}})
                }
            })
            .finally(()=>setLoading(false))
    }, []);

    useEffect(()=>{
        let UUID = Credentials.UUID()
        setCallbackUUID(UUID)
        Session.registerForOnUserChange(UUID, (u)=>setCurrentUser(u))
    }, [])

    useEffect( () => () => Session.unregisterForOnUserChange(callbackUUID), [] );
  
    return currentUser;

}