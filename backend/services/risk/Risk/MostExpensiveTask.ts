import RiskSeverity from "common/build-models/RiskSeverity";
import RiskType from "common/build-models/RiskType";
import TopLevelTask from "../../../models/TopLevelTask";
import Risk from "./Risk";

export default class MostExpensiveTask extends Risk {
    constructor(public task: TopLevelTask) {
        super("Expensive task", RiskType.Budget)
    }
    public getDescription(): string {
        return `Task ${this.task.name} is the most expensive task on the project and is pushing the project's estimated costs over budget`
    }
    public getResolution(): { messages: string[]; extras: any; } {
        return {
            messages: [`Consider reducing the estimated cost of this task`],
            extras: { task: this.task.name }
        }
    }
    public evaluateSeverity(): RiskSeverity {
        return RiskSeverity.Moderate;
    }
}