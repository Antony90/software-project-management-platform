import {model, Schema, Types} from "mongoose";
import {IUser} from "./User";
import mOrganisation from "common/build-models/Organisation";

export type IOrganisation = mOrganisation<Types.ObjectId, Types.ObjectId>;
export type PopulatedIOrganisation = mOrganisation<Types.ObjectId, IUser>;


const Organisation = new Schema<IOrganisation>({
  name: {
    type: String,
    required: true,
  },
  admin: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  members: {
    type: [Schema.Types.ObjectId],
    ref: "User",
    required: true,
  },
  githubInstallationID:{
    type:String,
  }
});

export type OrganisationInfo = {};

export default model<IOrganisation>("Organisation", Organisation);
