import {model, Schema, Types} from "mongoose";

import mUser from "common/build-models/User";
import skills from "common/build-models/Skills";

import {IOrganisation} from "./Organisation";
import {ProjectDoc} from "./Project";

export type IUser = mUser<Types.ObjectId, Types.ObjectId, Types.ObjectId>;
export type PopulatedIUser = mUser<Types.ObjectId, ProjectDoc, IOrganisation>;

const User = new Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true,
  },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  password: { type: String, required: true, minLength: 5 },
  organisation: { type: Schema.Types.ObjectId, ref: "Organisation" },
  skillSet: {
    type: [{ type: String, enum: skills }],
    default: [],
  },
  projects: {
    type: [{ type: Schema.Types.ObjectId, ref: "Project" }],
    default: [],
  },
});

export default model<IUser>("User", User);
