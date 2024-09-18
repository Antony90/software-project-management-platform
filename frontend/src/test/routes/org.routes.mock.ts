import {route_mock} from "../mocks/route.mock";
import {ResponseMock} from "../mocks/response.mock";
import {RESPONSE_CODES} from "../mocks/fetch.mock";
import {
    organisation_mock,
    organisation_to_create_mock,
    USER_ALREADY_IN_ORG_ID,
    USER_ALREADY_IN_ORG_NAME
} from "../mocks/organisation.mock";
import {user_mock_1} from "../mocks/user.mock";
import {req_method} from "../mocks/req_method";

export const ORGANISATION =
    new route_mock(
        "/org",
        req_method.GET,
        ()=>{
            return new ResponseMock({
                    organisation:organisation_mock
                },
                RESPONSE_CODES.OK
            )
        }
    )

export const ORGANISATION_ID =
    new route_mock(
        "/org/:id",
        req_method.GET,
        (req, params)=>{
            const {id} = params
            if(id == organisation_mock.id){
                return new ResponseMock(
                    {
                        id:organisation_mock.id,
                        name: organisation_mock.name,
                        admin: `${user_mock_1.firstName}, ${user_mock_1.lastName}`,
                        numMembers: organisation_mock.numMembers,
                    }, RESPONSE_CODES.OK
                )
            }
            else{
                return new ResponseMock({}, RESPONSE_CODES.BAD_REQUEST)
            }
        }
    )


export const ORGANISATION_JOIN =
    new route_mock(
        "/org/join",
        req_method.POST,
        (req)=>{
            const {_id} = req
            if(_id == USER_ALREADY_IN_ORG_ID) return new ResponseMock({ message: "User already in an organisation" }, RESPONSE_CODES.BAD_REQUEST)
            else return new ResponseMock({
                     id: _id
                },
                RESPONSE_CODES.OK
            )
        }
    )

export const ORGANISATION_CREATE =
    new route_mock(
        "/org/create",
        req_method.POST,
        (req)=>{
            const { name } = req
            if(name==USER_ALREADY_IN_ORG_NAME) return new ResponseMock({ message: "User already in organisation" }, RESPONSE_CODES.BAD_REQUEST)
            let org = {
                name,
                admin: organisation_to_create_mock.admin,
                members: organisation_to_create_mock.members,
            };

            return new ResponseMock({
                    id: organisation_to_create_mock.id,
                    organisation: org,
                    message: "Created organisation"
            }, RESPONSE_CODES.OK)
        })


export const ORGANISTION_LEAVE =
    new route_mock(
        "/org/leave",
        req_method.POST,
        ()=>{
            return new ResponseMock({message : "User left organisation"}, RESPONSE_CODES.OK)
        }
    )

