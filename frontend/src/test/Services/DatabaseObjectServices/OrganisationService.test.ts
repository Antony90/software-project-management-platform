import {Session} from '../../../Services/SessionServices/Session';
import {fetch_mock} from "../../mocks/fetch.mock";
import {user_mock_1} from "../../mocks/user.mock";
import {afterAll, afterEach, beforeAll, beforeEach, describe, expect} from '@jest/globals';
import {RequestFailureException} from "../../../API/RequestFailureException";
import {
    organisation_mock,
    organisation_to_create_mock,
    organisation_to_create_user_exists_mock,
    USER_ALREADY_IN_ORG_ID
} from "../../mocks/organisation.mock";
import {cloneWithout, toMatchDatabaseObject} from "../../mocks/clone.mock";
import {Organisation} from "../../../Models/DatabaseObjects/Organisation";

expect.extend({toMatchDatabaseObject});
describe('OrganisationService', ()=> {


    beforeAll(()=>jest.spyOn(window, 'fetch').mockImplementation(fetch_mock))
    afterAll(() => jest.restoreAllMocks());

    beforeEach(()=>Session.start())
    afterEach(()=>Session.end())



    describe('Correct get', ()=> {

        it('Should return correct user organisation', async ()=> {
            let organisation_expected = cloneWithout(organisation_mock, "id")
            await expect(Session.organisationService.getMyOrganisation(organisation_mock.id))
                .resolves
                .toMatchDatabaseObject(organisation_expected)
        });

        it('Should return correct organisation with ID', async ()=> {
            let organisation_expected = cloneWithout(organisation_mock, "id", "members")
            organisation_expected.admin = `${user_mock_1.firstName}, ${user_mock_1.lastName}`
            await expect(Session.organisationService.get(organisation_mock.id))
                .resolves
                .toMatchDatabaseObject(organisation_expected)
        });
    });

    describe('Correct create', ()=>{
        it('Should create organisation successfully if user not in org', async ()=> {
            let organisation_expected = cloneWithout(organisation_mock, "id", "admin", "name")
            await expect(Session.organisationService.create(new Organisation(organisation_to_create_mock.name,null, null, null)))
                .resolves
                .toMatchDatabaseObject(organisation_expected)
        });

        it('Should not create organisation if user in org', async ()=> {
            let org = new Organisation(organisation_to_create_user_exists_mock.name,null, null, null)
            await expect(Session.organisationService.create(org))
                .rejects
                .toThrowError(RequestFailureException)
        });
    });

    describe('Correct Join', ()=>{
        it('Should join organisation successfully if user not in org', async ()=> {
            let organisation_expected = cloneWithout(organisation_mock, "id")
            await expect(Session.organisationService.join(Organisation.fromObject(organisation_mock)))
                .resolves
                .toMatchDatabaseObject(organisation_expected)
        });
        it('Should not join organisation if user in org', async ()=> {
            await expect(Session.organisationService.join(Organisation.fromObject({id:USER_ALREADY_IN_ORG_ID})))
                .rejects
                .toThrowError(RequestFailureException)
        });
    });
});
