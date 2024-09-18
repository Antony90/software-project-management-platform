import User, {PopulatedIUser} from "../models/schemas/User";
import {NextFunction, Request, Response} from "express";

export function authenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userID) {
    console.log(req.session);
    res.status(401).json({ message: "User is not authenticated" });
  } else {
    next();
  }
}

export async function findOrganisation(
  req: Request,
  res: Response,
  next: NextFunction
) {
  User.findById(req.session.userID)
    .orFail()
    .populate<PopulatedIUser>("organisation")
    .transform((user) => user.organisation)
    .exec()
    .then((org) => {
      // org can be undefined here
      req.org = org;
      next();
    })
    .catch(next);
}


export class APIException {
  enumStr: string;
  message: string;
  statusCode: number

  constructor(enumStr: string, message: string, statusCode: number) {
    this.enumStr = enumStr
    this.message = message
    this.statusCode = statusCode
  }

  // public static from(err: Error) {
  //   if (err instanceof MongooseError) {
  //     return new APIException(err.)
  //   }
  // }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // let payload: any;
  // switch (err.constructor) {
  //   case MongooseError:
  //     payload = { err. }
  // }
  console.log(err)
  return res.status(500).json({ message: "Internal Server Error", error: { name: err.name, message: err.message } })
}
