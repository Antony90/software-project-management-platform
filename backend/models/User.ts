import mUser from "common/build-models/User";
import {Types} from "mongoose";
import {Organisation} from "./Organisation";
import {ProjectDoc} from "./schemas/Project";
import {PopulatedIUser} from "./schemas/User";
import {compare, hash} from "bcrypt";

type Profile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  skillSet: string[];
  organisation: Organisation | null;
  projects: ProjectDoc[];
};

type NewUser = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
};

export class UserTaskData {
  constructor(
    public _id: Types.ObjectId,
    public firstName: string,
    public lastName: string,
    public skillSet: string[]
  ) {}
}

export class User implements mUser<Types.ObjectId, ProjectDoc, Organisation> {
  static saltRounds = 10;

  email: string;
  firstName: string;
  lastName: string;
  password: string;
  skillSet: string[];
  projects: ProjectDoc[] = [];
  organisation?: Organisation;
  _id: Types.ObjectId;

  constructor({
    email,
    firstName,
    lastName,
    password,
    skillSet,
    projects,
    _id,
    organisation,
  }: PopulatedIUser) {
    this._id = _id;
    this.email = email;
    this.firstName = firstName;
    this.lastName = lastName;
    this.password = password;
    this.skillSet = skillSet;
    this.projects = projects;
    if (organisation !== undefined) {
      this.organisation = new Organisation(organisation);
    }
  }

  /**
   * @param obj New user object, with email and password fields.
   * Note: password argument is unhashed.
   */
  public static async genUserDoc({
    email,
    firstName,
    lastName,
    password,
  }: NewUser) {
    return {
      email,
      firstName,
      lastName,
      password: await hash(password, this.saltRounds),
    } as User;
  }

  public async compareHash(password: string) {
    return await compare(password, this.password);
  }

  public static async hashPassword(password: string) {
    return await hash(password, this.saltRounds);
  }

  public getFullName() {
    return `${this.firstName}, ${this.lastName}`;
  }

  public toProfile(): Profile {
    let id = ""
    if(this._id != null) id = this._id.toString()
    return {
      id: id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      organisation: this.organisation || null,
      projects: this.projects,
      skillSet: this.skillSet,
    };
  }
}
