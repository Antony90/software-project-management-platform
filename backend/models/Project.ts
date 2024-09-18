import mProject, {DeveloperMood} from "common/build-models/Project";
import {Types} from "mongoose";
import {ProjectCollection} from "./schemas";
import TopLevelTask from "./TopLevelTask";
import {UserTaskData} from "./User";
import {PopulatedProject} from "./schemas/Project"
import GithubDetails from "common/build-models/GithubDetails"

export default class Project
  implements
    mProject<Types.ObjectId, Types.ObjectId, TopLevelTask, UserTaskData>
{
  constructor(
    public _id: Types.ObjectId,
    public name: string,
    public projectManager: Types.ObjectId,
    public tasks: TopLevelTask[],
    public developers: UserTaskData[],
    public budget: number,
    public creationDate: Date,
    public timeFrameDays: number,
    public startDate: Date,
    public mood: DeveloperMood,
    public githubDetails:GithubDetails | null

  ) {}

  static create({ name }: { name: string }) {
    return {};
  }

  static async findById(id: string | Types.ObjectId) {
    return await ProjectCollection.findById(id)
      .populate<{ developers: UserTaskData[] }>({ // Populate developers
        path: "developers",
        select: "_id firstName lastName skillSet",
      })
      .orFail()
      .exec()

  }

  static docToObj(doc: PopulatedProject) {
    // Create map from userID to populated user
    // is passed to TopLevelTask constructor to fill in user task data
    const userIDToPopulatedUser = new Map<
      string,
      UserTaskData
    >();
    doc.developers.forEach((dev) => {
      userIDToPopulatedUser.set(dev._id.toString(), dev);
    });
    return new Project(
      doc._id,
      doc.name,
      doc.projectManager,
      TopLevelTask.fromObj(doc.tasks, userIDToPopulatedUser),
      doc.developers,
      doc.budget,
      doc.creationDate,
      doc.timeFrameDays,
      doc.startDate,
      doc.mood,
      doc.githubDetails
    );
  }

  /**
   * A project is in initial state if all of its tasks are not started
   * (have undefined start date). This is vacuously true with
   * zero tasks.
   * @returns Whether the project is in initial state
   */
  public isInitial() {
    return this.tasks.reduce(
      (acc, task) => acc && task.startDate === undefined,
      true
    ) && Date.now() <= this.startDate.getTime();
  }

  public toJSON() {
    return {
      id: this._id,
      name: this.name,
      projectManager: this.projectManager,
      tasks: this.tasks.map(t => t.toJSON()),
      developers: this.developers,
      budget: this.budget,
      creationDate: this.creationDate,
      timeFrameDays: this.timeFrameDays,
      startDate: this.startDate,
      mood: this.mood,
      githubDetails: this.githubDetails
    };
  }
}
