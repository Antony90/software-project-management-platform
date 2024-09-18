import {Session} from "../../Services/SessionServices/Session";
import {HTTPRequestMethod} from "../../API/APIEndpoint";
import {message} from "antd";
import {Task} from "../DatabaseObjects/Task";
import {TopLevelTask} from "../DatabaseObjects/TopLevelTask";
import {User} from "../DatabaseObjects/User";
import {Utils} from "../../Services/Utils/Utils";
import {ForeignKeyReference} from "../DatabaseObjects/ForeignKeyReference";
import {Project, UpdateEndpoint} from "../DatabaseObjects/Project";
import {DatabaseObjectSaver} from "./DatabaseObjectSaver";
import GithubDetails from "common/build-models/GithubDetails";

/**
 * Project saver
 */
export class ProjectSaver extends DatabaseObjectSaver<Project>{

    /**
     * Make a new project saver
     * @param obj The project to save
     * @param onUpdateOrFail Function called when a save is complete
     */
    constructor(obj : Project, onUpdateOrFail :()=>void) {
        super(obj, Session.projectService, onUpdateOrFail);
    }

    /**
     * Save the object
     * @param setField Function to set the field of the object
     * @param updatedValueEndpoint The endpoint to send the update to
     * @param previousValue The previous value
     * @param updatedValue The new value
     * @param endpointExtras Extras required for the endpoint
     */
    override async save(setField: (t: Project, a: any) => void, updatedValueEndpoint: UpdateEndpoint, previousValue: any, updatedValue: any, endpointExtras: string = ""): Promise<any> {
        return super.save(setField, updatedValueEndpoint, previousValue, updatedValue, HTTPRequestMethod.UPDATE_POST, endpointExtras);
    }

    /**
     * Save the time frame of the project
     * @param newTimeframe The new timeframe as an array [startDate, endDate]
     */
    public async saveTimeFrame(newTimeframe : [Date, Date]){

        const [startDate, endDate] = newTimeframe

        if (startDate == null || endDate == null) {
            return message.error("Invalid number format")
        }

        let timeframeDays = (endDate.getTime() - startDate.getTime()) / (60 * 60 * 24 * 1000)

        if (startDate != this.obj.startDate) {
            await this.save((p, s) => {
                p.startDate = s.startDate
            }, UpdateEndpoint.START_DATE, {startDate:this.obj.startDate}, {startDate:startDate})
        }

        return await this.save((p, t) => {
            p.timeFrameDays = t.timeframe
        }, UpdateEndpoint.TIME_FRAME, {timeframe:this.obj.timeFrameDays}, {timeframe:timeframeDays})
    }

    /**
     * Remove a task from the project
     * @param task The task to remove
     */
    public async removeTask(task : Task){
        let previousTasks = [...this.obj.tasks]
        return this.save(
            (p,t)=>{
                if(t == null) {
                    let taskIndex = p.tasks.findIndex((oldT)=>oldT.getID()==task.getID())
                    p.tasks.splice(taskIndex, 1)
                    p.tasks = [...p.tasks]
                }
                else p.tasks = previousTasks
            },
            UpdateEndpoint.REMOVETASK,
            task,
            null,
            "/" + task.getID()
        )
            .then(()=> {
                if (task instanceof TopLevelTask){
                    this.obj.getDependentTasks(task).forEach((depTask) => {
                        let indexOfThis = depTask.dependencies.findIndex((t)=>t == task.getID())
                        if(indexOfThis != -1) depTask.dependencies.splice(indexOfThis, 1)
                    })
                    Session.projectService.cache(this.obj)
                }
            })
    }

    /**
     * Add a task to the project
     * @param task The task to add
     */
    public async addTask(task: Task){
        if(task instanceof TopLevelTask) {
            task.index = this.obj.getNewTaskIndex(task)

            return this.save(
                (p, t) => {
                    if (t == null) p.tasks = p.tasks.slice(0, p.tasks.length - 1)
                    else p.tasks = [...p.tasks, t]
                },
                UpdateEndpoint.ADDTASK,
                null,
                task
            )
        }
        else{
            return Promise.reject()
        }
    }



    /**
     * Save the budget for the project
     * @param newBudget The new budget
     */
    public async saveBudget(newBudget : number){
        return this.save((p, b) => {p.budget = b.budget},
            UpdateEndpoint.BUDGET,
            {budget:this.obj.budget},
            {budget:newBudget})

    }

    /**
     * Save the developers on the project
     * @param newDevelopers The new developers to save
     * @param currentUser The current user
     */
    public async saveDevelopers (newDevelopers : string[], currentUser : User){
        let removedDevelopers = Utils.findRemovals(ForeignKeyReference.toStringArray(this.obj.developers), newDevelopers)
        let addedDevelopers = Utils.findAdditions(ForeignKeyReference.toStringArray(this.obj.developers), newDevelopers)
        let project : Project = this.obj
        if(addedDevelopers.length != 0) project = await this.addDevelopers(addedDevelopers)
        if(removedDevelopers.length != 0) project = await this.removeDevelopers(removedDevelopers, currentUser)
        return project
    }

    //Add devs to project
    private async addDevelopers(developers : string[]){
        let previousLength = this.obj.developers.length
        return this.save((p, devs)=>{
            if(devs.developers.length == 0) p.developers = p.developers.slice(0, previousLength)
            else {
                let add = devs.developers.map((d:string)=>ForeignKeyReference.Builder.USER({id:d}))
                p.developers = [...p.developers, ...add]
            }
        }, UpdateEndpoint.CHANGE_DEVELOPERS, {developers:[]}, {developers:developers, remove:false})
    }

    //Remove devs from project
    private async removeDevelopers(developers : string[], currentUser : User){
        let previousDevs = [...this.obj.developers]
        if(Utils.removeElements(developers, [currentUser.getID()])) return Promise.reject(null)
        if(developers.length > 0) {
            return this.save((p, devs) => {
                if (devs.developers.length == 0) p.developers = previousDevs
                else Utils.removeFKRElements(p.developers, devs.developers)
            }, UpdateEndpoint.CHANGE_DEVELOPERS, {developers: []}, {developers: developers, remove:true})
        }
    }


    //Remove devs from project
    public async setGithubInfo(githubInfo : GithubDetails){
        return this.save((p, info) => {
            p.githubDetails = info
        }, UpdateEndpoint.CHANGE_GH_INFO, this.obj.githubDetails, githubInfo)
    }

}