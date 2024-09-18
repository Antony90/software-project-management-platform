import GithubDetails from "./GithubDetails";

export default interface mProject<IDType, ProjManagerType, TaskType, UserType> {
    _id: IDType;
    name: string;
    projectManager: ProjManagerType; 
    tasks: TaskType[];
    developers: UserType[];
    budget: number;
    creationDate: Date;
    timeFrameDays: number;
    startDate: Date;
    mood: DeveloperMood;
    githubDetails: GithubDetails | null
}

export type DeveloperMood = { [key: string]: number[] }

// Not sure about including this attribute
export enum ProjectComplexity {
    Simple,
    Complicated,
    Complex
}
