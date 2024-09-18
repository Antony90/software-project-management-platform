import {Types} from "mongoose";
import {IOrganisation} from "./schemas/Organisation";

export class Organisation implements IOrganisation {
  _id: Types.ObjectId;
  name: string;
  admin: Types.ObjectId;
  members: Types.ObjectId[];

  githubInstallationID: string;

  constructor({
    name,
    admin,
    members,
    _id, githubInstallationID} : IOrganisation
  ) {
    this._id = _id;
    this.name = name;
    this.admin = admin;
    this.members = members;
    this.githubInstallationID = githubInstallationID
  }

  public displayName() {
    return `${this.name}!!`
  }


}
