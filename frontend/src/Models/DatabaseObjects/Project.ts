import mProject, {DeveloperMood} from "common/build-models/Project"
import {Session} from "../../Services/SessionServices/Session";
import {DatabaseObject} from "./DatabaseObject";
import {ForeignKeyReference} from "./ForeignKeyReference";
import {TopLevelTask} from "./TopLevelTask";
import {User} from "./User";
import {useEffect, useState} from "react";
import {message} from "antd";
import {useNavigate} from "react-router-dom";
import {useForceUpdate} from "../../Components/Utils/UpdateComponent";
import dayjs from "dayjs";
import {RiskSuggestion} from "../Risk/RiskSuggestion";
import {RiskBreakdown} from "../Risk/RiskBreakdown";
import {Task} from "./Task";
import {ProjectSaver} from "../DatabaseObjectSavers/ProjectSaver";
import GithubDetails from "common/build-models/GithubDetails"


export enum UpdateEndpoint{
    CHANGE_DEVELOPERS = "/developer",
    BUDGET = "/budget",
    START_DATE = "/startdate",
    TIME_FRAME = "/timeframe",
    ADDTASK = "/newtask",
    REMOVETASK = "/delete",

    ADDSKILLS = "/skills",

    RENAMETASK = "/rename",

    COMPLETETASK = "/complete",

    STARTTASK = "/start",

    ADDDEVELOPERTASK = "/assignee",

    ADDCOSTITEM = "/addcostitem",

    SETDURATIONS = "/setduration",

    ADDSKILLSTASK =  "/updateskills",

    NUMDEVELOPERS = "/numdevelopers",

    CHANGE_GH_INFO = "/githubinfo"


}

/**
 * A project
 */
export interface Project extends mProject<string, ForeignKeyReference<User>, TopLevelTask, ForeignKeyReference<User>>{}
export class Project extends DatabaseObject<Project>{

    
    /**
     * Construct a new project
     * @param name The name of the project
     * @param creationDate The creation date of the project
     * @param budget The budget of the project
     * @param timeFrameDays The time frame for the project
     * @param risk The risk of the project failing
     * @param projectManager The project manager
     * @param tasks The top level tasks in the project
     * @param developers The developers on the project
     * @param _id The id of the project
     * @param startDate The startDate of the project
     * @param breakdown The risk breakdown of the project
     * @param suggestions The risk suggestions for the project
     * @param mood The developer mood about the project
     * @param projectedCompletion The estimated completion date of the project
     * @param githubDetails Github details for this project
     */
    constructor(
        public name: string,
        public creationDate: Date,
        public budget: number,
        public timeFrameDays : number = 0,
        public startDate  : Date = null,
        public risk: number = null,
        projectManager: any = null,
        tasks: any[] = null,
        developers: any[] = null,
        public _id: string = null,
        public breakdown : RiskBreakdown = null,
        public suggestions : RiskSuggestion[] = [],
        public mood:DeveloperMood = null,
        public projectedCompletion: number = null,
        public githubDetails : GithubDetails = null
    ){
        super()
        this.creationDate = new Date(creationDate)
        this.startDate = new Date(startDate)
        if(projectManager != null) this.projectManager = ForeignKeyReference.Builder.USER(projectManager)
        if(developers != null) this.developers = ForeignKeyReference.Builder.ARRAY(developers, ForeignKeyReference.TYPE.USER)
        if(tasks != null){
            this.tasks = tasks.map((t)=>TopLevelTask.fromObject(t, this.getID(), this.startDate))
            this.tasks = this.getTaskDependencyList().map((id)=>this.tasks.find((t)=>t.getID() == id))
        }
        
    }

    /**
     * Check if the project has any concrete times added
     */
    public hasAnyActualTimes(): boolean{
        for(let t of this.tasks){
            if(t.hasActualTimes()) return true
        }
        return false

    }

    /**
     * Get tasks sorted by date
     * @param tasks The tasks to sort
     * @param actualIfPossible Whether to use the actual user input dates if possible
     * @return The sorted tasks
     */
    public static tasksDateSorted(tasks : TopLevelTask[], actualIfPossible:boolean){
        return [...tasks].sort((t1:TopLevelTask, t2:TopLevelTask)=>{
            let diff = t1.getTimeFrame(actualIfPossible).startDate.getTime() - t2.getTimeFrame(actualIfPossible).startDate.getTime()
            if(diff != 0) return diff
            return t1.getTimeFrame(actualIfPossible).endDate.getTime() - t2.getTimeFrame(actualIfPossible).endDate.getTime()
        })
    }

    /**
     * Get tasks sorted by name
     * @param tasks The tasks to sort
     * @return The sorted tasks
     */
    public static tasksNameSorted(tasks : Task[]){
        return [...tasks].sort((t1, t2)=>{return t1.name.localeCompare(t2.name)})
    }

    /**
     * Get the project from a JS object API response
     * @param obj The obj parsed from JSON
     * @return The project
     */
    static fromResponse(obj : any) : Project{
        obj.project.suggestions = []
        if(obj.suggestions != null) obj.project.suggestions = obj.suggestions
        if(obj.breakdown != null) {
            obj.project.breakdown = obj.breakdown
            if (obj.breakdown.projectedCompletion !== undefined) obj.project.projectedCompletion = obj.breakdown.projectedCompletion
        }
        return Project.fromObject(obj.project)
    }


    /**
     * Returns if the current user is the manager of this project
     * @param currentUser The current user
     */
    public isProjectManager(currentUser : User) : boolean{
        return currentUser.getID() == this.projectManager.getID()
    }

    /**
     * Get the project from a JS object
     * @param obj The obj to convert
     * @return The project
     */
    static fromObject(obj : any) : Project{
        let id = obj._id
        if(id == null) id = obj.id
        return new Project(obj.name, new Date(obj.creationDate), obj.budget, obj.timeFrameDays,
            obj.startDate, obj.risk, obj.projectManager, obj.tasks, obj.developers, id, RiskBreakdown.fromObject(obj.breakdown),
            obj.suggestions?.map((suggestion:any)=>RiskSuggestion.fromObject(suggestion)),
            obj.mood, obj.projectedCompletion, obj.githubDetails)
    }

    /**
     * Parse JSON of a project
     * @param s The JSON
     * @returns The project encoded in the JSON
     */
    static fromJSON(s : string) : Project{
        var p = JSON.parse(s)
        return this.fromObject(p)
    }

    /**
     * Get the end date of this project
     */
    public getEndDate() : Date{
        return new Date(this.startDate.getTime() + this.timeFrameDays * 24 * 60 * 60 * 1000)
    }


    /**
     * Get the total completion of the project as a percentage
     */
    public getCompletionPercentage() : number{
        let total = 0
        this.tasks.forEach((t)=>{
            if(t.isComplete()) total++
        })
        return Math.round((total/this.tasks.length) * 100)
    }


    /**
     * Get the progress with respects to the user defined timeframe for the project
     */
    public getTimeframeProgressPercentage(){
        let now = Date.now()
        let timePassedSinceStart =  now - this.startDate.getTime()
        let millisToComplete = this.timeFrameDays * 24 * 60 * 60 * 1000
        let percentage = Math.round((timePassedSinceStart / millisToComplete) * 100)
        return percentage < 100 ? percentage : 100
    }

    /**
     * Check if the project has exceeded the timeframe
     */
    public hasExceededTimeFrame(){
        return this.getTimeframeProgressPercentage() == 100
    }

    /**
     * Check if the project is complete
     */
    public isComplete(){
        return this.getCompletionPercentage() == 100
    }

    /**
     * Get the number of days until this project is complete
     */
    public getDaysUntilCompletion(){
        let now = Date.now()
        let timePassedSinceStart =  now - this.startDate.getTime()
        let timeUntilCompletion = (this.timeFrameDays * 24 * 60 * 60 * 1000) - timePassedSinceStart
        let days = Math.round(timeUntilCompletion / (24 * 60 * 60 * 1000))
        return days >= 0 ? days : 0
    }

    /**
     * Get the number of days until this project starts
     */
    public getDaysUntilStart(){
        let timeUntilStart = this.startDate.getTime() - Date.now()
        return Math.round(timeUntilStart / (24 * 60 * 60 * 1000))
    }


    /**
     * Get the timeframe of this project for use with a [RangePicker]
     */
    public getTimeFrame() : [dayjs.Dayjs, dayjs.Dayjs]{
        return([dayjs(this.startDate), dayjs(this.getEndDate())])
    }

    /**
     * Get the index of a new task in the task array
     * @param t The task to index
     */
    public getNewTaskIndex(t : TopLevelTask){
        let dependencyList = this.getTaskDependencyList()
        let largestIndex = t.dependencies.map((dependency)=>dependencyList.indexOf(dependency)).sort((a, b)=>b-a)[0]
        if(largestIndex == null) return 0
        else return largestIndex + 1
    }

    /**
     * Check if the project has failed
     */
    public hasFailed(){
        return !this.isComplete() && this.hasExceededTimeFrame()
    }


    /**
     * Get the list of tasks ordered in a dependency oriented way
     */
    public getTaskDependencyList(){
        let dependencyList : string[] = []
        this.tasks.forEach((t)=>{
            let largestIndex = t.dependencies.map((dependency)=>dependencyList.indexOf(dependency)).sort((a, b)=>b-a)[0]
            if(largestIndex == null)dependencyList.splice(0, 0, t.getID())
            else dependencyList.splice(largestIndex+1, 0, t.getID())
        })
        return dependencyList
    }


    /**
     * Gets the tasks which are dependent on a specifc task
     * @param task The task to find tasks which depend on
     */
    public getDependentTasks(task : TopLevelTask){
        let tasks : TopLevelTask[] = []
        this.tasks.forEach((t)=>{
            if(t.dependencies.find((dep)=>dep == task.getID()) != null) tasks.push(t)
        })
        return tasks
    }

    setID(id: string) {this._id = id}
    getID(): string {return this._id}
    async getFullObject(): Promise<Project> {return Session.projectService.get(this.getID())}
}

/**
 * Hook to use a project
 * @param projectID The id of the project
 * @param setLoading Function to use to set loading of parent
 * @param fromCache If the project should be got from the cache
 */
export function useProject(projectID : string, setLoading : (b:boolean)=>void = ()=>{}, fromCache = true)
    : [Project, ProjectSaver, (p:Project)=>void]{

    const navigate = useNavigate()
    const update = useForceUpdate()
    const [project, setProject] = useState<Project>(null)
    const [projectSaver, setProjectSaver] = useState<ProjectSaver>(null)


    useEffect(()=>{
        setLoading(true)
        Session.projectService.get(projectID, false, fromCache)
            .then((p: Project)=>{
                setProject(p)
                setProjectSaver(new ProjectSaver(p, ()=>update))
            })
            .catch(()=>{
                message.error("Failed to load project")
                navigate(-1)
            })
            .finally(()=>setLoading(false))
    }, [])



    const _setProject = (p:Project)=>{
        setProjectSaver(new ProjectSaver(project, ()=>update))
        setProject(p)
    }



    return [project, projectSaver, _setProject]
}