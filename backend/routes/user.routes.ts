import {Router} from "express";
import {Types} from "mongoose";
import {findOrganisation} from "../middlewares";
import {UserCollection} from "../models/schemas";
import {User} from "../models/User";
import {clean} from "../services/db.service";

const router = Router();


/**
 * @swagger
 *  tags: 
 *  name: User
 *  description: Update profiles, get other users
 */

/**
 * @swagger
 * /user/:
 *   get:
 *     tags: [User]
 *     summary: Get full user profile
 */
router.get("/", (req, res, next) => {
  const userID = req.session.userID;
  UserCollection.findById(userID, { password: 0 })
    .populate<User>({
      path: "organisation",
      select: "name",
    })
    .populate<User>({
      path: "projects",
      select: "_id name",
    })
    .orFail()
  .then((user) => {
    res.json({ user: clean(user) });
  }).catch(next);
});

/**
 * @swagger
 * /user/{id}/:
 *   get:
 *     tags: [User]
 *     summary: Get full user profile of an organisation member
 */
router.get("/:id", findOrganisation, async (req, res, next) => {
  const { id } = req.params;
  const { org } = req;
  if (org === undefined || !org.members.includes(new Types.ObjectId(id))) {
    return res.status(401);
  }
  // Now, user `id` is in the same organisation as session userID
  UserCollection.findById<User>(id, { password: 0 })
    .orFail()
    .exec()
  .then((userDoc) => {
    res.json({ user: clean(userDoc) });
  })
  .catch(next);
});


/**
 * @swagger
 * /user/populate:
 *   post:
 *     tags: [User]
 *     summary: Get full user profile of a list of organisation members
 */
router.post("/populate", findOrganisation, async (req, res, next) => {
  const { ids } = req.body;
  const { org } = req;
  UserCollection.find(
    { _id: { $in: ids }, organisation:org?._id },
    { password: 0, projects : 0, organisation : 0}
  )
    .orFail()
    .exec()
    .then((userDocs) => {
      res.json({ users: clean(userDocs) });
    })
    .catch(next)
});

/**
 * @swagger
 * /user/:
 *   delete:
 *     tags: [User]
 *     summary: Deletes current user's account, removing from projects and organisations
 */
router.delete("/", (req, res, next) => {
  const { userID } = req.session;
  UserCollection.findById(userID)
    .orFail()
    .exec()
    .then((userDoc) => {
      if (userDoc.projects.length > 0 || userDoc.organisation !== undefined) {
        return res
          .status(400)
          .json({
            message:
              "User is still part of project(s) or an organisation, leave first before deleting accoutn",
          });
      }

      userDoc.delete(function (err, _) {
        if (err) return next(err);
        req.session.destroy((err) => {
          if (err) return next(err);
          res.json({ message: "Account deleted" });
        });
      });
    });
});

/**
 * @swagger
 * /user/skills:
 *   patch:
 *     tags: [User]
 *     summary: Add skills to or remove skills from the user's skill set
 */
router.patch("/skills", (req, res, next) => {
  const { skills, isAdd } = req.body;
  const userID = req.session.userID;

  const operation = isAdd
    ? { $addToSet: { skillSet: { $each: skills } } }
    : { $pull: { skillSet: { $in: skills } } };
  const options = {
    runValidators: true, // Checks enum validation constraint
    new: true, // Return updated document
  };

  UserCollection.findByIdAndUpdate(userID, operation, options)
    .orFail()
    .exec()
    .then((user) => {
      res.json({ skills: user.skillSet });
    })
    .catch(next);
});

export default router;
