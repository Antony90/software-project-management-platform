// exceed slack
// check num dev
//  suggest new developer, based on relative work hours
// required skills
//  then suggest developers to assign
// num subtasks complete
//  which tasks aren't complete
// for each developer,

import RiskSeverity from "common/build-models/RiskSeverity";
import RiskType from "common/build-models/RiskType";
import TopLevelTask from "../../../models/TopLevelTask";
import {UserTaskData} from "../../../models/User";
import Risk from "./Risk";

/**
 * For tasks which have not been started and whose delay exceeds the
 * allowed slack time.
 */
export default class DelayedTaskExceedSlack extends Risk {
  constructor(
    public task: TopLevelTask,
    public daysDelayed: number,
    public projectDevelopersByWorkHours: UserTaskData[]
  ) {
    super("Delayed Task", RiskType.Schedule);
  }
  public getDescription(): string {
    return `Task "${this.task.name}" has not been started and exceeded its permitted delay. Amount delayed: ${Math.floor(this.daysDelayed) + 1}, maximum allowed delay: ${this.task.slack}`;
  }
  public getResolution() {
    const extras: any = {};
    extras.task = this.task.name;
    extras.daysDelayed = this.daysDelayed;
    extras.maximumDelay = this.task.slack;

    const { requiredSkills } = this.task;
    // Filter by developers with any required skill, and also not assigned to the task already
    const validSkillDevelopers = this.projectDevelopersByWorkHours.filter(
      (developer) => {
        const { skillSet } = developer;
        return (
          requiredSkills.some((skill) => skillSet.includes(skill)) &&
          !this.task.developers.includes(developer)
        );
      }
    );

    extras.validSkillDevelopers = validSkillDevelopers.map(d=>d._id);

    // Exclude developers assigned to the task already
    const leastWorkedDevelopers = this.projectDevelopersByWorkHours
      .filter((d) => !this.task.developers.includes(d))
      .slice(0, 3);
    extras.leastWorkedDevelopers = leastWorkedDevelopers.map(d=>d._id);

    let messages = [];
    if (validSkillDevelopers.length > 0) {
      messages.push(
        `Assign additional developers with sufficient skills: ${validSkillDevelopers
          .map((d) => d.firstName + " " + d.lastName)
          .join(
            ", "
          )}, to reduce the task's estimated time and attempt to stay within the schedule constraints`
      );
    } else {
      messages.push(
        `The development team needs to prioritize the completion of this task and allocate additional resources as needed to reduce the delay and attempt to stay within the project schedule constraint`
      );
    }
    const incompleteDependencies = this.task.dependencies.filter(
      (t) => t.completedDate === undefined
    );
    extras.incompleteDependencies = incompleteDependencies.map(t=>t.name);
    if (incompleteDependencies.length > 0) {
      messages.push(
        `The following dependencies are incomplete and delaying this task: ${incompleteDependencies
          .map((t) => t.name)
          .join(", ")}`
      );
    }
    if (leastWorkedDevelopers.length > 0) {
      messages.push(
        `The following ${
          leastWorkedDevelopers.length
        } developers work the least amount of developers compared to others: ${leastWorkedDevelopers
          .map((d) => d.firstName + " " + d.lastName)
          .join(", ")}. Consider assigning these developers to this task`
      );
    }
    const critical = this.task.successors
      .filter((t) => t.isCritical())
      .map((s) => s.name);
    const nonCritical = this.task.successors
      .filter((t) => !t.isCritical())
      .map((s) => s.name);
    extras.criticalSuccessors = critical;
    extras.nonCriticalSuccessors = nonCritical;
    messages.push(
      "Consider re-evaluating the duration of tasks which are dependent on its completion: " +
        (critical.length > 0
          ? "affected critical tasks: " + critical.join(", ") + "."
          : "") +
        (nonCritical.length > 0
          ? "affected non-critical tasks: " + critical.join(", ") + "."
          : "")
    );
    return { messages, extras };
  }
  public evaluateSeverity(): RiskSeverity {
    return RiskSeverity.Major;
  }
}
