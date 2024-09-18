import RiskSeverity from "common/build-models/RiskSeverity";
import RiskType from "common/build-models/RiskType";
import TopLevelTask from "../../../models/TopLevelTask";
import Risk from "./Risk";

export default class TaskExceedEstimatedCost extends Risk {
    constructor(
      public task: TopLevelTask,
      public projectBudget: number
    ) {
      super("Task Exceeds Estimated Cost", RiskType.Budget);
    }

    public getDifference() { return this.task.getCurrentCost() - this.task.estimatedCost; }
  
    public getDescription(): string {
      return `The actual cost of task ${this.task.name} exceeds the estimated cost by ${this.getDifference()}`;
    }
  
    public getResolution() {
      const successorTasks = this.task.successors.map((s) => s.name);
      return {
        messages: [
          `Consider reallocating the budget of tasks which are dependent on this task: ${successorTasks.join(
            ", "
          )}`,
          "Re-evaluate the scope of this task and communicate with stakeholders to verify whether all costs were necessary",
          "Consider adding additional resources to the project to over-see task spending",
        ],
        extras: { 
          task: this.task.name,
          exceedAmount: this.getDifference(), 
          successorTasks
        },
      };
    }
  
    public evaluateSeverity(): RiskSeverity {
      const diff = this.getDifference() / this.task.estimatedCost;
      const percentOfBudget =  this.task.getCurrentCost() / this.projectBudget;
      if (diff > 1 || percentOfBudget > 0.5) {
        return RiskSeverity.Major;
      } else if (percentOfBudget > 0.2) {
        return RiskSeverity.Moderate;
      } else {
        return RiskSeverity.Minor;
      }
    }
  }