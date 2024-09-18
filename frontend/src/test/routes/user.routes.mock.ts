import {ResponseMock} from "../mocks/response.mock";
import {user_mock_1, users_mock} from "../mocks/user.mock";
import {RESPONSE_CODES} from "../mocks/fetch.mock";
import {route_mock} from "../mocks/route.mock";
import {req_method} from "../mocks/req_method";


export const USER_GET =
    new route_mock(
        "/user",
        req_method.GET,
        ()=>{
            let user = {
                id: user_mock_1.id,
                email: user_mock_1.email,
                firstName: user_mock_1.firstName,
                lastName: user_mock_1.lastName,
                projects : user_mock_1.projects,
                organisation:user_mock_1.organisation,
                skillSet: user_mock_1.skillSet
            }
            return new ResponseMock({user}, RESPONSE_CODES.OK)
        }
    )

export const USER_GET_ID =
    new route_mock(
        "/user/:id",
        req_method.GET,
        (req, params)=>{
            const { id } = params;
            let user = users_mock.find((m)=>m.id == id)
            if(user == null) return  new ResponseMock({}, RESPONSE_CODES.UNAUTHORISED)
            user = {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                projects : user.projects,
                organisation:user.organisation,
                skillSet: user.skillSet
            }
            return new ResponseMock({user},RESPONSE_CODES.OK)
        }
    )

export const USER_POPULATE =
    new route_mock(
        "/user/populate",
        req_method.POST,
        (req)=>{
            const { ids } = req;
            let users = ids.map((id : string)=>{
                let user = users_mock.find((m)=>m.id == id)
                if(user == null) return null
                return {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    skillSet: user.skillSet
                }
            })
            return new ResponseMock({users}, RESPONSE_CODES.OK)
        }
    )


export const USER_DELETE =
    new route_mock(
        "/user",
        req_method.DELETE,
        ()=>{
            return new ResponseMock({ message: "Account deleted" }, RESPONSE_CODES.OK)
        }

    )

export const USER_SKILLS =
    new route_mock(
        "/user/skills",
        req_method.PATCH,
        (req)=>{
            const { skills, isAdd } = req

            let newSkills = [...user_mock_1.skillSet]
            skills.forEach((s:string)=>{
                if(isAdd) newSkills.push(s)
                else{
                    let index = newSkills.indexOf(s)
                    newSkills.splice(index, 1)
                }
            })
            return new ResponseMock({ skills: newSkills }, RESPONSE_CODES.OK);

        }

    )
