import mCostItem from "common/build-models/CostItem";
import mTopLevelTask from "common/build-models/TopLevelTask";
import {Task} from "./Task";
import {UserTaskData} from "./User";

export type TopLevelTaskTemplate = {
  name: string;
  dependencies: string[];
  estimatedCost: number;
  optimistic: number;
  mostLikely: number;
  pessimistic: number;
  expectedNumDevelopers: number;
  requiredSkills: string[];
};

export default class TopLevelTask
  extends Task
  implements mTopLevelTask<UserTaskData>
{
  constructor(
    public dependencies: TopLevelTask[],
    public estimatedCost: number,
    public optimistic: number,
    public mostLikely: number,
    public pessimistic: number,
    public expectedNumDevelopers: number,
    public requiredSkills: string[],
    public name: string,
    public subtasks: Task[],
    public developers: UserTaskData[],
    public earlyStart: number,
    public earlyFinish: number,
    public lateStart: number,
    public lateFinish: number,
    public slack: number,
    public costs: mCostItem[],
    public startDate?: Date,
    public completedDate?: Date,
    public successors: TopLevelTask[] = []
  ) {
    super(
      name, subtasks, developers,
      optimistic, mostLikely, pessimistic
    );
    for (const pred of this.dependencies) {
      pred.successors.push(this);
    }
  }

  static create({
    name, dependencies, estimatedCost,
    optimistic, mostLikely, pessimistic,
    expectedNumDevelopers, requiredSkills,
  }: any) {
    if (
      optimistic > mostLikely ||
      optimistic > pessimistic ||
      mostLikely > pessimistic
    ) {
      throw Error(
        `Task "${name}": Time estimations for pessimistic, most likely and optimistic must be in decreasing order.`
      );
    }
    const nonZero = [estimatedCost, optimistic, mostLikely, pessimistic, expectedNumDevelopers,].reduce((acc: boolean, val) => acc && val >= 0, true);
    if (!nonZero) {
      throw Error(`All numerical attributes must be at least 0`);
    }

    // Controls default values
    return {
      dependencies, estimatedCost, optimistic, mostLikely,
      pessimistic, expectedNumDevelopers, requiredSkills,
      name, subtasks: [], developers: [], earlyStart: 0, 
      earlyFinish: 0, lateStart: 0, lateFinish: 0, slack: 0, costs: [],
    };
  }

  public getActualDuration() {
    if (this.completedDate !== undefined && this.startDate !== undefined) {
      return (this.completedDate.getTime() - this.startDate.getTime()) / (1000 * 3600 * 24)
    } else {
      return undefined
    }
  }

  public getCurrentCost() {
    return this.costs.reduce(
      (sum: number, costItem: mCostItem) => sum + costItem.cost,
      0
    );
  }

  public isComplete() {
    return this.completedDate !== undefined && this.startDate !== undefined;
  }
  
  public isStartedAndIncomplete() {
    return this.completedDate === undefined && this.startDate !== undefined;
  }
  
  public notStarted() {
    return this.completedDate === undefined && this.startDate === undefined;
  }

  public calculateEarlyTime() {
    this.earlyStart = 0;
    this.earlyFinish = this.calcEstDuration();
    for (const pred of this.dependencies) {
      this.earlyStart = Math.max(pred.earlyFinish, this.earlyStart);
    }
    this.earlyFinish = this.earlyStart + this.calcEstDuration();
  }
  

  public calculateLateTime() {
    this.lateFinish = this.earlyFinish;
    for (const succ of this.successors) {
      this.lateFinish = Math.min(succ.lateStart, this.lateFinish);
    }
    this.lateStart = this.lateFinish - this.calcEstDuration();
  }

  public calculateSlack() {
    this.slack = this.lateStart - this.earlyStart;
  }

  public isCritical() {
    return this.slack === 0;
  }

  /**
   * Convert references to other tasks, to task names. Prevents
   * circular JSON structure
   * @returns JSON of object, without object references
   */
  public toJSON() {
    const obj: any = {...this}
    obj.dependencies = this.dependencies.map((dep) => dep.name)
    delete obj.successors;
    obj.developers = this.developers.map(d => {
      if(d === undefined) return null
      else return d._id
    })
    if (this.startDate === undefined) {
      delete obj.startDate;
    }
    if (this.completedDate === undefined) {
      delete obj.completedDate;
    }
    return obj
  }

  static fromObj(
    obj: any[],
    userIDToPopulatedUser: Map<string, UserTaskData>
  ): TopLevelTask[] {
    const taskNameToObj = new Map<string, TopLevelTask>();
    return obj.map((task) => {
      const dependencies = (task.dependencies as string[]).map((taskName) => {
        const depObj = taskNameToObj.get(taskName);
        if (depObj === undefined) {
          throw Error(
            `Task ${task.name} has an invalid dependency: ${taskName} (cyclic or dependency doesn't exist)`
          );
        }
        return depObj;
      });
      const developers = task.developers.map((userID: string) => {
        const d = userIDToPopulatedUser.get(userID.toString())
        if (d === undefined) {
          throw Error(`Dev is undefined with userID: ${userID}, for task: ${task.name}`)
        }
        return d;
      });
      const taskObj = new TopLevelTask(
        dependencies,
        task.estimatedCost,
        task.optimistic,
        task.mostLikely,
        task.pessimistic,
        task.expectedNumDevelopers,
        task.requiredSkills,
        task.name,
        task.subtasks, // TODO: Task.staticmethod
        developers,
        task.earlyStart,
        task.earlyFinish,
        task.lateStart,
        task.lateFinish,
        task.slack,
        task.costs,
        task.startDate,
        task.completedDate
      );
      taskNameToObj.set(task.name, taskObj);
      return taskObj;
    });
  }


  public static testTaskInit() {
    const task = (name: string, dependencies: string[]) => ({
      estimatedCost: "aaa",
      optimistic: 0,
      mostLikely: 0,
      pessimistic: 0,
      expectedNumDevelopers: 0,
      requiredSkills: [],
      name,
      dependencies,
      subtasks: [],
      developers: [],
      earlyStart: 0,
      earlyFinish: 0,
      lateStart: 0,
      lateFinish: 0,
      slack: 0,
      costs: [],
    });

    const tasks = [
      task("A", []),
      task("B", []),
      task("C", ["A", "B"]),
      task("D", ["C", "A"]),
      task("E", ["B", "C"]),
      task("F", ["C", "E"]),
    ];
    console.log(TopLevelTask.fromObj(tasks, new Map()));
  }
}
