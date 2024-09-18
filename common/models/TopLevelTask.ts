import mCostItem from "./CostItem";
import mTask from "./Task";

export default interface mTopLevelTask<UserType> extends mTask<UserType> {
    dependencies: mTopLevelTask<UserType>[];
    estimatedCost: number;
    expectedNumDevelopers: number;
    
    requiredSkills: string[]; // TODO: should be Skill enum
    costs: mCostItem[];       // user defined costs

    startDate?: Date;
    completedDate?: Date;

    earlyStart: number;
    earlyFinish: number;
    lateStart: number;
    lateFinish: number;
}