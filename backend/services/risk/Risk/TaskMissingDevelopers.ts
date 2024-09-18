import RiskSeverity from "common/build-models/RiskSeverity";
import TopLevelTask from "../../../models/TopLevelTask";
import RiskType from "common/build-models/RiskType";
import Risk from "./Risk";
import {UserTaskData} from "../../../models/User";

export default class TaskMissingDevelopers extends Risk {
  constructor(
    public task: TopLevelTask,
    public developersByWorkHours: UserTaskData[]
  ) {
    super("Task missing developers", RiskType.Operational);
  }
  public getDescription(): string {
    return `Task ${this.task.name} is missing developers and may not be working at expected its productivity`;
  }
  public getResolution() {
    let messages: string[] = [];
    const taskDeveloperIDs = this.task.developers.map((d) => d._id);
    // Filter developers which aren't already assigned to this task
    // Still remains sorted by lowest work hours first
    const canBeAssigned = this.developersByWorkHours
      .filter((d) => !taskDeveloperIDs.includes(d._id));
    if (canBeAssigned.length > 0) {
      messages.push(
        `Consider assigning any of the following developers with the lowest amount of hours worked: ${canBeAssigned.map((d) => d.firstName + " " + d.lastName).join(
          ", "
        )}`
      );
    }
    return {
      messages,
      extras: { task: this.task.name, canBeAssigned: canBeAssigned.map(d=>d._id) },
    };
  }
  public evaluateSeverity(): RiskSeverity {
    if (this.task.slack === 0) {
      return RiskSeverity.Major;
    } else {
      return RiskSeverity.Moderate;
    }
  }
}
