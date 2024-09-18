import {Session} from "../../Services/SessionServices/Session";
import {UpdateEndpoint} from "../DatabaseObjects/Project";
import {HTTPRequestMethod} from "../../API/APIEndpoint";
import {Utils} from "../../Services/Utils/Utils";
import {ForeignKeyReference} from "../DatabaseObjects/ForeignKeyReference";
import mCostItem from "common/build-models/CostItem";
import {TopLevelTask} from "../DatabaseObjects/TopLevelTask";
import {DatabaseObjectSaver} from "./DatabaseObjectSaver";

/**
 * Saves a task
 */
export class TaskSaver extends DatabaseObjectSaver<TopLevelTask>{

    /**
     * Create a new task saver
     * @param obj The object to save
     * @param onUpdateOrFail Function to execute when the update is complete
     */
    constructor(obj : TopLevelTask, onUpdateOrFail : ()=>void = ()=>{}) {
        super(obj, Session.projectService, onUpdateOrFail);
    }

    /**
     * Save the object
     * @param setField Function to set the field of the object
     * @param updatedValueEndpoint The endpoint to send the update to
     * @param previousValue The previous value
     * @param updatedValue The new value
     * @param method The method to use to save the task
     */
    override async save(setField: (t: TopLevelTask, a: any) => void, updatedValueEndpoint: UpdateEndpoint, previousValue: any, updatedValue: any, method : HTTPRequestMethod.UPDATE_PATCH|HTTPRequestMethod.UPDATE_POST = HTTPRequestMethod.UPDATE_PATCH): Promise<any> {
        return super.save(setField, updatedValueEndpoint, previousValue, updatedValue, method, `${this.obj.projectID}/${this.obj.getID()}`, false);
    }

    /**
     * Rename a task
     * @param newName The new name of the task
     */
    public async renameTask(newName : string){
        return this.save(
            (t, name)=>{t.name = name.name},
            UpdateEndpoint.RENAMETASK,
            {name:this.obj.name},
            {name:newName},
        )
    }

    /**
     * Mark the task as completed
     */
    public async complete(){
        return this.save(
            (t, completeDate)=>{
                t.completedDate = completeDate.completeDate
            },
            UpdateEndpoint.COMPLETETASK,
            {completeDate:null},
            {completeDate:new Date()},
        )
    }

    /**
     * Mark the task as started
     */
    public async start(){
        return this.save(
            (t, startDate)=>{
                t.startDate = startDate.startDate
            },
            UpdateEndpoint.STARTTASK,
            {startDate:null},
            {startDate:new Date()},
        )
    }

    /**
     * Save the developers on the task
     * @param newDevelopers The list of developers now on the task
     */
    public async saveDevelopers (newDevelopers : string[]){
        let removedDevelopers = Utils.findRemovals(ForeignKeyReference.toStringArray(this.obj.developers), newDevelopers)
        let addedDevelopers = Utils.findAdditions(ForeignKeyReference.toStringArray(this.obj.developers), newDevelopers)
        let task : TopLevelTask = this.obj
        if(addedDevelopers.length != 0) task = await this.addDevelopers(addedDevelopers)
        if(removedDevelopers.length != 0) task = await this.removeDevelopers(removedDevelopers)
        return task
    }

    //Add developers to the task
    private async addDevelopers(developers : string[]){
        let previousLength = this.obj.developers.length
        return this.save((t, devs)=>{
                if(devs.developer == null) t.developers = t.developers.slice(0, previousLength)
                else t.developers = [...t.developers, ForeignKeyReference.Builder.USER({id:devs.developer})]
            }, UpdateEndpoint.ADDDEVELOPERTASK, {developer:null}, {developer:developers[0], unassign:false},
            HTTPRequestMethod.UPDATE_PATCH)
    }

    //Remove developers from the task
    private async removeDevelopers(developers : string[]){
        let previousDevs = [...this.obj.developers]
        if(developers.length > 0) {
            return this.save((t, devs) => {
                    if (devs.developer == null) t.developers = previousDevs
                    else Utils.removeFKRElements(t.developers, [devs.developer])
                }, UpdateEndpoint.ADDDEVELOPERTASK, {developer: null}, {developer: developers[0], unassign:true},
                HTTPRequestMethod.UPDATE_PATCH)
        }
    }

    /**
     * Add a cost item to the task
     * @param costItem The cost item to add
     */
    public async addCostItem(costItem : mCostItem){
        let previousCostItems = [...this.obj.costs]
        return this.save((t, cost) => {
                if (cost == null) t.costs = previousCostItems
                else t.costs.push(cost)
            }, UpdateEndpoint.ADDCOSTITEM, null, costItem,
            HTTPRequestMethod.UPDATE_POST)
    }

    /**
     * Set the durations of this task
     * @param optimistic Optimistic duration
     * @param mostLikely Most likely duration
     * @param pessimistic Pessimistic duration
     */
    public async setDurations(optimistic : number, mostLikely:number, pessimistic:number){
        return this.save((t, durations)=> {
                t.optimistic = durations.optimistic
                t.mostLikely = durations.mostLikely
                t.pessimistic = durations.pessimistic
            },UpdateEndpoint.SETDURATIONS,
            {optimistic:this.obj.optimistic, mostLikely:this.obj.mostLikely, pessimistic : this.obj.pessimistic},
            {optimistic, mostLikely, pessimistic},
            HTTPRequestMethod.UPDATE_POST
        )
    }

    //Add skills to the task
    private async addSkills(skills : string[]){
        let previousLength = this.obj.requiredSkills.length
        return this.save((t, skills)=>{
                if(skills.skill==null) t.requiredSkills = t.requiredSkills.slice(0, previousLength)
                else t.requiredSkills = [...t.requiredSkills, skills.skill]
            }, UpdateEndpoint.ADDSKILLSTASK, {skill : null}, {skill:skills[0], remove:false},
            HTTPRequestMethod.UPDATE_POST)
    }

    //Remove skills from the task
    private async removeSkills(skills : string[]){
        let previousSkills = [...this.obj.requiredSkills]
        return this.save((t, skills) => {
                if (skills.skill==null) t.requiredSkills = previousSkills
                else Utils.removeElements(t.requiredSkills, [skills.skill])
            }, UpdateEndpoint.ADDSKILLSTASK, {skill : null}, {skill: skills[0], remove:true},
            HTTPRequestMethod.UPDATE_POST)
    }

    /**
     * Save the skills of this task
     * @param newSkills The new skills of the task to save
     */
    public async saveSkills (newSkills : string[]){
        let removedSkills = Utils.findRemovals(this.obj.requiredSkills, newSkills)
        let addedSkills = Utils.findAdditions(this.obj.requiredSkills, newSkills)
        let task : TopLevelTask = this.obj
        if(addedSkills.length != 0) task = await this.addSkills(addedSkills)
        if(removedSkills.length != 0) task = await this.removeSkills(removedSkills)
        return task
    }

    /**
     * Save the number of developers required for this task
     * @param newNumDevelopers The new number of developers
     */
    public async saveNumDevelopers(newNumDevelopers : number){
        return this.save((t, numDevs)=>{
                t.expectedNumDevelopers = numDevs.value
            }, UpdateEndpoint.NUMDEVELOPERS,{value:this.obj.expectedNumDevelopers}, {value:newNumDevelopers},
            HTTPRequestMethod.UPDATE_POST)
    }



}