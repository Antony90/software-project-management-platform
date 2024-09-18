import {Project} from "./Project"
import mUser from "common/build-models/User"
import {Organisation} from "./Organisation"
import {Session} from "../../Services/SessionServices/Session"
import {ForeignKeyReference} from "./ForeignKeyReference"
import {DatabaseObject} from "./DatabaseObject"


/**
 * A User
 */
export interface User extends mUser<string, ForeignKeyReference<Project>, ForeignKeyReference<Organisation>> { }
export class User extends DatabaseObject<User>{



    /**
     * Get this initals of this user's name
     * @returns Initials for this user
     */
    public getInitials() : string{
        return this.firstName.charAt(0).toString() + this.lastName.charAt(0).toString()
    }

    /**
     * Construct a new user
     * @param firstName User's first name
     * @param lastName User's surname
     * @param email User's email
     * @param organisation User's organisation
     * @param skillSet : User's skillset
     * @param projects User's projects
     * @param password User's password
     * @param _id The id of the user
     */
    constructor(
        public firstName : string,
        public lastName : string,
        public email : string,
        organisation:any = null,
        public skillSet : string[] = [],
        projects : any[] = [],
        public password : string = null,
        public _id : string = null){
        super()
        if(projects != null) this.projects = ForeignKeyReference.Builder.ARRAY(projects, ForeignKeyReference.TYPE.PROJECT)
        if(organisation != null) this.organisation = ForeignKeyReference.Builder.ORGANISATION(organisation)
    }


    //Get the user from the result of a request
    static fromResponse(obj : any) : User{
        if(obj.profile != undefined) return User.fromObject(obj.profile)
        if(obj.user != undefined) return User.fromObject(obj.user)
        return User.fromObject(obj)
    }

    //Get the user from an object
    static fromObject(obj : any) : User{
        let id = obj.id
        if(id == null) id = obj._id
        return new User(obj.firstName, obj.lastName, obj.email, obj.organisation, obj.skillSet, obj.projects, null, id)
    }

    /**
     * Parse this object from JSON
     * @param s JSON representation of the object
     * @returns A user object
     */
    static fromJSON(s : string) : User{
        let obj = JSON.parse(s)
        return this.fromObject(obj)
    }

    /**
     * Set the organisation of this user
     * @param o The user's organisation
     */
    public setOrganisation(o : Organisation){
        this.organisation = new ForeignKeyReference<Organisation>(o)
    }

    /**
     * Add a project to the user's roster
     * @param p The project to add to the user's roster
     */
    public addProject(p : Project){
        this.projects.push(new ForeignKeyReference<Project>(p))
    }

    /**
     * Get the list of this user's skill set
     */
    public getSkillsList(){
        if(this.skillSet.length == 0) return "No Recorded Skills"
        return `Skills: ${this.skillSet.join(", ")}`
    }


    /**
     * Get the user's full name
     * @returns The user's full name
     */
    public getFullName() : string{
        return this.firstName + " " + this.lastName
    }



    getID(): string {return this._id}
    setID(id : string) {this._id = id}
    async getFullObject(): Promise<User> {return Session.userService.get(this.getID())}

}


