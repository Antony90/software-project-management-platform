import {DeveloperMood} from "common/build-models/Project";
import Skills from "common/build-models/Skills";
import Mood from "common/build-models/Mood";
import {Router} from "express";
import {connection} from "mongoose";
import {findOrganisation} from "../middlewares";
import {ProjectCollection, SavedEvaluation, UserCollection} from "../models/schemas";
import TopLevelTask from "../models/TopLevelTask";
import {UserTaskData} from "../models/User";
import {clean} from "../services/db.service";
import ProjectEvaluator from "../services/risk/ProjectEvaluator";
import GithubDetails from "common/build-models/GithubDetails";

const router = Router();

/**
 * @swagger
 *  tags: 
 *  name: Project
 *  description: Create and update projects, evaluate risk
 */

/**
 * @swagger
 * /project/:
 *   post:
 *     tags: [Project]
 *     summary: Creates a new project and evaluates its risk of failure
 */
router.post("/", findOrganisation, (req, res, next) => {
  var { name, tasks, developers, budget, timeFrameDays, startDate } = req.body;
  const { org } = req;
  const { userID } = req.session
  if (org === undefined)
    return res.status(400).json({ message: "Organisation required" });

  // Check all developers are in user's organisation
  const orgMemberIDs = org.members.map((oID) => oID.toString());
  const allDevelopersInOrg = (developers as string[]).reduce(
    (prev: boolean, devID: string) => {
      return prev && orgMemberIDs.includes(devID);
    },
    true
  );

  if (!allDevelopersInOrg)
    return res.status(400).json({
      message: "One or more developers listed aren't in user's organisation",
    });
  // Add project manager to developers and ensure no duplicate IDs
  developers = [... new Set([userID, ...developers])];

  // Initially neutral developer moods
  const mood: DeveloperMood = {}
  for (const dev of developers) {
    mood[dev] = [Mood.Neutral, Mood.Neutral, Mood.Neutral, Mood.Neutral, Mood.Neutral]
  }
  const newProject = {
    name,
    projectManager: userID,
    tasks: tasks.map(TopLevelTask.create),
    developers,
    budget,
    timeFrameDays,
    startDate,
    mood,
    githubDetails: null
  };
  console.log("Received order", newProject.tasks.map((t:any) => t.name))
  console.log("Made mood", mood)
  connection.transaction(async () => {
    // Create the project
    const doc = await ProjectCollection.create(newProject);
    const populatedDoc = await doc.populate<{ developers: UserTaskData[] }>({
      path: "developers",
      select: "_id firstName lastName skillSet",
    });

    // For each developer add project ID to their projects
    await UserCollection.updateMany(
      { _id: { $in: doc.developers } },
      { $push: { projects: doc.id } }
    )
    const result = await ProjectEvaluator.evaluate(populatedDoc.id)
    // // Update calculated start/finish times
    // await ProjectCollection.findByIdAndUpdate(populatedDoc.id, { $set: { tasks: result.project.tasks }})
    res.json(clean(result));
  }).catch(next);
});

/**
 * @swagger
 * /project/{id}:
 *   get:
 *     tags: [Project]
 *     summary: Gets a project via ID and re-evaluates its risk if previous evaluation is older than 1 day.
 */
router.get("/:id", (req, res, next) => {
  const { id } = req.params;
  const { userID } = req.session;
  const { refresh } = req.query;

  ProjectEvaluator.findById(id, userID, Boolean(refresh)).then(project => {
    if (project === undefined) {
      res.sendStatus(404);
    } else {
      // Will exclude risk breakdown if user not project manager
      res.json(project)
    }
  }).catch(next)
})

/**
 * @swagger
 * /project/:
 *   post:
 *     tags: [Project]
 *     summary: Gets a list of projects given a list of IDs
 */
router.post("/populate", (req, res, next) => {
  const ids: string[] = req.body.ids;
  const { userID } = req.session;
  Promise.all(ids.map(async (id) => {
    // Will exclude risk breakdown if user not project manager
    // Is undefined if does not exist or user not contributor
    return await ProjectEvaluator.findById(id, userID, false)
  }))
      .then((projects)=>res.json({projects:projects}))
      .catch(next)

});

/**
 * @swagger
 * /project/{id}/developer:
 *   patch:
 *     tags: [Project]
 *     summary: Adds or removes developers from a project given they are in the same organisation
 */
router.post("/:id/developer", findOrganisation, (req, res, next) => {
  const { org } = req;
  if (org === undefined) {
    return res.json({ message: 'Organisation required' })
  }
  const { remove, developers } = req.body;
  const { id } = req.params;
  const { userID } = req.session

  ProjectCollection.findById(id).orFail().then(async (project) => {
    if (project.projectManager.toString() !== userID) {
      res.status(403)
      return res.json({ message: 'Must be project manager to perform action' })
    }
    // Check all developers in organisation
    const members = new Set(org.members.map(v => v.toString()));
    const allDevelopersInOrg = (developers as string[]).reduce((truth, dev) => truth && members.has(dev), true);
    if (!allDevelopersInOrg) {
      return res.json({ message: 'Not all developers are in the organisation' })
    }

    const updateUser = remove ? { $pull: { projects: id }} : { $addToSet: { projects: id }};
    let newMood: any = project.mood;
    if (remove) {
      developers.forEach((devID: string) => {
        delete newMood[devID];
      })
    } else {
      developers.forEach((devID: string) => {
        newMood[devID] = [Mood.Neutral, Mood.Neutral, Mood.Neutral, Mood.Neutral, Mood.Neutral];
      })
    }
    const updateProj = remove ? 
      { $pull: { developers: { $in: developers } }, $set: { mood: newMood } } : 
      { $addToSet: { developers: { $each: developers } }, $set: { mood: newMood } };
    await ProjectCollection.findByIdAndUpdate(id, updateProj).exec();
    await UserCollection.updateMany({ _id: {$in: developers }}, updateUser).exec();
    res.json({ message: 'Updated project' });
    
  }).catch(next)
})

/**
 * @swagger
 * /project/{id}/newtask:
 *   post:
 *     tags: [Project]
 *     summary: Creates a new task for the selected project
 */
router.post("/:id/newtask", findOrganisation, (req, res) => {
  const { org } = req;
  if (org === undefined) {
    return res.json({ message: 'Organisation required' })
  }
  const { id } = req.params;
  const { userID } = req.session;
  // { name, dependencies, estimatedCost, optimistic, mostLikely, pessimistic, expectedNumDevelopers, requiredSkills, index } = req.body;

  ProjectCollection.findById(id).orFail().then(async (project) => {
    if (project.projectManager.toString() !== userID) {
      return res.status(401).json({ message: 'Must be project manager to perform action' })
    }
    if (project.tasks.some(task => task.name === req.body.name)) {
      return res.status(400).json({ message: 'Task must have unique name' })
    }
    let invalidDep: string | null = null;
    // Tasks coming before the insertion index
    const preceedingTasks = project.tasks.slice(0, req.body.index);
    const preceedingTaskNames = preceedingTasks.map(t=>t.name);
    // Check that all dependencies are valid - come before the task - asserts topological ordering
    for (const dep of req.body.dependencies) {
      if (!preceedingTaskNames.includes(dep)) {
        invalidDep = dep
        break
      }
    }
    if (invalidDep !== null) {
      return res.status(400).json({ message: `Task has invalid dependency: ${invalidDep}` })
    }
    const succeedingTasks = project.tasks.slice(req.body.index, project.tasks.length)
    const task = TopLevelTask.create(req.body)
    const updatedTasks = [...preceedingTasks, task, ...succeedingTasks]
    await ProjectCollection.findByIdAndUpdate(id, { $set: { tasks: updatedTasks } }).orFail().exec();
    
    // Check whether project is in initial stages
    const isInitial = project.tasks.reduce(
      (acc, task) => acc && task.startDate === undefined,
      true
    ) && Date.now() <= project.startDate.getTime();
    // If not, log task added, to affect scope creep risk metric
    if (!isInitial) {
      await SavedEvaluation.findOneAndUpdate(
        { project: project.id },
        { $inc: { numTasksAdded: 1 } }
      ).orFail().exec();
    }

    res.sendStatus(200);
    // const result = await ProjectEvaluator.evaluate(id);
    // Update calculated start/finish times
    // await ProjectCollection.findByIdAndUpdate(id, { $set: { tasks: result.project.tasks }})
    // res.json(clean(result));
  })
});

/**
 * @swagger
 * /project/{id}/{taskname}/asignee/:
 *   patch:
 *     tags: [Project]
 *     summary: Assign developers to a task or remove current assignees from a task
 */
router.patch("/:id/:taskname/assignee", findOrganisation, (req, res, next) => {
  const { org } = req;
  
  if (org === undefined) {
    return res.json({ message: 'Organisation required' })
  }
  const { id, taskname } = req.params;
  const { userID } = req.session;
  const { developer, unassign } = req.body;

  // The target user ID is the developer field if given, otherwise the session user ID
  const target = developer !== undefined ? developer : userID;

  ProjectCollection.findById(id).orFail().then(async (project) => {
    // If a user is trying to assign another developer, they must be the project manager
    if (target !== userID && userID !== project.projectManager.toString()) {
      return res.status(400).json({ message: 'Must be project manager to perform action' })
    }
    const task = project.tasks.find(t => t.name === taskname);
    const alreadyAssigned = task.developers.indexOf(target) !== -1
    let updated = false
    if (alreadyAssigned && unassign) {
      // Already assigned, and want to unassign
      task.developers = task.developers.filter((d: string) => d !== target)
      updated = true;
    } else if (!alreadyAssigned && !unassign) {
      // Not already assigned, and want to assign
      task.developers.push(target)
      updated = true;
    }
    // return updated list
    await ProjectCollection.findByIdAndUpdate(id, { $set: { tasks: project.tasks } }).orFail().exec().then(() => {
      res.json({ developers: task.developers, updated })
    })
  }).catch(next)
});


/**
 * @swagger
 * /project/{id}/{taskname}/start/:
 *   patch:
 *     tags: [Project]
 *     summary: Starts a deliverable
 */
router.patch("/:id/:taskname/start", findOrganisation, (req, res, next) => {
  const { org } = req;
  if (org === undefined) {
    return res.status(400).json({ message: 'Organisation required' })
  }
  const { id, taskname } = req.params;
  const { userID } = req.session;

  ProjectCollection.findById(id).orFail().then(async project => {
    if (!project.developers.map(oID=>oID.toString()).includes(userID||'')) {
      return res.status(400).json({ message: 'User is not a project contributor' })
    }
    const task = project.tasks.find(t => t.name === taskname);
    if (task === undefined) {
      return res.status(400).json({ message: `Task ${taskname} does not exist in project` })
    }
    const allDependenciesComplete = task.dependencies.every((depName: string) => {
      const dep = project.tasks.find(t => t.name === depName);
      return dep.completedDate !== undefined
    });
    if (!allDependenciesComplete) {
      return res.status(400).json({ message: `Task does not have all of its dependencies complete` })
    }
    task.startDate = new Date();
    await ProjectCollection.findByIdAndUpdate(id, { $set: { tasks: project.tasks } }).orFail().exec().then(() => {
      res.sendStatus(200)
    })
  }).catch(next)
});


/**
 * @swagger
 * /project/{id}/{taskname}/complete/:
 *   patch:
 *     tags: [Project]
 *     summary: Completes a deliverable
 */
router.patch("/:id/:taskname/complete", findOrganisation, (req, res, next) => {
  const { org } = req;
  if (org === undefined) {
    return res.status(400).json({ message: 'Organisation required' })
  }
  const { id, taskname } = req.params;
  const { userID } = req.session;

  ProjectCollection.findById(id).orFail().then(async project => {
    if (!project.developers.map(oID=>oID.toString()).includes(userID||'')) {
      return res.status(400).json({ message: 'User is not a project contributor' })
    }
    const task = project.tasks.find(t => t.name === taskname);
    if (task === undefined) {
      return res.status(400).json({ message: `Task \"${taskname}\" does not exist in project` })
    }
    if (task.startDate === undefined) {
      return res.status(400).json({ message: 'Task must be started before marking complete' })
    }
    task.completedDate = new Date();
    await ProjectCollection.findByIdAndUpdate(id, { $set: { tasks: project.tasks } }).orFail().exec().then(() => {
      res.sendStatus(200)
    })
  }).catch(next)
});


/**
 * @swagger
 * /project/{id}/{taskname}/rename/:
 *   patch:
 *     tags: [Project]
 *     summary: Renames a task
 */
router.patch("/:id/:taskname/rename", findOrganisation, (req, res, next) => {
  const { org } = req;
  if (org === undefined) {
    return res.status(400).json({ message: 'Organisation required' })
  }
  const { id, taskname } = req.params;
  const { name } = req.body;
  const { userID } = req.session;

  ProjectCollection.findById(id).orFail().then(async project => {
    if (!project.developers.map(oID=>oID.toString()).includes(userID||'')) {
      return res.status(400).json({ message: 'User is not a project contributor' })
    }
    const task = project.tasks.find(t => t.name === taskname);
    if (task === undefined) {
      return res.status(400).json({ message: `Task \"${taskname}\" does not exist in project` })
    }
    if (project.tasks.find(t => t.name === name)) {
      return res.status(400).json({ message: `New task name \"${name}\" is already taken by another task` })
    }
    // Update references to this task as a dependency
    project.tasks.forEach(_task => {
      _task.dependencies.forEach((dep: string, i: number) => {
        if (dep === task.name) {
          _task.dependencies[i] = name
        }
      })
    })
    task.name = name
    await ProjectCollection.findByIdAndUpdate(id, { $set: { tasks: project.tasks } }).orFail().exec().then(() => {
      res.sendStatus(200)
    })
  }).catch(next)
});


/**
 * @swagger
 * /project/{id}/{taskname}/delete/:
 *   delete:
 *     tags: [Project]
 *     summary: Deletes a deliverable from the project
 */
router.post("/:id/:taskname/delete", findOrganisation, (req, res, next) => {
  const { org } = req;
  if (org === undefined) {
    return res.status(400).json({ message: 'Organisation required' })
  }
  const { id, taskname } = req.params;
  const { userID } = req.session;

  ProjectCollection.findById(id).orFail().then(async project => {
    if (!project.developers.map(oID=>oID.toString()).includes(userID||'')) {
      return res.status(400).json({ message: 'User is not a project contributor' })
    }
    const task = project.tasks.find(t => t.name === taskname);
    if (task === undefined) {
      return res.status(400).json({ message: `Task \"${taskname}\" does not exist in project` })
    }
    if (task.startDate !== undefined || task.completedDate !== undefined) {
      return res.status(400).json({ message: `Task has either already started or is complete and cannot be deleted` })
    }
    // For the successor tasks of this task, add the task's dependencies to the sucessor's dependency list
    const successors = project.tasks.filter((t) =>
      t.dependencies.includes(taskname)
    );
    successors.forEach(
      (s) =>
        (s.dependencies = [
          ...s.dependencies.filter((dep: string) => dep !== taskname),
          ...task.dependencies,
        ])
    );
    const newTasks = project.tasks.filter(t => t.name !== taskname);
    console.log("LEN", newTasks.length, "VS", project.tasks.length)
    await ProjectCollection.findByIdAndUpdate(id, { $set: { tasks: newTasks } }).orFail().exec().then(() => {
      res.sendStatus(200)
    })
  }).catch(next)
});


/**
 * @swagger
 * /project/{id}/{taskname}/addcostitem/:
 *   post:
 *     tags: [Project]
 *     summary: Adds a cost item to an existing task in a project
 */
router.post("/:id/:taskname/addcostitem", findOrganisation, (req, res, next) => {
  const { org } = req;
  if (org === undefined) {
    return res.status(400).json({ message: 'Organisation required' })
  }
  const { id, taskname } = req.params;
  const { userID } = req.session;
  const { name, cost } = req.body;

  ProjectCollection.findById(id).orFail().then(async project => {
    if (!project.developers.map(oID=>oID.toString()).includes(userID||'')) {
      return res.status(400).json({ message: 'User is not a project contributor' })
    }
    const task = project.tasks.find(t => t.name === taskname);
    if (task === undefined) {
      return res.status(400).json({ message: `Task \"${taskname}\" does not exist in project` })
    }
    task.costs = [...task.costs, { name, cost }]
    await ProjectCollection.findByIdAndUpdate(id, { $set: { tasks: project.tasks } }).orFail().exec().then(() => {
      res.sendStatus(200)
    })
  }).catch(next)
});

/**
 * @swagger
 * /project/{id}/{taskname}/setduration/:
 *   patch:
 *     tags: [Project]
 *     summary: Updates the 3-point estimated duration of a task
 */
router.post("/:id/:taskname/setduration", findOrganisation, (req, res, next) => {
  const { org } = req;
  if (org === undefined) {
    return res.status(400).json({ message: 'Organisation required' })
  }
  const { id, taskname } = req.params;
  const { userID } = req.session;
  let { optimistic, mostLikely, pessimistic } = req.body;

  ProjectCollection.findById(id).orFail().then(async project => {
    if (!project.developers.map(oID=>oID.toString()).includes(userID||'')) {
      return res.status(400).json({ message: 'User is not a project contributor' })
    }
    const task = project.tasks.find(t => t.name === taskname);
    // If any were undefined, assume original values
    // Assumes database entries are always correct
    optimistic = optimistic || task.optimistic;
    mostLikely = mostLikely || task.mostLikely;
    pessimistic = pessimistic  || task.pessimistic;

    if (task === undefined) {
      return res.status(400).json({ message: `Task \"${taskname}\" does not exist in project` })
    }
    if (optimistic > mostLikely || mostLikely > pessimistic) {
      return res.status(400).json({ message: `Optimistic duration must be less than the most likey duration. The pessimistic duration must be the greater than the most likely duration.` });
    }
    if (optimistic < 0) {
      return res.status(400).json({ message: `Duration values must all be greater than zero.` })
    }
    task.optimistic = optimistic;
    task.mostLikely = mostLikely;
    task.pessimistic = pessimistic;
    await ProjectCollection.findByIdAndUpdate(id, { $set: { tasks: project.tasks } }).orFail().exec().then(() => {
      res.sendStatus(200)
    })
  }).catch(next)
});

/**
 * @swagger
 * /project/{id}/{taskname}/updateskills/:
 *   patch:
 *     tags: [Project]
 *     summary: Adds or removes skill requirements from an existing task
 */
router.post("/:id/:taskname/updateskills", findOrganisation, (req, res, next) => {
  const { org } = req;
  if (org === undefined) {
    return res.status(400).json({ message: 'Organisation required' })
  }
  const { id, taskname } = req.params;
  const { userID } = req.session;
  const { skill, remove } = req.body;

  ProjectCollection.findById(id).orFail().then(async project => {
    if (!project.developers.map(oID=>oID.toString()).includes(userID||'')) {
      return res.status(400).json({ message: 'User is not a project contributor' })
    }
    const task = project.tasks.find(t => t.name === taskname);
    if (task === undefined) {
      return res.status(400).json({ message: `Task \"${taskname}\" does not exist in project` })
    }
    if (!Skills.includes(skill)) {
      return res.json({ message: `"${skill}" is not a valid skill.` });
    }

    // Update the task's required skills
    let newSkills;
    if (remove) {
      newSkills = task.requiredSkills.filter((sk: any) => sk !== skill);
    } else {
      // Add the skill. If it's already existing, keep unchanged.
      if (!task.requiredSkills.includes(skill)) {
        newSkills = [...task.requiredSkills, skill]
      } else {
        newSkills = task.requiredSkills
      }
    }
    task.requiredSkills = newSkills

    await ProjectCollection.findByIdAndUpdate(id, { $set: { tasks: project.tasks } }).orFail().exec().then(() => {
      res.sendStatus(200)
    })
  }).catch(next)
});


/**
 * @swagger
 * /project/{id}/{taskname}/numdevelopers/:
 *   patch:
 *     tags: [Project]
 *     summary: Updates the expected number of developers on a task
 */
router.post("/:id/:taskname/numdevelopers", findOrganisation, (req, res, next) => {
  const { org } = req;
  if (org === undefined) {
    return res.status(400).json({ message: 'Organisation required' })
  }
  const { id, taskname } = req.params;
  const { userID } = req.session;
  const { value } = req.body;

  ProjectCollection.findById(id).orFail().then(async project => {
    if (!project.developers.map(oID=>oID.toString()).includes(userID||'')) {
      return res.status(400).json({ message: 'User is not a project contributor' })
    }
    const task = project.tasks.find(t => t.name === taskname);
    if (task === undefined) {
      return res.status(400).json({ message: `Task \"${taskname}\" does not exist in project` });
    }
    if (value < 0) {
      return res.status(400).json({ message: `New requirement number must be greater than zero.` });
    }
    task.expectedNumDevelopers = value
    await ProjectCollection.findByIdAndUpdate(id, { $set: { tasks: project.tasks } }).orFail().exec().then(() => {
      res.sendStatus(200)
    })
  }).catch(next)
});

/**
 * @swagger
 * /project/{id}/startdate/:
 *   patch:
 *     tags: [Project]
 *     summary: Updates the startdate of the project
 */
router.post("/:id/startdate", findOrganisation, (req, res, next) => {
  const { org } = req;
  if (org === undefined) {
    return res.status(400).json({ message: 'Organisation required' })
  }
  const { id } = req.params;
  const { userID } = req.session;
  const { startDate } = req.body;

  ProjectCollection.findById(id).orFail().then(async project => {
    if (!project.developers.map(oID=>oID.toString()).includes(userID||'')) {
      return res.status(400).json({ message: 'User is not a project contributor' })
    }
    await ProjectCollection.findByIdAndUpdate(id, { $set: { startDate: new Date(startDate) } }).orFail().exec().then(() => {
      res.sendStatus(200)
    })
  }).catch(next)
});


/**
 * @swagger
 * /project/{id}/timeframe/:
 *   patch:
 *     tags: [Project]
 *     summary: Updates the timeframe period of the project
 */
router.post("/:id/timeframe", findOrganisation, (req, res, next) => {
  const { org } = req;
  if (org === undefined) {
    return res.status(400).json({ message: 'Organisation required' })
  }
  const { id } = req.params;
  const { userID } = req.session;
  const { timeframe } = req.body;

  ProjectCollection.findById(id).orFail().then(async project => {
    if (!project.developers.map(oID=>oID.toString()).includes(userID||'')) {
      return res.status(400).json({ message: 'User is not a project contributor' })
    }
    if (timeframe < 0) {
      return res.json({ message: 'Timeframe must be greater than zero' });
    }
    await ProjectCollection.findByIdAndUpdate(id, { $set: { timeFrameDays: timeframe } }).orFail().exec().then(() => {
      res.sendStatus(200)
    })
  }).catch(next)
});


/**
 * @swagger
 * /project/{id}/budget/:
 *   patch:
 *     tags: [Project]
 *     summary: Updates the project's budget
 */
router.post("/:id/budget", findOrganisation, (req, res, next) => {
  const { org } = req;
  if (org === undefined) {
    return res.status(400).json({ message: 'Organisation required' })
  }
  const { id } = req.params;
  const { userID } = req.session;
  const { budget } = req.body;

  ProjectCollection.findById(id).orFail().then(async project => {
    if (!project.developers.map(oID=>oID.toString()).includes(userID||'')) {
      return res.status(400).json({ message: 'User is not a project contributor' })
    }
    if (budget < 0) {
      return res.json({ message: 'Budget must be greater than zero' });
    }
    await ProjectCollection.findByIdAndUpdate(id, { $set: { budget } }).orFail().exec().then(() => {
      res.sendStatus(200)
    })
  }).catch(next)
});

/**
 * @swagger
 * /project/{id}/mood/:
 *   patch:
 *     tags: [Project]
 *     summary: Submits mood feedback from a project developer. Only accepts non-project manager submissions.
 */
router.post("/:id/mood", (req, res, next) => {
  const { id } = req.params;
  const { userID } = req.session;
  const { mood } = req.body;

  ProjectCollection.findById(id).orFail().exec().then(async project => {
    if (project.projectManager.toString() === userID) {
      return res.status(400).json({ message: 'Project manager cannot submit mood feedback' });
    }
    if (!project.developers.map(oID=>oID.toString()).includes(userID||'')) {
      return res.status(400).json({ message: 'User is not a project contributor' })
    }
    // Discard oldest mood, add newest to end
    // @ts-ignore - undefined userID, middleware asserts undefined
    project.mood[userID] = [...project.mood[userID].slice(1), mood];

    await project.update({ $set: { mood: project.mood } }).exec();
    res.sendStatus(200)
  }).catch(next)
})

/**
 * @swagger
 * /project/{id}/githubinfo/:
 *   post:
 *     tags: [Project]
 *     summary: Adds GitHub information for this project
 */
router.post("/:id/githubinfo", (req, res, next) => {
  const { id } = req.params;
  const { userID } = req.session;
  const info = req.body as GithubDetails;

  ProjectCollection.findByIdAndUpdate(id, { $set: { githubDetails: info } }).orFail().exec()
      .then(()=>res.sendStatus(200))
      .catch(next)
})

export default router;
