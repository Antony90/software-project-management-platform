import {Router} from "express";
import UserCollection from "../models/schemas/User";
import {authenticated} from "../middlewares";
import {User} from "../models/User";

const router = Router();

/**
 * @swagger
 *  tags: 
 *  name: Auth
 *  description: User authentication and session management
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 */
router.post("/register", async (req, res, next) => {
  const { email, firstName, lastName, password } = req.body;
  UserCollection.findOne<User>({ email })
    .exec()
    .then(async (userDoc) => {
      if (userDoc) {
        return res.status(400).json({
          message: "User already exists with supplied email",
        });
      }
      const newUserDoc = await User.genUserDoc({
        email,
        firstName,
        lastName,
        password,
      });

      UserCollection.create(newUserDoc).then((userDoc) => {
        const user = new User(newUserDoc);
        //@ts-ignore - allow deletion of non-optional field
        delete newUserDoc.password;
        req.session.userID = userDoc.id;
        let profile = user.toProfile()
        profile.id = userDoc.id
        res.json({
          profile: profile,
          message: "Successfully registered and logged in",
        });
      });
    });
});


/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Logs in an existing user
 */
router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;

  UserCollection.findOne({ email })
    .populate<User>({
      path: "organisation",
      select: "_id name",
    })
    .orFail()
    .exec()
    .then((userDoc) => {
      const user = new User(userDoc);
      user.compareHash(password).then((isValid) => {
        if (isValid) {
          req.session.userID = userDoc.id;
          res.json({ profile: user.toProfile(), message: "Logged in" });
        } else {
          res.status(400).json({ message: "Incorrect password" });
        }
      });
    })
    .catch(next);
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logs out a user and destroys their session
 */
router.post("/logout", authenticated, function (req, res, next) {
  // Remove user from `req.session.user`
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }
    res.status(200).json({ message: "Logged out" });
  });
});

export default router;
