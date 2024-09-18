import RiskSeverity from "common/build-models/RiskSeverity";
import RiskType from "common/build-models/RiskType";
import TopLevelTask from "../../../models/TopLevelTask";
import {UserTaskData} from "../../../models/User";
import Risk from "./Risk";
import {VERY_BAD_MOOD} from "common/build-models/Mood";

export default class LowDeveloperMood extends Risk {
  protected static severity = 0;

  constructor(
    public developer: UserTaskData,
    public weightedMood: number,
    public assignedTasks: TopLevelTask[]
  ) {
    super("Low developer mood", RiskType.Resource);
  }

  public getDescription(): string {
    if (this.weightedMood <= VERY_BAD_MOOD) {
      return `Developer ${this.developer.firstName} ${this.developer.lastName} has expressed a significantly low average mood score of ${this.weightedMood.toString().substring(0,4)} in their 3 most recent mood submissions`;
    } else {
      return `Developer ${this.developer.firstName} ${this.developer.lastName} has expressed a low average mood score of ${this.weightedMood} in their 3 most recent mood submissions`;
    }
  }

  public getResolution() {
    let res = [];
    let extras: any = {};
    const mismatchedTasks = this.assignedTasks
      .filter((t) =>
        t.requiredSkills.some((sk) => !this.developer.skillSet.includes(sk))
      )
      .map((t) => t.name);
    extras.assignedTasks = this.assignedTasks.map((t) => t.name);
    extras.mismatchedTasks = mismatchedTasks;
    extras.developer = this.developer._id;
    extras.mood = this.weightedMood;
    if (this.assignedTasks.length > 0) {
      res.push(
        `Consider unassigning them from any of their assigned tasks: ${this.assignedTasks
          .map((t) => t.name)
          .join(", ")}, to reduce their work load`
      );
      // Filter tasks which require a skill that the developer does not posses
      res.push(
        `These tasks require skills the developer does not possess: ${mismatchedTasks.join(
          ", "
        )}. Consider unassigning the developer from these tasks`
      );
    } else {
      res.push(
        `Consider assigning the developer to a task, to increase their sense of engagement and team cohesion`
      );
    }
    return { messages: res, extras };
  }
  public evaluateSeverity(): RiskSeverity {
    if (this.weightedMood <= VERY_BAD_MOOD) {
      return RiskSeverity.Major;
    } else {
      // < BAD_MOOD
      return RiskSeverity.Moderate;
    }
  }
}
