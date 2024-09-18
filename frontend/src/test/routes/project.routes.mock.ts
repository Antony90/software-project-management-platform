import {route_mock} from "../mocks/route.mock";
import {user_mock_1} from "../mocks/user.mock";
import {create_task_mock} from "../mocks/task.mock";
import Mood from "common/build-models/Mood";
import {DeveloperMood} from "common/build-models/Project";
import {ResponseMock} from "../mocks/response.mock";
import {RESPONSE_CODES} from "../mocks/fetch.mock";
import {req_method} from "../mocks/req_method";
import {project_mock_1, project_mock_2} from "../mocks/project.mock";


//TODO Add mocking of project eval
export const PROJECT_CREATE =
    new route_mock(
        "/project",
        req_method.POST,
        (req)=>{
            var { name, tasks, developers, budget, timeFrameDays, startDate } = req
            if(developers.find(user_mock_1.id) == null) developers = [user_mock_1.id, ...developers]
            const mood: DeveloperMood = {}
            for (const dev of developers) {
                mood[dev] = [Mood.Neutral, Mood.Neutral, Mood.Neutral]
            }
            const newProject = {
                name,
                projectManager: user_mock_1.id,
                tasks: tasks.map(create_task_mock),
                developers,
                budget,
                timeFrameDays,
                startDate,
                mood
            };
            return new ResponseMock(newProject, RESPONSE_CODES.OK)
        }
    )

export const PROJECT_GET =
    new route_mock(
        "/project/:id",
        req_method.GET,
        (req, params)=>{
            const { id } = params;
            let project = null
            if(id==project_mock_1.id) project = project_mock_1
            if(id==project_mock_2.id) project = project_mock_2
            if(project == null) return new ResponseMock({}, RESPONSE_CODES.NOT_FOUND)
            return new ResponseMock(project, RESPONSE_CODES.OK)

        }
    )
