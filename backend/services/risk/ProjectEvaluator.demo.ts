import supertest from "supertest";

import {app} from "../../index";
import {ProjectCollection, SavedEvaluation, UserCollection} from "../../models/schemas";
import Skills from "common/build-models/Skills";
import {PopulatedProject} from "../../models/schemas/Project";
import ProjectStatus from "common/build-models/ProjectStatus";
import Mood from "common/build-models/Mood";

const client1 = supertest.agent(app);
const client2 = supertest.agent(app);
const client3 = supertest.agent(app);

const user1 = {
  firstName: "John",
  lastName: "Smith",
  password: "Password1",
  email: "isaaclskevington3@gmail.com",
  id: "",
};

const user2 = {
  firstName: "Amy",
  lastName: "Walters",
  password: "Password1",
  email: "isaaclskevington2@gmail.com",
  id: "",
};

const user3 = {
  firstName: "Isaac",
  lastName: "Skevington",
  password: "Password1",
  email: "isaaclskevington@gmail.com",
  id: "",
};

let orgID = '';

const choice = (arr: any[]) => {
    return arr[Math.floor((Math.random()*arr.length))];
}


async function createProject(i: number, ids: string[]) {
    const tasks = [{
        "name": "A",
        "dependencies": [],
        "estimatedCost": 50,
        "optimistic": 14,
        "mostLikely": 18,
        "pessimistic": 25,
        "expectedNumDevelopers": 3,
        "requiredSkills": [Skills[0], Skills[1]]
      },{
        "name": "B",
        "dependencies": ["A"],
        "estimatedCost": 80,
        "optimistic": 13,
        "mostLikely": 18,
        "pessimistic": 25,
        "expectedNumDevelopers": 3,
        "requiredSkills": [Skills[2], Skills[5]]
      },{
        "name": "C",
        "dependencies": ["A", "B"],
        "estimatedCost": 25,
        "optimistic": 20,
        "mostLikely": 30,
        "pessimistic": 35,
        "expectedNumDevelopers": 3,
        "requiredSkills": [Skills[4], Skills[3]]
      },{
        "name": "D",
        "dependencies": ["C", "A"],
        "estimatedCost": 52,
        "optimistic": 25,
        "mostLikely": 30,
        "pessimistic": 35,
        "expectedNumDevelopers": 6,
        "requiredSkills": [Skills[6], Skills[2]]
      },{
        "name": "E",
        "dependencies": ["D"],
        "estimatedCost": 5,
        "optimistic": 8,
        "mostLikely": 10,
        "pessimistic": 15,
        "expectedNumDevelopers": 2,
        "requiredSkills": [Skills[0], Skills[4]]
      }
    
    ]
    const startDate = new Date();
    startDate.setTime(startDate.getTime() + (3600 * 1000 * 24 * 2))
    const project = {
        name: `Example Project ${i}`, 
        tasks,
        "developers": ids,
        "budget": 35,
        "timeFrameDays": 45,
        startDate
      }
    return project;
}

async function init() {
    const r1 = (await client1.post('/auth/register').send(user1)).status;
    const r2 = (await client2.post('/auth/register').send(user2)).status;
    const r3 = (await client3.post('/auth/register').send(user3)).status;
    console.log("Registered all 3 users");

    await client1.post("/org/create").send({ name: 'My Organisation' });
    
    const user1doc = await UserCollection.findOne({ email: user1.email }).orFail().exec();
    user1.id = user1doc.id;
    const user2doc = await UserCollection.findOne({ email: user2.email }).orFail().exec();
    user2.id = user2doc.id;
    const user3doc = await UserCollection.findOne({ email: user3.email }).orFail().exec();
    user3.id = user3doc.id;
    if (user1doc.organisation===undefined) {
        throw Error(`Expected org for user1`)
    };
    orgID = user1doc.organisation.toString();
    console.log("Created org", orgID)
    await client2.post(`/org/join`).send({_id: orgID});
    await client3.post(`/org/join`).send({_id: orgID});
    console.log("User 2&3 joining org");

    await UserCollection.findByIdAndUpdate(user1.id, { $set: { skillSet: [Skills[2]] } })
    await UserCollection.findByIdAndUpdate(user1.id, { $set: { skillSet: [Skills[4]] } })
    await UserCollection.findByIdAndUpdate(user1.id, { $set: { skillSet: [Skills[5], Skills[1]] } })
    console.log("Updated all skill sets")
}

export async function runDemo() {
    await init();
    const nProjects = 15;
    for (let i=0;i<nProjects;i++) {
        const project = await createProject(i, [user1.id, user2.id, user3.id]);
        console.log("Tasks in init order", project.tasks.map(t=>t.name));
        const resp = await client1.post("/project/").send(project);
        if (resp.status !== 200) {
            throw (`Error expected 200 from project creation`);
        }
        console.log("Created project i =", i);
        const projectDoc = await ProjectCollection.findOne({ name: `Example Project ${i}`}).orFail().exec()
        const projectID = projectDoc.id;

        // Complete the project
        if (i !== nProjects - 1) {
            await SavedEvaluation.findOneAndUpdate({ project: projectID }, { $set: { status: choice([ProjectStatus.Failure, ProjectStatus.Success]), numTasksAdded: Math.floor(Math.random()*8) }}).orFail();
            console.log("Completed project i =", i)
        } else {
            console.log("On last project");
            const started = Date.now() - (1000 * 24 * 3600 * 50);
            console.log("Tasks in order", projectDoc.tasks.map(t=>t.name));
            projectDoc.tasks.find(t =>t.name === 'A').startDate = new Date();
            const taskAcomplete = new Date()
            taskAcomplete.setTime(taskAcomplete.getTime() + (1000 * 24 * 3600 * 25))
            projectDoc.tasks.find(t =>t.name === 'A').completedDate = taskAcomplete;

            const taskB = projectDoc.tasks.find(t =>t.name === 'B');
            taskB.startDate = taskAcomplete;
            taskB.developers = [user1.id, user3.id];
            projectDoc.mood[user1.id] = [Mood.Neutral, Mood.Neg1, Mood.Neg2];
            taskB.costs = [{
              name: 'Cost 1',
              cost: 85
            }]
            const taskC = projectDoc.tasks.find(t =>t.name === 'C');
            taskC.developers = [user1.id];
            const taskD = projectDoc.tasks.find(t =>t.name === 'D');
            taskD.developers = [user1.id];

            await ProjectCollection.findByIdAndUpdate(projectID, { $set: { startDate: started, tasks: projectDoc.tasks }}).orFail().exec();
            await client2.post(`/project/${projectID}/mood`).send({ mood: Mood.Neg1 });
            await client2.post(`/project/${projectID}/mood`).send({ mood: Mood.Plus1 });
            await client2.post(`/project/${projectID}/mood`).send({ mood: Mood.Neutral });
            await client2.post(`/project/${projectID}/mood`).send({ mood: Mood.Plus2 });
            await client2.post(`/project/${projectID}/mood`).send({ mood: Mood.Plus1 });

            await client3.post(`/project/${projectID}/mood`).send({ mood: Mood.Plus1 });
            await client3.post(`/project/${projectID}/mood`).send({ mood: Mood.Neutral });
            await client3.post(`/project/${projectID}/mood`).send({ mood: Mood.Neg2 });
            await client3.post(`/project/${projectID}/mood`).send({ mood: Mood.Neutral });
          await client3.post(`/project/${projectID}/mood`).send({ mood: Mood.Neg1 });

            await client1.get(`/project/${projectID}/?refresh=true`)
            const savedEval = await SavedEvaluation.findOne({ project: projectID}).populate<{ project: PopulatedProject }>('project').orFail().exec();
            console.log(savedEval.weights);
            console.log(savedEval.project);
            console.log(savedEval.breakdown.metrics);
            console.log(savedEval.breakdown.risk);
            savedEval.suggestions.forEach((sugg) => {
              console.log("=====")
              console.log(sugg)
            });
        }
    }
}