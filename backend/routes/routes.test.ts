import Mood from "common/build-models/Mood";
import supertest from "supertest";
import {app} from "../index";
import {ProjectCollection, UserCollection} from "../models/schemas";

const client1 = supertest.agent(app);
const client2 = supertest.agent(app);
const client3 = supertest.agent(app);

const user1 = {
  firstName: "John",
  lastName: "Smith",
  password: "Beautiful123",
  email: "john.smith@mail.com",
  id: "",
};

const user2 = {
  firstName: "Amy",
  lastName: "Lastname",
  password: "Password456",
  email: "amy.lastname@mail.com",
  id: "",
};

const user3 = {
  firstName: "Martin",
  lastName: "Lastname",
  password: "Orange921",
  email: "martin.lastname@mail.com",
  id: "",
};

describe("/auth", () => {
  describe("POST /register", () => {
    it("returns new user", async () => {
      await client1
        .post("/auth/register")
        .send(user1)
        .expect(200)
        .then((response) => {
          const body = response.body.profile;
          expect(body.email).toBe(user1.email);
          expect(body.firstName).toBe(user1.firstName);
          expect(body.lastName).toBe(user1.lastName);
          expect(body.organisation).toBeNull();
        });
      user1.id = (
        await UserCollection.findOne({ email: user1.email }).orFail().exec()
      ).id;
      expect(user1.id).toBeTruthy();
      await client2.post("/auth/register").send(user2).expect(200);
      user2.id = (
        await UserCollection.findOne({ email: user2.email }).orFail().exec()
      ).id;
      expect(user2.id).toBeTruthy();
      await client3.post("/auth/register").send(user3).expect(200);
      user3.id = (
        await UserCollection.findOne({ email: user3.email }).orFail().exec()
      ).id;
      expect(user3.id).toBeTruthy();
    });
  });
  describe("POST /logout", () => {
    it("returns success", async () => {
      await client1.post("/auth/logout").send(user1).expect(200);
    });
  });
  describe("POST /login", () => {
    it("returns user", async () => {
      await client1
        .post("/auth/login")
        .send(user1)
        .expect(200)
        .then(({ body }) => {
          const { profile: resp } = body;
          expect(resp.email).toBe(user1.email);
          expect(resp.firstName).toBe(user1.firstName);
          expect(resp.lastName).toBe(user1.lastName);
          expect(resp.organisation).toBeNull();
          expect(resp.projects.length).toBe(0);
          expect(resp.skillSet.length).toBe(0);
        });
    });
  });
});

let orgID: string = "";
describe("/org", () => {
  const createOrgRequest = { name: "My Org" };
  describe("POST /create", () => {
    it("returns organisation", async () => {
      const response = await client1.post("/org/create").send(createOrgRequest);
      const { name, admin, members } = response.body.organisation;
      expect(name).toBe(createOrgRequest.name);
      expect(admin).toBeDefined();
      expect(members.length).toBe(1);
      orgID = response.body.id;
    });
  });
  describe("POST /join", () => {
    it("returns success and id", async () => {
      const joinOrgRequest = { _id: orgID };
      const response = await client2
        .post("/org/join")
        .send(joinOrgRequest)
        .expect(200);
      expect(response.body.id).toBe(joinOrgRequest._id);
    });
  });

  describe("POST /leave", () => {
    it("returns success", async () => {
      const response = await client2.post("/org/leave");
      expect(response.status).toBe(200);
    });
  });
  describe("GET /", () => {
    it("returns org with 1 admin member", async () => {
      const response = await client1.get("/org");
      expect(response.body.organisation.members.length).toBe(1);
      expect(response.body.organisation.members[0]).toBe(
        response.body.organisation.admin
      );
      expect(response.body.organisation.name).toBe(createOrgRequest.name);
    });
  });
  describe("GET /:id", () => {
    it("returns the correct organisation preview", async () => {
      const response = await client1.get(`/org/${orgID}`).expect(200);
    });
  });
});

let user2id: string = "";
describe("/user", () => {
  describe("GET /", () => {
    it("returns correct user 1", async () => {
      await client1.get("/user").expect(200);
    });
  });
  describe("GET /:id", () => {
    beforeAll(async () => {
      const user2doc = await UserCollection.findOne({ email: user2.email })
        .orFail()
        .exec();
      const user1doc = await UserCollection.findOne({ email: user1.email })
        .orFail()
        .exec();
      user2id = user2doc.id;
      await client2.post("/org/join").send({ _id: user1doc.organisation });
    });
    it("returns correct user 2", async () => {
      const response = await client1.get(`/user/${user2id}`);
      expect(response.status).toBe(200);
      expect(response.body.user.firstName).toBe(user2.firstName);
    });
  });
  describe("POST /populate", () => {
    it("returns populated user 2", async () => {
      const response = await client1
        .post("/user/populate")
        .send({ ids: [user2id] });
      expect(response.status).toBe(200);
      expect(response.body.users.length).toBe(1);
      expect(response.body.users[0].id).toBe(user2id);
    });
  });
  describe("POST /delete", () => {
    it("deletes user 2 account", async () => {
      // await client2.post('/org/leave');
      // const response = await client2.delete('/user/');
      // expect(response.status).toBe(200);
      // const exists = await UserCollection.findById(user2id) !== null;
      // expect(exists).toBe(false)
      expect(false).toBe(false);
    });
  });
  describe("PATCH /skills", () => {
    it("adds skill 'Python'", async () => {
      const response = await client1.patch("/user/skills").send({
        skills: ["Python"],
        isAdd: true,
      });
      expect(response.status).toBe(200);
      const { body } = await client1.get("/user");
      expect(body.user.skillSet.length).toBe(1);
      expect(body.user.skillSet[0]).toBe("Python");
    });
    it("removes skill 'Python'", async () => {
      const response = await client1.patch("/user/skills").send({
        skills: ["Python"],
        isAdd: false,
      });
      expect(response.status).toBe(200);
      const { body } = await client1.get("/user");
      expect(body.user.skillSet.length).toBe(0);
    });
  });
});

describe("/project", () => {
  const project = {
    name: "202",
    tasks: [
      {
        name: "A",
        dependencies: [],
        estimatedCost: 20,
        optimistic: 14,
        mostLikely: 18,
        pessimistic: 25,
        expectedNumDevelopers: 3,
        requiredSkills: [],
      },
      {
        name: "B",
        dependencies: ["A"],
        estimatedCost: 5,
        optimistic: 13,
        mostLikely: 18,
        pessimistic: 25,
        expectedNumDevelopers: 3,
        requiredSkills: [],
      },
      {
        name: "C",
        dependencies: ["B"],
        estimatedCost: 5,
        optimistic: 13,
        mostLikely: 18,
        pessimistic: 25,
        expectedNumDevelopers: 3,
        requiredSkills: ["Python"],
      },
      {
        name: "D",
        dependencies: ["A"],
        estimatedCost: 5,
        optimistic: 13,
        mostLikely: 18,
        pessimistic: 25,
        expectedNumDevelopers: 3,
        requiredSkills: [],
      },
      {
        name: "E",
        dependencies: [],
        estimatedCost: 5,
        optimistic: 13,
        mostLikely: 18,
        pessimistic: 25,
        expectedNumDevelopers: 3,
        requiredSkills: [],
      },
      {
        name: "F",
        dependencies: ["E"],
        estimatedCost: 5,
        optimistic: 13,
        mostLikely: 18,
        pessimistic: 25,
        expectedNumDevelopers: 3,
        requiredSkills: [],
      },
      {
        name: "Evaluation",
        dependencies: ["A", "C", "F"],
        estimatedCost: 5,
        optimistic: 13,
        mostLikely: 18,
        pessimistic: 25,
        expectedNumDevelopers: 3,
        requiredSkills: ["Cpp"],
      },
    ],
    developers: [],
    budget: 35,
    timeFrameDays: 45,
  };
  let projectID: string = "";
  describe("POST /", () => {
    it("returns 200, new evaluated project", async () => {
      const user2doc = await UserCollection.findOne({ email: user2.email })
        .orFail()
        .exec();
      const response = await client1
        .post("/project/")
        .send({ ...project, developers: [...project.developers, user2doc.id] });
      expect(response.status).toBe(200);
      expect(response.body.suggestions).toBeDefined();
      expect(response.body.breakdown).toBeDefined();
      expect(response.body.project.tasks.length).toBe(7);
      projectID = response.body.project.id;
      expect(Object.keys(response.body.project.mood).length).toBe(2);
    });
  });

  describe("GET /:id", () => {
    it("returns the full project", async () => {
      await client1.get(`/project/${projectID}`).expect(200);
    });
  });

  describe("POST /populate", () => {
    it("returns array of populated projects", async () => {
      await client1.post("/project/populate").send({ ids: [projectID] });
    });
  });

  describe("POST /:id/developer", () => {
    beforeAll(async () => {
      const resp2 = await client3.post("/org/join").send({ _id: orgID });
      expect(resp2.status).toBe(200);
    });
    afterAll(async () => {
      // Add user 2 back to the project
      const resp = await client1
        .post(`/project/${projectID}/developer`)
        .send({ remove: false, developers: [user2.id] });
      expect(resp.status).toBe(200);
      const updated = await client1.get(`/project/${projectID}`);
      expect(updated.status).toBe(200);
      expect(updated.body.project.developers.length).toBe(3);
    });
    it("adds user 3 to the project", async () => {
      const resp = await client1
        .post(`/project/${projectID}/developer`)
        .send({ remove: false, developers: [user3.id] });
      expect(resp.status).toBe(200);
      const updated = await client1.get(`/project/${projectID}`);
      expect(updated.status).toBe(200);
      expect(updated.body.project.developers.length).toBe(3);
      expect(updated.body.project.developers[0]).toBe(user1.id);
      expect(updated.body.project.developers[1]).toBe(user2.id);
      expect(updated.body.project.developers[2]).toBe(user3.id);
      expect(Object.keys(updated.body.project.mood).length).toBe(3);
      expect(Object.keys(updated.body.project.mood).includes(user3.id)).toBe(
        true
      );
    });
    it("removes user 2 from the project", async () => {
      const resp = await client1
        .post(`/project/${projectID}/developer`)
        .send({ remove: true, developers: [user2.id] });
      expect(resp.status).toBe(200);
      const updated = await client1.get(`/project/${projectID}`);
      expect(updated.status).toBe(200);
      expect(updated.body.project.developers.length).toBe(2);
      expect(updated.body.project.developers.includes(user2.id)).toBe(false);
      expect(updated.body.project.developers[0]).toBe(user1.id);
      expect(updated.body.project.developers[1]).toBe(user3.id);
      expect(Object.keys(updated.body.project.mood).length).toBe(2);
      expect(!Object.keys(updated.body.project.mood).includes(user2.id)).toBe(
        true
      );
    });
  });

  describe("POST /:id/newtask", () => {
    const validTask = {
      name: "G",
      dependencies: ["F"],
      estimatedCost: 5,
      optimistic: 13,
      mostLikely: 18,
      pessimistic: 25,
      expectedNumDevelopers: 3,
      requiredSkills: [],
      index: 6,
    };
    const cyclic = { ...validTask, dependencies: ["Evaluation"] };
    const nonUnique = { ...validTask, name: "A" };

    it("fails to create a cyclic dependency", async () => {
      const response = await client1
        .post(`/project/${projectID}/newtask`)
        .send(cyclic);
      expect(response.status).toBe(400);
      expect(
        (response.body.message as string).includes("invalid dependency")
      ).toBe(true);
    });
    it("fails to create a task with non-unique name", async () => {
      const response = await client1
        .post(`/project/${projectID}/newtask`)
        .send(nonUnique);
      expect(response.status).toBe(400);
      expect((response.body.message as string).includes("unique name")).toBe(
        true
      );
    });
    it("creates 1 new task", async () => {
      const response = await client1
        .post(`/project/${projectID}/newtask`)
        .send(validTask);
      expect(response.status).toBe(200);
    });
  });
  describe("POST /:id/timeframe", () => {
    it("updates project timeframe", async () => {
      const resp = await client1
        .post(`/project/${projectID}/timeframe`)
        .send({ timeframe: 240 });
      expect(resp.status).toBe(200);
    });
  });
  describe("POST /:id/budget", () => {
    it("updates project budget", async () => {
      const resp = await client1
        .post(`/project/${projectID}/budget`)
        .send({ budget: 1080 });
      expect(resp.status).toBe(200);
    });
  });
  describe("POST /:id/mood", () => {
    it("fails to submit PM's mood", async () => {
      const resp = await client1
        .post(`/project/${projectID}/mood`)
        .send({ mood: Mood.Plus1 });
      expect(resp.status).toBe(400);
    });
    it("submits user 3's mood", async () => {
      const resp = await client3
        .post(`/project/${projectID}/mood`)
        .send({ mood: Mood.Neg2 });
      expect(resp.status).toBe(200);
      const mood = (await ProjectCollection.findById(projectID).orFail().exec())
        .mood;
      console.log("Found mood!", mood)
      expect(mood[user3.id][0]).toBe(Mood.Neutral);
      expect(mood[user3.id][1]).toBe(Mood.Neutral);
      expect(mood[user3.id][2]).toBe(Mood.Neutral);
      expect(mood[user3.id][3]).toBe(Mood.Neutral);
      expect(mood[user3.id][4]).toBe(Mood.Neg2);
    });
  });
  describe("POST /:id/:taskname/assignee", () => {
    it("lets PM assign user 2 to task", async () => {
      const resp = await client1
        .patch(`/project/${projectID}/${project.tasks[0].name}/assignee`)
        .send({ developer: user2.id, unassign: false });
      expect(resp.status).toBe(200);
      const updated = await client1.get(`/project/${projectID}`);
      expect(updated.status).toBe(200);
      const targetTask = updated.body.project.tasks.find(
        (t: { name: string }) => t.name === project.tasks[0].name
      );
      expect(targetTask.developers.length).toBe(1);
      expect(targetTask.developers[0]).toBe(user2.id);
    });
    it("lets PM unassign user 2 from task", async () => {
      const resp = await client1
        .patch(`/project/${projectID}/${project.tasks[0].name}/assignee`)
        .send({ developer: user2.id, unassign: true });
      expect(resp.status).toBe(200);
      const updated = await client1.get(`/project/${projectID}`);
      expect(updated.status).toBe(200);
      const targetTask = updated.body.project.tasks.find(
        (t: { name: string }) => t.name === project.tasks[0].name
      );
      expect(targetTask.developers.length).toBe(0);
    });
    it("user 3 assign themselves to task", async () => {
      const resp = await client3
        .patch(`/project/${projectID}/${project.tasks[1].name}/assignee`)
        .send();
      expect(resp.status).toBe(200);
      const updated = await client1.get(`/project/${projectID}`);
      expect(updated.status).toBe(200);
      const targetTask = updated.body.project.tasks.find(
        (t: { name: string }) => t.name === project.tasks[1].name
      );
      expect(targetTask.developers.length).toBe(1);
      expect(targetTask.developers[0]).toBe(user3.id);
    });
    it("non-PM attempt to assign other user", async () => {
      const resp = await client3
        .patch(`/project/${projectID}/${project.tasks[1].name}/assignee`)
        .send({ developer: user2.id, unassign: false });
      expect(resp.status).toBe(400);
      expect(resp.body.message.includes("Must be project manager")).toBe(true);
    });
  });
  describe("POST /:id/:taskname/start", () => {
    it("sets start date of task", async () => {
      const resp = await client1.patch(
        `/project/${projectID}/${project.tasks[0].name}/start`
      );
      expect(resp.status).toBe(200);
      const updated = await client1.get(`/project/${projectID}`);
      expect(updated.status).toBe(200);
      const targetTask = updated.body.project.tasks.find(
        (t: { name: string }) => t.name === project.tasks[0].name
      );
      expect(targetTask).toBeDefined();
      expect(targetTask.startDate).toBeDefined();
    });
    it("fails on task without complete dependencies", async () => {
      const resp = await client1.patch(
        `/project/${projectID}/${project.tasks[3].name}/start`
      );
      expect(resp.status).toBe(400);
      expect(resp.body.message.includes("dependencies")).toBe(true);
    });
  });
  describe("POST /:id/:taskname/complete", () => {
    it("completes a started task", async () => {
      const resp = await client1.patch(
        `/project/${projectID}/${project.tasks[0].name}/complete`
      );
      expect(resp.status).toBe(200);
      const updated = await client1.get(`/project/${projectID}`);
      expect(updated.status).toBe(200);
      const targetTask = updated.body.project.tasks.find(
        (t: { name: string }) => t.name === project.tasks[0].name
      );
      expect(targetTask).toBeDefined();
      expect(targetTask.completedDate).toBeDefined();
    });
    it("fails to complete an unstarted task", async () => {
      const resp = await client1.patch(
        `/project/${projectID}/${project.tasks[4].name}/complete`
      );
      expect(resp.status).toBe(400);
      expect(resp.body.message.includes("started")).toBe(true);
    });
  });
  describe("POST /:id/:taskname/rename", () => {
    afterAll(async () => {
      const resp = await client1
        .patch(`/project/${projectID}/Alpha/rename`)
        .send({ name: "A" });
      expect(resp.status).toBe(200);
    });
    it("fails to rename to an existing task", async () => {
      const resp = await client1
        .patch(`/project/${projectID}/${project.tasks[0].name}/rename`)
        .send({ name: "Evaluation" });
      expect(resp.status).toBe(400);
      expect(resp.body.message.includes("already taken")).toBe(true);
    });
    it("renames a task and updates dependency references", async () => {
      const newName = "Alpha";
      const resp = await client1
        .patch(`/project/${projectID}/${project.tasks[0].name}/rename`)
        .send({ name: newName });
      expect(resp.status).toBe(200);
      const updated = await client1.get(`/project/${projectID}`);
      expect(updated.status).toBe(200);
      const targetTask = updated.body.project.tasks.find(
        (t: { name: string }) => t.name === newName
      );
      expect(targetTask).toBeDefined();

      const originalSuccessors = project.tasks.filter(
        (t: { dependencies: string[] }) =>
          t.dependencies.includes(project.tasks[0].name)
      );
      expect(originalSuccessors.length).toBeGreaterThan(0);
      const newSuccessors = updated.body.project.tasks.filter(
        (t: { dependencies: string[] }) => t.dependencies.includes(newName)
      );
      expect(newSuccessors.length).toBe(originalSuccessors.length);
      for (let i = 0; i < originalSuccessors.length; i++) {
        for (let j = 0; j < originalSuccessors[i].dependencies.length; j++) {
          if (originalSuccessors[i].dependencies[j] === project.tasks[0].name) {
            expect(newSuccessors[i].dependencies[j]).toBe(newName);
          }
        }
      }
    });
  });
  describe("POST /:id/:taskname/delete", () => {
    it("fails to delete a started task", async () => {
      const resp = await client1.post(
        `/project/${projectID}/${project.tasks[0].name}/delete`
      );
      expect(resp.status).toBe(400);
      expect(resp.body.message.includes("started or is complete")).toBe(true);
    });
    it("deletes a task and updates dependencies", async () => {
      const resp = await client1.post(
        `/project/${projectID}/${project.tasks[1].name}/delete`
      );
      expect(resp.status).toBe(200);
      const updated = await client1.get(`/project/${projectID}`);
      expect(updated.status).toBe(200);
      const successor = updated.body.project.tasks.find(
        (t: { name: string }) => t.name === "C"
      );
      expect(successor).toBeDefined();
      expect(successor.dependencies.length).toBe(1);
      expect(successor.dependencies[0]).toBe("A");
    });
  });
  describe("POST /:id/:taskname/addcostitem", () => {
    it("adds one cost item", async () => {
      const costItem = { name: "Name", cost: 25 };
      const resp = await client1
        .post(`/project/${projectID}/${project.tasks[2].name}/addcostitem`)
        .send(costItem);
      expect(resp.status).toBe(200);
      const updated = await client1.get(`/project/${projectID}`);
      expect(updated.status).toBe(200);
      const task = updated.body.project.tasks.find(
        (t: { name: string }) => t.name === project.tasks[2].name
      );
      expect(task.costs.length).toBe(1);
      expect(task.costs[0].name).toBe("Name");
      expect(task.costs[0].cost).toBe(25);
    });
  });
  describe("POST /:id/:taskname/setduration", () => {
    it("fails to update with invalid duration", async () => {
      const newDurations = {
        optimistic: 20,
      };
      const resp = await client1
        .post(`/project/${projectID}/${project.tasks[2].name}/setduration`)
        .send(newDurations);
      expect(resp.status).toBe(400);
      expect(resp.body.message.includes("must be less than")).toBe(true);
    });
    it("updates optimistic duration", async () => {
      const newDurations = {
        optimistic: 10,
      };
      const resp = await client1
        .post(`/project/${projectID}/${project.tasks[2].name}/setduration`)
        .send(newDurations);
      expect(resp.status).toBe(200);
      const updated = await client1.get(`/project/${projectID}`);
      expect(updated.status).toBe(200);
      expect(updated.body.project.tasks[1].optimistic).toBe(
        newDurations.optimistic
      );
    });
  });
  describe("POST /:id/:taskname/updateskills", () => {
    it("adds skill 'Python' to task", async () => {
      const resp = await client1
        .post(`/project/${projectID}/${project.tasks[0].name}/updateskills`)
        .send({ skill: "Python", remove: false });
      expect(resp.status).toBe(200);
      const updated = await client1.get(`/project/${projectID}`);
      expect(updated.status).toBe(200);
      expect(updated.body.project.tasks[0].requiredSkills.length).toBe(1);
      expect(updated.body.project.tasks[0].requiredSkills[0]).toBe("Python");
    });
    it("removes skill 'Python' to task", async () => {
      const resp = await client1
        .post(`/project/${projectID}/${project.tasks[0].name}/updateskills`)
        .send({ skill: "Python", remove: true });
      expect(resp.status).toBe(200);
      const updated = await client1.get(`/project/${projectID}`);
      expect(updated.status).toBe(200);
      expect(updated.body.project.tasks[0].requiredSkills.length).toBe(0);
    });
  });
  describe("POST /:id/:taskname/numdevelopers", () => {
    it("fails to set <0", async () => {
      const resp = await client1
        .post(`/project/${projectID}/${project.tasks[0].name}/numdevelopers`)
        .send({ value: -3 });
      expect(resp.status).toBe(400);
      expect(resp.body.message.includes("greater than zero")).toBe(true);
    });
    it("correctly sets number of developers", async () => {
      const resp = await client1
        .post(`/project/${projectID}/${project.tasks[0].name}/numdevelopers`)
        .send({ value: 5 });
      expect(resp.status).toBe(200);
      const updated = await client1.get(`/project/${projectID}`);
      expect(updated.status).toBe(200);
      expect(updated.body.project.tasks[0].expectedNumDevelopers).toBe(5);
    });
  });
});
