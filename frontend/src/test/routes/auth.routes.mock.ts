import {RESPONSE_CODES} from "../mocks/fetch.mock";
import {ResponseMock} from "../mocks/response.mock";
import {user_mock_1} from "../mocks/user.mock";
import {req_method} from "../mocks/req_method";
import {route_mock} from "../mocks/route.mock";


export const REGISTER = new route_mock(
    "auth/register",
    req_method.POST,
    (req) => {
        const { email, firstName, lastName } = req;
        if(email == user_mock_1.email)
            return new ResponseMock({message: "User already exists with supplied email"}, RESPONSE_CODES.BAD_REQUEST)
        return new ResponseMock({
            profile: {
                id: 2,
                email: email,
                firstName: firstName,
                lastName: lastName,
                organisation: null,
                projects: [],
                skillSet: [],
            },
            message: "Successfully registered and logged in",
        },RESPONSE_CODES.OK)
    }
)
export const LOGIN = new route_mock(
    "auth/login",
    req_method.POST,
    (req)=>{
        const { email, password } = req;
        if(email == user_mock_1.email && password == user_mock_1.password){
            return new ResponseMock({
                profile: {
                    id: user_mock_1.id,
                    email: user_mock_1.email,
                    firstName: user_mock_1.firstName,
                    lastName: user_mock_1.lastName,
                    organisation: user_mock_1.organisation,
                    projects: user_mock_1.projects,
                    skillSet: user_mock_1.skillSet,
                },
                message: "Logged in",
            },RESPONSE_CODES.OK)
        }
        else{
            return new ResponseMock({ message: "Incorrect password" }, RESPONSE_CODES.BAD_REQUEST)
        }
    }
)


export const LOGOUT = new route_mock(
    "auth/logout",
    req_method.POST,
    ()=>{
        return new ResponseMock({ message: "Logged out" }, RESPONSE_CODES.OK)
    }
)
