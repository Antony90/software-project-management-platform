import {IOrganisation} from "../../models/schemas/Organisation";

declare global {
  namespace Express {
    export interface Request {
      org?: IOrganisation;
    }
  }
}
