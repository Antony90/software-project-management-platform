import Risk from "./Risk";
import RiskSeverity from "common/build-models/RiskSeverity";
import RiskType from "common/build-models/RiskType";
import TopLevelTask from "../../../models/TopLevelTask";
import {UserTaskData} from "../../../models/User";

export default class UnevenWorkDistribution extends Risk {
    constructor(public developer: UserTaskData, public relativeDeviation: number, public assignedTasks: TopLevelTask[]) {
        super("Uneven Work Hours Distribution", RiskType.Operational)
    }
    public getDescription(): string {
        const prefix = `Developer ${this.developer.firstName}, ${this.developer.lastName} `
        return prefix + `is working significantly more hours than the average developer. This can indicate lower quality work output.`
    }
    public getResolution() {
        return {
            messages: [`Unassign the developer from any of their currently assigned tasks: ${this.assignedTasks.map(t => t.name).join(', ')}`],
            extras: {
                developer: this.developer.firstName+' '+this.developer.lastName,
                assignedTasks: this.assignedTasks.map(t=>t.name)
            }
        }
    }
    public evaluateSeverity(): RiskSeverity {
        if (Math.abs(this.relativeDeviation) < 1) {
            throw new Error(`Expected abs(relativeDeviation) >= 1. Received value ${this.relativeDeviation}.`)
        } else if (this.relativeDeviation >= 2) {
            // Greater than 2 standard deviations
            return RiskSeverity.Major
        } else if (this.relativeDeviation >= 1) {
            // Greater than 1 standard deviation
            return RiskSeverity.Moderate
        } else {
            // <= 1 case
            // Underworked workers aren't necessarily a risk however, a balanced
            // work distribution helps team motivation.
            return RiskSeverity.Minor
        }
    }
}