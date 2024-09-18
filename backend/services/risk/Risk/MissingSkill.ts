import RiskSeverity from "common/build-models/RiskSeverity";
import RiskType from "common/build-models/RiskType";
import TopLevelTask from "../../../models/TopLevelTask";
import Risk from "./Risk";

export default class MissingSkill extends Risk {
    constructor(public skill: string, public tasksWithSkill: TopLevelTask[]) {
        super("Missing skill", RiskType.Technical)
    }
    public getDescription(): string {
        return `There currently no developers on the team with the skill ${this.skill}. It is required by the following tasks ${this.tasksWithSkill.map(t=>t.name).join(", ")}`;
    }
    public getResolution(): { messages: string[]; extras: any; } {
        const messages = [`Consider adding new developers to the team with the skill ${this.skill}`, `Consider training your current developers to be familiar with ${this.skill}`]
        const extras = { tasks: this.tasksWithSkill.map(t=>t.name) }
        return { messages, extras }
    }
    public evaluateSeverity(): RiskSeverity {
        if (this.tasksWithSkill.length > 2) {
            return RiskSeverity.Major
        }
        return RiskSeverity.Moderate;
    }
}