import {Session} from '../../../Services/SessionServices/Session';
import {fetch_mock} from "../../mocks/fetch.mock";
import {user_mock_1} from "../../mocks/user.mock";
import {afterAll, afterEach, beforeAll, beforeEach, describe, expect} from '@jest/globals';
import {clone, toMatchDatabaseObject} from "../../mocks/clone.mock";
import {SessionStorageService} from "../../../Services/StorageServices/SessionStorageService";
import {User} from "../../../Models/DatabaseObjects/User";

expect.extend({toMatchDatabaseObject});
describe('Session', ()=> {


    beforeAll(()=>jest.spyOn(window, 'fetch').mockImplementation(fetch_mock))
    afterAll(() => jest.restoreAllMocks());


    describe('Using the current user', ()=>{

        beforeEach(()=>Session.start())
        afterEach(()=>Session.end())

        it("Should execute callback on user change", ()=>{
            let callback = jest.fn(()=>{})
            let user = User.fromObject(user_mock_1)
            Session.registerForOnUserChange("1", callback)
            Session.setCurrentUser(user)
            expect(callback).toBeCalledWith(user)
        })

        it("Should set the user on user change", ()=>{
            let user = User.fromObject(user_mock_1)
            Session.setCurrentUser(user)
            expect(Session.userService.currentUser).toEqual(user)
        })

        it("Should get the user locally when the user is set", async ()=>{
            let user = User.fromObject(user_mock_1)
            Session.setCurrentUser(user)
            await expect(Session.getUser())
                .resolves
                .toMatchDatabaseObject(clone(user))
        })

        it("Should get the user from the server when the user is not set", async ()=>{
            let user = User.fromObject(user_mock_1)
            await expect(Session.getUser())
                .resolves
                .toMatchDatabaseObject(clone(user))
        })

        it("Should not call a user callback once it has been unregistered", ()=>{
            let callback = jest.fn(()=>{})
            let user = User.fromObject(user_mock_1)
            Session.registerForOnUserChange("1", callback)
            Session.unregisterForOnUserChange("1")
            Session.setCurrentUser(user)
            expect(callback).not.toBeCalled()
        })
    })

    describe('Session Progression', ()=> {

        it('A session refresh should clear the cache', ()=>{
            Session.start()
            SessionStorageService.put("Key1", "Value1")
            Session.refresh()
            expect(SessionStorageService.get("Key1")).toBeNull()
        })

        it('Ending a session should clear the cache', ()=> {
            Session.start()
            SessionStorageService.put("Key1", "Value1")
            Session.end()
            expect(SessionStorageService.get("Key1")).toBeNull()
        });


        it('Ending a session should set the current user to null', async ()=> {
            Session.start()
            Session.setCurrentUser(User.fromObject(user_mock_1))
            Session.end()
            expect(Session.userService.currentUser).toBeNull()
        });
    });
});
