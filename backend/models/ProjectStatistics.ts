import {Types} from "mongoose";

export interface IProjectStatistics {
  project: Types.ObjectId;
  // Tasks added when project not in initial state
  numTasksAdded: number; 
  // Required no. developers increased for any task
  numRequiredDevelopersIncrease: number;

}

export default class ProjectStatistics  {
  /**
   * Statistics: 
   * No. times developers in project decreases
   * No. times developers in task increases
   * 
   */
  constructor(
  ){}

  public static async findById(projectID: string | Types.ObjectId) {
    // TODO: create PS-schema
    return new ProjectStatistics()
  }

  public getAvg() {}
}