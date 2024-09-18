import {afterAll, afterEach, beforeAll, beforeEach, describe, expect} from "@jest/globals";

import {fetch_mock} from "../../mocks/fetch.mock";
import {Session} from "../../../Services/SessionServices/Session";
import {cloneWithout, toMatchDatabaseObject, toMatchDatabaseObjects} from "../../mocks/clone.mock";
import {user_mock_1, user_mock_2} from "../../mocks/user.mock";
import {User} from "../../../Models/DatabaseObjects/User";
import {UserSaver} from "../../../Models/DatabaseObjectSavers/UserSaver";
import {HTTPRequestMethod} from "../../../API/APIEndpoint";
import Skills from "common/build-models/Skills";


expect.extend({toMatchDatabaseObject, toMatchDatabaseObjects});
describe('User Service', ()=> {


    beforeAll(()=>jest.spyOn(window, 'fetch').mockImplementation(fetch_mock))
    afterAll(() => jest.restoreAllMocks());

    beforeEach(()=>Session.start())
    afterEach(()=>Session.end())

    describe('Correct Get', ()=>{
        it('Should return a user on correct get', async ()=>{
            await expect(Session.userService.get(user_mock_1.id, false))
                .resolves
                .toMatchDatabaseObject(cloneWithout(user_mock_1, "password", "id"))
        })
        it('Should return multiple users a user on correct multiple get', async ()=>{
            await expect(Session.userService.getMultiple([User.fromObject(user_mock_1),User.fromObject(user_mock_2)], false))
                .resolves
                .toMatchDatabaseObjects(
                    [cloneWithout(user_mock_1, "password", "id", "organisation", "projects"),
                        cloneWithout(user_mock_2, "password", "id", "organisation", "projects")
                    ])
        })
    })
    describe('Correct Delete', ()=>{
        it('Should not throw an error on correct delete', async ()=>{
            await expect(Session.userService.delete(User.fromObject(user_mock_1), false, HTTPRequestMethod.DELETE))
                .resolves
                .not.toThrowError()
        })
    })

    describe('Correct Update', ()=>{
        it('Should add user skills correctly', async ()=>{
            let user = User.fromObject(user_mock_1)
            let newSkills = [...user_mock_1.skillSet, Skills[3], Skills[4]]
            await expect(new UserSaver(user).saveSkills(newSkills))
                .resolves
                .not.toThrowError()
            expect(user.skillSet).toMatchObject(newSkills)
        })
        it('Should remove user skills correctly', async ()=>{
            let user = User.fromObject(user_mock_1)
            let newSkills = [user_mock_1.skillSet[0]]
            await expect(new UserSaver(user).saveSkills(newSkills))
                .resolves
                .not.toThrowError()
            expect(user.skillSet).toMatchObject(newSkills)
        })
        it('Should change skills correctly when removing and adding user skills', async ()=>{
            let user = User.fromObject(user_mock_1)
            let newSkills = [user_mock_1.skillSet[0], Skills[3]]
            await expect(new UserSaver(user).saveSkills(newSkills))
                .resolves
                .not.toThrowError()
            expect(user.skillSet).toMatchObject(newSkills)
        })

        it('Should register user correctly', async ()=>{
            await expect(Session.userService.registerUser({
                firstname:"FirstNameCreate",
                surname:"LastNameCreate",
                email:"CreateUser@CreateUser.com",
                password:"CreatedUser"
            }))
                .resolves
                .toMatchDatabaseObject({firstName:"FirstNameCreate", lastName:"LastNameCreate", email:"CreateUser@CreateUser.com", projects:[]})
        })


    })




})