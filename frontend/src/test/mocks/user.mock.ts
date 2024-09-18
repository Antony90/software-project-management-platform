import Skills from "common/build-models/Skills";
import {organisation_mock} from "./organisation.mock";
import {project_mock_1, project_mock_2} from "./project.mock";


export const user_mock_1 : any ={
        id: "1",
        email: "test1@test.com",
        firstName: "Jane",
        lastName: "Smith",
        organisation: organisation_mock.id,
        projects: [project_mock_1.id, project_mock_2.id],
        skillSet: [Skills[0], Skills[1]],
        password:"Password1"
}

export const user_mock_2 : any ={
        id: "2",
        email: "test2@test.com",
        firstName: "John",
        lastName: "Smith",
        organisation: organisation_mock.id,
        projects: [project_mock_1.id],
        skillSet: [Skills[0], Skills[2]],
        password:"Password2"
}

export const users_mock = [user_mock_1, user_mock_2]