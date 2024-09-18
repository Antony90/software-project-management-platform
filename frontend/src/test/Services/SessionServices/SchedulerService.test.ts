import {Session} from '../../../Services/SessionServices/Session';
import {fetch_mock} from "../../mocks/fetch.mock";
import {user_mock_1} from "../../mocks/user.mock";
import {afterAll, afterEach, beforeAll, beforeEach, describe, expect} from '@jest/globals';
import {toMatchDatabaseObject} from "../../mocks/clone.mock";
import {
    SchedulableEvent,
    SchedulableEventType,
    SchedulerService
} from "../../../Services/SessionServices/SchedulerService";
import {LocalStorageService} from "../../../Services/StorageServices/LocalStorageService";
import {Callback} from "../../../Models/Callback";

expect.extend({toMatchDatabaseObject});
describe('SchedulerService', ()=> {


    beforeAll(()=>jest.spyOn(window, 'fetch').mockImplementation(fetch_mock))
    afterAll(() => jest.restoreAllMocks());

    beforeEach(()=>{
        Session.start()
        LocalStorageService.clear()
    })
    afterEach(()=>{
        Session.end()
        LocalStorageService.clear()
    })


    describe('Scheduling events', ()=>{

        it("Should schedule an event", ()=>{
            let event = new SchedulableEvent(SchedulableEventType.DEVELOPER_FEEDBACK_EVENT, user_mock_1.id, SchedulerService.secondsTime(1))
            SchedulerService.schedule(event)
            expect(SchedulerService.isEventScheduled(event.name, ()=>true)).toBeTruthy()
        })


        it("Should identify an unscheduled event", ()=>{
            let event = new SchedulableEvent(SchedulableEventType.DEVELOPER_FEEDBACK_EVENT, user_mock_1.id, SchedulerService.secondsTime(1))
            expect(SchedulerService.isEventScheduled(event.name, ()=>true)).toBeFalsy()
        })

        it("Should schedule an event correctly if it is not currently scheduled", ()=>{
            let event = new SchedulableEvent(SchedulableEventType.DEVELOPER_FEEDBACK_EVENT, user_mock_1.id, SchedulerService.secondsTime(1))
            SchedulerService.scheduleIfNotAlreadyScheduled(event)
            expect(SchedulerService.isEventScheduled(event.name, ()=>true)).toBeTruthy()
        })

        it("Should not schedule an event if it is currently scheduled", ()=>{
            let event = new SchedulableEvent(SchedulableEventType.DEVELOPER_FEEDBACK_EVENT, user_mock_1.id, SchedulerService.secondsTime(1), {eventNumber : 1})
            let newEvent = new SchedulableEvent(SchedulableEventType.DEVELOPER_FEEDBACK_EVENT, user_mock_1.id, SchedulerService.daysTime(1), {eventNumber : 1})
            SchedulerService.schedule(event)
            SchedulerService.scheduleIfNotAlreadyScheduled(newEvent)
            let events = SchedulerService["fetchEvents"]()
            expect(events[0].getTime().getTime()).toBeLessThanOrEqual(Date.now() + 1000)
        })
    })

    describe("Alerting components of events", ()=>{
        it("Should correctly call a callback on register", ()=>{
            let event = new SchedulableEvent(SchedulableEventType.DEVELOPER_FEEDBACK_EVENT, user_mock_1.id, SchedulerService.secondsTime(-20), {eventNumber : 1})
            let callback = jest.fn((_ : [SchedulableEvent, boolean])=>false)
            SchedulerService.schedule(event)
            Session.schedulerService.registerForOnEvent(event.name, new Callback("1", callback))
            expect(callback).toHaveBeenCalledWith([event, false])
        })

        it("Should correctly call a callback after register", async ()=>{
            let event = new SchedulableEvent(SchedulableEventType.DEVELOPER_FEEDBACK_EVENT, user_mock_1.id, SchedulerService.secondsTime(-20), {eventNumber : 2})
            let callback = jest.fn((_ : [SchedulableEvent, boolean])=>false)
            Session.schedulerService.registerForOnEvent(event.name, new Callback("2", callback))
            SchedulerService.schedule(event)
            await new Promise((r) => setTimeout(r, 20000));
            expect(callback).toHaveBeenCalledWith([event, false])
        }, 25000)


        it("Should remove a callback correctly", ()=>{
            let event = new SchedulableEvent(SchedulableEventType.DEVELOPER_FEEDBACK_EVENT, user_mock_1.id, SchedulerService.secondsTime(0), {eventNumber : 3})
            let callback = jest.fn((_ : [SchedulableEvent, boolean])=>false)
            Session.schedulerService.registerForOnEvent(event.name, new Callback("3", callback))
            Session.schedulerService.unregisterForOnEvent("3")
            SchedulerService.schedule(event)
            expect(callback).not.toHaveBeenCalled()
        })

        it("Should handle the event if the callback returns true", ()=>{
            let event = new SchedulableEvent(SchedulableEventType.DEVELOPER_FEEDBACK_EVENT, user_mock_1.id, SchedulerService.secondsTime(-20), {eventNumber : 1})
            let callback = jest.fn((_ : [SchedulableEvent, boolean])=>true)
            SchedulerService.schedule(event)
            Session.schedulerService.registerForOnEvent(event.name, new Callback("4", callback))
            expect(SchedulerService.isEventScheduled(event.name, ()=>true)).toBeFalsy()
        })
    })
});
