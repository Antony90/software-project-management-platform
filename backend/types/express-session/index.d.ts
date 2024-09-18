import session from "express-session";

declare module "express-session" {
  export interface SessionData {
    userID: string;
  }
  export interface Request {
    session: session.Session & session.SessionData;
  }
}
