import Risk from "./Risk";

import RiskSeverity from "common/build-models/RiskSeverity";
import RiskType from "common/build-models/RiskType";

import {UserTaskData} from "../../../models/User";
import TopLevelTask from "../../../models/TopLevelTask";


export default class SkillMismatch extends Risk {
  constructor(public user: UserTaskData, public task: TopLevelTask, public projectDevelopers: UserTaskData[], public missingSkills: string[]) {
    super("Skill mismatch", RiskType.Operational);
  }

  getDescription(): string {
    return `Developer \"${this.user.firstName}\" has insufficient skills for task ${this.task.name}. Missing skills: ${this.missingSkills.join(", ")}`
  }
  getResolution() {
    const extras: any = {};
    // Filter by developers with any required skill
    const validSkillDevelopers = this.projectDevelopers.filter(developer => {
      const { skillSet } = developer;
      return this.task.requiredSkills.some(skill => skillSet.includes(skill));
    });
    extras.developer = `${this.user.firstName} ${this.user.lastName}` ;
    extras.task = this.task.name;
    extras.missingSkills = this.missingSkills;
    extras.validSkillDevelopers = validSkillDevelopers.map(d=>d._id).filter(id => id !== this.user._id);
    const messages = [
      `Developer \"${this.user.firstName}\" must obtain the following skills: ${this.missingSkills.join(", ")} or be assigned to another task.`
    ]
    if (validSkillDevelopers.length > 0) {
      messages.push(`Alternatively, assign any of the following developers, who collectively fulfill the task's skill requirements; ${validSkillDevelopers.map(d=>d.firstName+' '+d.lastName).join(', ')}`)
    }
    return { messages, extras };
  }

  evaluateSeverity(): RiskSeverity {
    const numMissingSkills = this.missingSkills
    const percentMissing = numMissingSkills.length / this.task.requiredSkills.length;
    if (percentMissing > 0.5) {
      return RiskSeverity.Moderate
    } else {
      return RiskSeverity.Minor
    }
  }
}
