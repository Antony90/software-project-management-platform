import {Session} from "../../Services/SessionServices/Session";
import {UpdateEndpoint} from "../DatabaseObjects/Project";
import {HTTPRequestMethod} from "../../API/APIEndpoint";
import {Utils} from "../../Services/Utils/Utils";
import {User} from "../DatabaseObjects/User";
import {DatabaseObjectSaver} from "./DatabaseObjectSaver";

/**
 * Saves a user
 */
export class UserSaver extends DatabaseObjectSaver<User>{

    /**
     * Create a new Usersaver
     * @param obj The user to save
     * @param onUpdateOrFail Function executed when the update is complete
     */
    constructor(obj : User, onUpdateOrFail : ()=>void = ()=>{}) {
        super(obj, Session.userService, onUpdateOrFail);
    }

    /**
     * Save the object
     * @param setField Function to set the field of the object
     * @param updatedValueEndpoint The endpoint to send the update to
     * @param previousValue The previous value
     * @param updatedValue The new value
     * @param endpointExtras Extras required for the endpoint
     */
    override async save(setField: (t: User, a: any) => void, updatedValueEndpoint: UpdateEndpoint, previousValue: any, updatedValue: any, endpointExtras: string = ""): Promise<any> {
        return super.save(setField, updatedValueEndpoint, previousValue, updatedValue, HTTPRequestMethod.UPDATE_PATCH, endpointExtras);
    }

    //Add skills to the user
    private async addSkills(skills : string[]){
        let previousLength = this.obj.skillSet.length
        return this.save((u, skills)=>{
            if(skills.skills.length == 0) u.skillSet = u.skillSet.slice(0, previousLength)
            else u.skillSet = [...u.skillSet, ...skills.skills]
        }, UpdateEndpoint.ADDSKILLS, {skills:[]}, {skills:skills, isAdd:true})
    }

    //Remove skills from the user
    private async removeSkills(skills : string[]){
        let previousSkills = [...this.obj.skillSet]
        return this.save((u, skills) => {
            if (skills.skills.length == 0) u.skillSet = previousSkills
            else Utils.removeElements(u.skillSet, skills.skills)
        }, UpdateEndpoint.ADDSKILLS, {skills: []}, {skills: skills, isAdd:false})
    }

    /**
     * Save the user's skill set
     * @param newSkills A list of all the user's skills after update
     */
    public async saveSkills (newSkills : string[]){
        let removedSkills = Utils.findRemovals(this.obj.skillSet, newSkills)
        let addedSkills = Utils.findAdditions(this.obj.skillSet, newSkills)
        let user : User = this.obj
        if(addedSkills.length != 0) user = await this.addSkills(addedSkills)
        if(removedSkills.length != 0) user = await this.removeSkills(removedSkills)
        return user
    }

}