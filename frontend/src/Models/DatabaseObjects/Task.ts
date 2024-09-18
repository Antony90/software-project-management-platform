import mTask from "common/build-models/Task"
import {DatabaseObject} from "./DatabaseObject";
import {ForeignKeyReference} from "./ForeignKeyReference";
import {User} from "./User";

export interface Task extends mTask<ForeignKeyReference<User>> { 
    subtasks : Task[]
}
export class Task extends DatabaseObject<Task>{
    getFullObject(): Promise<Task> {return Promise.resolve(this)}
    getID(): string {return this.name}
    setID(id: string) {this.name = id}


    /**
     * Construct a new task
     * @param projectID The ID of the project the task is in
     * @param name The name of the task
     * @param subtasks The subtasks in this task
     * @param developers The developers in this task
     * @param optimistic Optimistic duration
     * @param mostLikely Most Likely duration
     * @param pessimistic Pessimistic duration
     */
    constructor(
        public projectID : string,
        public name : string,
        subtasks : any[]  = [],
        developers : any[] = [],
        public optimistic: number = 0,
        public mostLikely: number = 0,
        public pessimistic: number = 0,)
    {
        super()
        if(developers != null) this.developers = ForeignKeyReference.Builder.ARRAY(developers, ForeignKeyReference.TYPE.USER)
        this.subtasks = []
        if(subtasks != null){
            subtasks.forEach((t : any)=>{
                this.subtasks.push(Task.fromObject(t, projectID))
            })
        }
        
    }


    /**
     * Get this task from a JS objecy
     * @param obj The object to use
     * @param projectID The ID of the project this task is in
     */
    static fromObject(obj : any, projectID : string) : Task{
        return new Task(projectID, obj.name, obj.subtasks,
            obj.developers, obj.optimistic,
            obj.mostLikely, obj.pessimistic)
    }
}
