import {VERY_BAD_MOOD} from "common/build-models/Mood";
import RiskSeverity from "common/build-models/RiskSeverity";
import RiskType from "common/build-models/RiskType";
import TopLevelTask from "../../../models/TopLevelTask";
import {UserTaskData} from "../../../models/User";
import Risk from "./Risk";

// discrete value
// planning
// Mood is a value 1-4. 1 is low.
// You want the average to be in the 3-4 range over all devs.
// sample from two months? queries once a week plus extra input 
// weighted based on exact date of input to avoid weirdness with additional input
// exponential moving average
// https://en.wikipedia.org/wiki/Time-weighted_average_price

export default class SharedTaskLowMood extends Risk {
    protected static severity = 0;

    constructor(
        public developers: UserTaskData[],
        public weightedMoods: number[],
        public sharedTask: TopLevelTask
    ) {
        super("Low mood with shared tasks", RiskType.Resource)
    }


    public getDescription(): string {
        return `The following developers both have low mood scores: ${this.developers.map(d=>`${d.firstName} ${d.lastName}`).join(", ")} and are assigned to the same task: ${this.sharedTask.name}`
      }

    public getResolution() {
        let res = [];
        res.push(`Consider unassigning any of the mentioned, conflicting developers from the task ${this.sharedTask.name}`)
        let extras: any = {};
        extras.sharedTasks = this.sharedTask.name
        extras.developers = this.developers.map(d=>d._id)
        extras.moods = this.weightedMoods
        return { messages: res, extras };
    }
    public evaluateSeverity(): RiskSeverity {
        const avg = this.weightedMoods.reduce((s, m) => s + m, 0) / this.weightedMoods.length;
        if (avg <= VERY_BAD_MOOD) {
            return RiskSeverity.Major;
        } else {
            // < BAD_MOOD
            return RiskSeverity.Moderate;
        }
    }

}