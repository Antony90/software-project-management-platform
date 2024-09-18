import mCostItem from "common/build-models/CostItem";
import mTopLevelTask from "common/build-models/TopLevelTask"
import {ForeignKeyReference} from "./ForeignKeyReference";
import {Task} from "./Task";
import {User} from "./User";
import {ColourPair, ColourScheme} from "../../Components/Styles/ColourScheme";
import {Project} from "./Project";


export class TopLevelTask extends Task implements mTopLevelTask<ForeignKeyReference<User>>{


    //Estimated start date of the project
    public estimatedStartDate : Date = null

    //The index of this task in the project's array
    public index : number = null

    /**
     * Construct a new task
     * @param projectID The ID of the project this task is in
     * @param projectStartDate The start date of the project this task is in
     * @param name The name of the task
     * @param subtasks The subtasks of this task
     * @param developers The developers in this task
     * @param dependencies The dependencies of this task
     * @param optimistic The optimistic duration of this task
     * @param mostLikely The most likely duration of this task
     * @param pessimistic The pessimistic duration of this task
     * @param estimatedCost The estimated cost of this task
     * @param requiredSkills The skills required for this task
     * @param startDate The start date of this task
     * @param completedDate The completion date of this task
     * @param expectedNumDevelopers The number of developers expected to work on this task
     * @param costs The costs of this task
     * @param earlyStart The calculated early start date of the task
     * @param earlyFinish The calculated early finish date of the task
     * @param lateStart The calculated late start date of the task
     * @param lateFinish The calculated late finish date of the task
     */
    constructor(
        projectID : string,
        projectStartDate : Date,
        name : string,
        subtasks : any[]  = [],
        developers : any[] = [],
        public dependencies: any[] = [],
        optimistic : number = 0,
        mostLikely : number = 0,
        pessimistic : number = 0,
        public estimatedCost : number = 0,
        public requiredSkills : string[] = [],
        public startDate : Date = null,
        public completedDate : Date = null,
        public expectedNumDevelopers: number = 0,
        public costs: mCostItem[] = [],    // user defined costs
        public earlyStart: number = 0,
        public earlyFinish: number = 0,
        public lateStart: number = 0,
        public lateFinish: number = 0,
    ){
        super(projectID, name, subtasks, developers, optimistic, mostLikely, pessimistic)
        this.estimatedStartDate = new Date(projectStartDate.getTime() + ((earlyStart+lateStart)/2)*24*60*60*1000)
    }

    /**
     * Check if the task is complete
     */
    public isComplete(){
        return this.completedDate != null
    }


    //Get the duration of this task
    private getDuration() : number{
        let start = this.getStartDate()
        let end = this.getEndDate()
        return end.getTime() - start.getTime()
    }


    //Get the estimated duration of this task
    private getEstimatedDuration() : number{
        let duration = ((this.lateFinish+this.earlyFinish)-(this.lateStart+this.earlyStart))/2
        if(duration != 0) return duration *24*60*60*1000
        else return ((this.optimistic + this.mostLikely + this.pessimistic)/3)*24*60*60*1000
    }

    /**
     * Get the time frame of this task
     * @param actualIfPossible Use input values if they exist
     */
    public getTimeFrame(actualIfPossible :boolean) : {startDate:Date, endDate:Date, duration : number}{
        if(actualIfPossible) return {startDate:this.getStartDate(), endDate:this.getEndDate(), duration:this.getDuration()}
        else return {startDate:this.getEstimatedStartDate(), endDate:this.getEstimatedEndDate(), duration:this.getEstimatedDuration()}
    }

    //Get the start date of this task
    private getStartDate() : Date{
        return this.startDate == null ? this.getEstimatedStartDate() : this.startDate
    }

    //Get the estimated start date of the task
    private getEstimatedStartDate() : Date{
        return this.estimatedStartDate
    }

    //Get the end date of this task
    private getEndDate() : Date{
        return this.completedDate == null ? new Date(this.getStartDate().getTime() + this.getEstimatedDuration()) : this.completedDate
    }

    //Get the estimated end date of this task
    private getEstimatedEndDate() : Date{
        return new Date(this.estimatedStartDate.getTime() + this.getEstimatedDuration())
    }

    /**
     * Checks if this task has user input times
     */
    public hasActualTimes(): boolean{
        return this.startDate != null || this.completedDate != null
    }

    /**
     * Get the completion status of this task
     */
    public getCompletionStatus() : {name:string, colour:ColourPair, completionProgressNumber:number}{
        if(this.isComplete()) return {name:"Complete", colour:ColourScheme.complete, completionProgressNumber:2}
        if(this.startDate == null) return {name : "Not Started", colour : ColourScheme.notStarted, completionProgressNumber:0}
        return {name : "In Progress", colour:ColourScheme.inProgress, completionProgressNumber:1}
    }

    /**
     * Get this task from a JS object
     * @param obj The object to use
     * @param projectID The ID of the project this task is in
     * @param projectStartDate The start date of the project this task is in
     */
    static override fromObject(obj : any, projectID:string, projectStartDate? : Date) : TopLevelTask{
        let taskStartDate = obj.startDate == null ? obj.startDate : new Date(obj.startDate)
        let taskCompleteDate = obj.completedDate == null ? obj.completedDate : new Date(obj.completedDate)
        return new TopLevelTask
        (
            projectID,
            projectStartDate,
            obj.name,
            obj.subtasks,
            obj.developers,
            obj.dependencies,
            obj.optimistic,
            obj.mostLikely,
            obj.pessimistic,
            obj.estimatedCost,
            obj.requiredSkills,
            taskStartDate,
            taskCompleteDate,
            obj.expectedNumDevelopers,
            obj.costs,
            obj.earlyStart,
            obj.earlyFinish,
            obj.lateStart,
            obj.lateFinish,
        )
    }

    /**
     * Get the dependencies of a task
     * @param t The task to get the dependencies of
     * @param tasks The current array of project tasks
     */
    static getTaskDependencies(t : TopLevelTask, tasks : TopLevelTask[]){
        if(t==null) return []
        let dependencies : string[] = [t.getID()]
        t.dependencies.forEach((newT)=>{
            dependencies = [...dependencies, ...this.getTaskDependencies(tasks.find((task)=>task.getID() == newT), tasks)]
        })
        return dependencies
    }

    static getDependentOn(task : TopLevelTask, tasks : TopLevelTask[]){
        if(task == null) return []
        return tasks.filter((t)=>t.dependencies.find((dep)=>dep==task.getID()) != null)
    }

    /**
     * Get the tasks which can be dependencies of this task
     * @param t The task
     * @param tasks The current array of project tasks
     */
    static getTaskPossibleNewDependencies(t : TopLevelTask, tasks : TopLevelTask[]){
        let taskDependencies = this.getTaskDependencies(t, tasks)
        let dependentOn = this.getDependentOn(t, tasks)
        let currentDeps = t == null? [] : t.dependencies.map((dep)=>tasks.find((task)=>task.getID()==dep))
        return Project.tasksNameSorted([...currentDeps, ...tasks.filter((task)=>
            taskDependencies.find((dep)=>dep == task.getID()) == null && dependentOn.find((dep)=>dep.getID() == task.getID()) == null
        )])
    }

    override async getFullObject(): Promise<TopLevelTask> {
        return Promise.resolve(this)
    }

    /**
     * Check if this task is started
     */
    public isStarted(){
        return this.startDate != null
    }

    /**
     * Get the total cost of this task
     */
    public getTotalCost(){
        let cost = 0
        this.costs.forEach((c)=>{
            cost += c.cost
        })
        return cost
    }

    /**
     * Get the percentage of the budget used
     */
    public getPercentageBudgetUsed(){
        let fraction = this.getTotalCost() / this.estimatedCost
        let hundredPercent = fraction * 10000
        hundredPercent = Math.round(hundredPercent)
        return hundredPercent/100
    }
}
