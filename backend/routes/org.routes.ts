import {Router} from "express";
import {findOrganisation} from "../middlewares";
import Organisation, {PopulatedIOrganisation,} from "../models/schemas/Organisation";
import User, {IUser} from "../models/schemas/User";
import {connection, Types} from "mongoose";
import {clean} from "../services/db.service";
import {OrgCollection, ProjectCollection, UserCollection} from "../models/schemas";
import {GithubService} from "../services/github/GithubService";
import GithubDetails from "common/build-models/GithubDetails";

const router = Router();

router.use(findOrganisation);


/**
 * @swagger
 *  tags: 
 *  name: Organisation
 *  description: Create, read, update and destroy.
 */

/**
 * @swagger
 * /org/:
 *   get:
 *     tags: [Organisation]
 *     summary: Gets all of the current user's organisations
 */
router.get("/", (req, res, next) => {
  User.findById(req.session.userID)
    .orFail()
    // type for updating type members field from ObjectId[] to IUser[]
    .populate<{ organisation?: Omit<PopulatedIOrganisation, "members"> & {members: Types.ObjectId[]} }>({
      path: "organisation",
      populate: {
        path: "members",
        select: "_id",
      },
    })
    .transform((u) => u.organisation)
    .exec()
    .then((org) => {
      if (org === undefined) {
        res.sendStatus(404);
      } else {
        org.members = org.members.map(mem => mem._id)
        res.json({ organisation: clean(org) });
      }
      // TODO: middleware for _id => id attrs recursively
    });
});

/**
 * @swagger
 * /org/{id}:
 *   get:
 *     tags: [Organisation]
 *     summary: Gets an overview of an organisation displaying name and size
 */
router.get("/:id", (req, res) => {
  const { id } = req.params;
  const { org } = req;
  OrgCollection.findById(id, { name: 1, admin: 1, members: 1 })
    .populate<{ admin: IUser }>({
      path: "admin",
      select: "firstName lastName",
    })
    .orFail()
    .exec()
    .then((thisOrg) => {
      let json : any = {
        id:thisOrg._id,
        name: thisOrg.name,
        admin: `${thisOrg.admin.firstName}, ${thisOrg.admin.lastName}`,
        numMembers: thisOrg.members.length,
      }
      if(org?._id.equals(thisOrg._id)) json.members = thisOrg.members
      res.json(json);
    })
    .catch(()=>{
      res.sendStatus(400)
    });
});


/**
 * @swagger
 * /org/join:
 *   post:
 *     tags: [Organisation]
 *     summary: User joins an organisation via its invite ID
 */
router.post("/join", (req, res, next) => {
  const { _id } = req.body;
  const { org } = req;
  if (org !== undefined) {
    return res.status(400).json({ message: "User already in an organisation" });
  }
  // User not in any org, add to org
  const update = { $push: { members: req.session.userID } };
  connection.transaction(async (session) => {
    console.log(_id, "Got id")
    const newOrg = await Organisation.findByIdAndUpdate(_id, update)
      .session(session)
      .orFail()
      .exec()
    await UserCollection.findByIdAndUpdate(req.session.userID, { $set: { organisation: newOrg.id }})
      .session(session)
      .orFail()
      .exec()
    res.json({ id: newOrg.id })
  })
});

/**
 * @swagger
 * /org/github/connect:
 *   post:
 *     tags: [Organisation]
 *     summary: Organisation is connected to GitHub using a GitHub installationID
 */
router.post("/github/connect", (req, res, next) => {
  const { installationID } = req.body;
  const {org} = req

  if (org === undefined) {
    res.sendStatus(404);
  } else {
    let update = async ()=>{
      if(installationID == null) {
        let projects : Types.ObjectId[] = []
        for (let member of org.members) {
          let add = (await User.findById(member._id).populate({
            path: "projects",
            select: "_id",
          }).exec())?.projects
          if(add != null) projects = [...projects, ...add]
        }
        await ProjectCollection.updateMany({_id: {$in: projects}}, {$set: {githubDetails: null}})
        await (new GithubService({installationID:org.githubInstallationID} as GithubDetails)).disconnectFromGithub()
      }
      await Organisation.findByIdAndUpdate(org._id, { $set: { githubInstallationID: installationID } }).orFail().exec()
    }
    update().then(()=>res.sendStatus(200)).catch(next)

  }
  // TODO: middleware for _id => id attrs recursively

});

/**
 * @swagger
 * /org/github/repos/:
 *   get:
 *     summary: Gets the possible GitHub repos for this project
 */
router.get("/github/repos", (req, res, next) => {
    const {org} = req;
    if(org === undefined) res.sendStatus(404);
    else{
      (new GithubService({installationID:org.githubInstallationID} as GithubDetails)).getSelectableConnectionData()
          .then((data)=>{
            res.json(data)
          })
          .catch(next)
    }

})




/**
 * @swagger
 * /org/create:
 *   post:
 *     tags: [Organisation]
 *     summary: Creates a new organisation with the current user as its administrator
 */
router.post("/create", async (req, res, next) => {
  const { name } = req.body;
  const { org: currOrg } = req;
  const { userID } = req.session;

  connection.transaction(async (session) => {
    if (currOrg !== undefined) {
      res.status(400).json({ message: "User already in organisation" });
    } else {
      const org = {
        name,
        admin: userID,
        members: [userID],
      };
      // Get new doc's generated ID to assign organisation to user
      const newOrg = await new Organisation(org).save({ session });
      await User.findByIdAndUpdate(userID, {
        $set: { organisation: newOrg.id },
      })
        .session(session)
        .exec();

      res.json({ id: newOrg.id, organisation: org, message: "Created organisation" });
    }
  });
});

/**
 * @swagger
 * /org/leave:
 *   post:
 *     tags: [Organisation]
 *     summary: Removes current user from the organisation. Will delete if administrator.
 */
router.post("/leave", async (req, res, next) => {
  const { userID } = req.session;
  const { org } = req;

  connection.transaction(async (S) => {
    if (org === undefined) {
      return res.status(400).json({ message: "User not in any organisation" });
    }
    let message: string;
    if (org.admin.toString() === userID) {
      // Remove organisation field for each member, then delete
      await User.updateMany(
        { _id: { $in: org.members } },
        { $unset: { organisation: "" } }
      )
        .session(S)
        .exec();
      await Organisation.findByIdAndDelete(org._id).session(S).orFail().exec();
      // TODO: Delete all projects
      // const userDoc = await UserCollection.findById(userID).session(S).orFail().exec()
      // await ProjectCollection.deleteMany({ _id: { $in: userDoc.projects } })

      message = "Admin user disbanded organisation";

    } else {
      // Update non-admin user, then remove from organisation
      await User.findByIdAndUpdate(userID, { $unset: { organisation: "" } })
        .session(S)
        .exec();
      await Organisation.findByIdAndUpdate(org._id, {
        $pull: { members: userID },
      })
        .session(S)
        .exec();
      message = "User left organisation";
    }
    return res.json({ message });
  });
});



export default router;
