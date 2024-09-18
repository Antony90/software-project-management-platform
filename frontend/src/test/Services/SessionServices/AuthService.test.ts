import {Session} from '../../../Services/SessionServices/Session';
import {AuthService} from '../../../Services/SessionServices/AuthService';
import {fetch_mock} from "../../mocks/fetch.mock";
import {user_mock_1} from "../../mocks/user.mock";
import {afterAll, afterEach, beforeAll, beforeEach, describe, expect} from '@jest/globals';
import {RequestFailureException} from "../../../API/RequestFailureException";
import {cloneWithout, toMatchDatabaseObject} from "../../mocks/clone.mock";

expect.extend({toMatchDatabaseObject});
describe('AuthService', ()=> {


	beforeAll(()=>jest.spyOn(window, 'fetch').mockImplementation(fetch_mock))
	afterAll(() => jest.restoreAllMocks());

	beforeEach(()=>Session.start())
    afterEach(()=>{Session.end()})




  	describe('Correct Authorisation', ()=> {

		it('Should return the current user when no id is provided', async ()=> {
			let expectedUser = cloneWithout(user_mock_1, "id", "password")
			await expect(AuthService.autoAuthorise())
				.resolves
				.toMatchDatabaseObject(expectedUser)
    	});


    	it('Should return an user from correct login details', async ()=> {
			let expectedUser = cloneWithout(user_mock_1, "id", "password")
      		await expect(AuthService.authorise(user_mock_1.email, user_mock_1.password))
				.resolves
				.toMatchDatabaseObject(expectedUser)
    	});

		it('Should return error from incorrect username', async () =>{
			await expect(AuthService.authorise(user_mock_1.email + "incorrect", user_mock_1.password))
				.rejects
				.toThrow(RequestFailureException);
		})

		it('Should return error from incorrect password', async () =>{
			await expect(AuthService.authorise(user_mock_1.email, user_mock_1.password + "incorrect"))
				.rejects
				.toThrow(RequestFailureException);
		})

		it('Should logout', async ()=>{
			await expect(AuthService.logout())
				.resolves
		})
  	});
});
