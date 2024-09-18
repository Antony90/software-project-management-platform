import {model, Schema, Types} from "mongoose";

import mProject from "common/build-models/Project";
import mTask from "common/build-models/Task";
import {UserTaskData} from "../User";

export type ProjectDoc = mProject<Types.ObjectId, Types.ObjectId, any, Types.ObjectId>;
export type PopulatedProject = mProject<
  Types.ObjectId,
  Types.ObjectId,
  mTask<UserTaskData>,
  UserTaskData
>;

const Project = new Schema<ProjectDoc & { lastAccessed: Date }>({
  name: { type: String, requried: true },
  projectManager: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  tasks: [{ type: Schema.Types.Mixed }],
  developers: [{ type: Schema.Types.ObjectId, ref: "User" }],
  budget: { type: Number, required: true },
  timeFrameDays: { type: Number, required: true },
  creationDate: { type: Date, default: Date.now },
  startDate: { type: Date, default: Date.now },
  lastAccessed: { type: Date },
  mood: { type: Schema.Types.Mixed },
  githubDetails: { type: Schema.Types.Mixed }
});

// Project.pre('find', function() {
//   this.
// })

export default model<ProjectDoc>("Project", Project);
