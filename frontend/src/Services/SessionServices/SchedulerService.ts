import {LocalStorageService} from "../StorageServices/LocalStorageService";
import {Callback} from "../../Models/Callback";
import {useEffect, useState} from "react";
import {Session, useCurrentUser} from "./Session";
import {Credentials} from "../../Models/Credentials";
import {useForceUpdate} from "../../Components/Utils/UpdateComponent";

/**
 * Type of scheduled event
 */
export enum SchedulableEventType{

    DEVELOPER_FEEDBACK_EVENT= "DEV_FEEBACK"

}

/**
 * A schedulable event
 */
export class SchedulableEvent {

    private readonly time : string
    constructor(public name : SchedulableEventType, public user : string, time : string | Date, public extras : any = null) {
        if(time instanceof Date) this.time = time.getTime().toString()
        else this.time = time
    }

    /**
     * Get the time the object is scheduled for
     */
    public getTime() : Date{
        return new Date(Number.parseFloat(this.time))
    }

    /**
     * Get an event from a JS object
     * @param obj The object to use
     */
    static fromObject(obj : any){
        return new SchedulableEvent(obj.name, obj.user, obj.time, obj.extras)
    }

    /**
     * Handle an event
     */
    public handle(){
        Session.schedulerService.markCompleted(this)
    }

    /**
     * Check if this event equals another
     * @param other The other event
     */
    public equals(other: SchedulableEvent){
        return JSON.stringify(this) == JSON.stringify(other)
    }

}

/**
 * Handles event scheduling
 */
export class SchedulerService{

    //Handles the event checker
    private intervalHandler : NodeJS.Timer


    //Function to execute on events received
    private onEventListeners : {eventName : string, callback : Callback<[SchedulableEvent, boolean], boolean>}[]


    /**
     * Create a new SchedulerService
     */
    constructor() {
        this.onEventListeners = []
        this.intervalHandler = null
    }

    /**
     * Complete an event so it is not activated again
     * @param event The event to complete
     */
    public markCompleted(event : SchedulableEvent){
        SchedulerService.deleteEvent(event)
        this.onEventListeners.forEach((eventListener)=>{
            if(eventListener.eventName == event.name) eventListener.callback.call([event, true])
        })
    }



    // Handle multiple events and dispatch them to relevant callbacks
    private handle(events : SchedulableEvent[]){
        events.forEach((event)=>{
            let handled = false
            this.onEventListeners.forEach((eventListener)=>{
                
                if(eventListener.eventName == event.name) {
                    
                    handled = eventListener.callback.call([event, false]) || handled
                }
            })
            if(handled) event.handle()
        })
    }

    //Get a list of all the matured events found
    private getMaturedEvents(){
        let events = SchedulerService.fetchEvents()
        let maturedEvents : SchedulableEvent[] = []
        let now = new Date()
        events.forEach((event)=>{
            if(event.getTime() < now) maturedEvents.push(event)
        })
        
        return maturedEvents
    }

    //Function to execute to handle events
    private handler(){
        this.handle(this.getMaturedEvents())
    }

    //Start handler running in the background
    private startHandler(){
        this.intervalHandler = setInterval(()=>{this.handler()}, 20000)
    }

    /**
     * Start the event scheduler
     */
    public start(){
        this.startHandler()
    }


    /**
     * Schedule an event if it does not already exist
     * @param event The event to schedule
     */
    static scheduleIfNotAlreadyScheduled(event : SchedulableEvent){
        if(!SchedulerService.isEventScheduled(
            event.name,
            (e) => {return JSON.stringify(e) == JSON.stringify(event.extras)})
        ){
            SchedulerService.schedule(event)
            return true
        }
        else return false
    }



    //Fetch all events
    private static fetchEvents() : SchedulableEvent[]{
        let events = LocalStorageService.get("EVENTS")
        if(events != null) {
            return JSON.parse(events).events.map((value:any)=>{return SchedulableEvent.fromObject(value)})
        }
        else return []
    }

    //Delete an event
    private static deleteEvent(event : SchedulableEvent){
        let events = this.fetchEvents()
        if(events != null){
            let eventIndex = events.findIndex((currentEvent)=>event.equals(currentEvent))
            if(eventIndex != -1) events.splice(eventIndex, 1)
            this.putEvents(events)
        }
    }

    //Put events to the local storage
    private static putEvents(events : SchedulableEvent[]){
        
        LocalStorageService.set(`EVENTS`, JSON.stringify({events:events}))
    }

    /**
     * Schedule an event
     * @param event The event to schedule
     */
    static schedule(event : SchedulableEvent){
        let events = this.fetchEvents()
        events.push(event)
        this.putEvents(events)
    }

    /**
     * Check if an event is scheduled
     * @param event The event
     * @param extrasMatcher Function used to match the event's extras
     */
    static isEventScheduled(event : SchedulableEventType, extrasMatcher : (extras : any)=>boolean = ()=>{return true}){
        let events = this.fetchEvents()
        return events.find((e)=>{return e.name==event && extrasMatcher(e.extras)}) != null
    }

    /**
     * Unregister a callback for event handling
     * @param callbackId The id of the callback to unregister
     */
    public unregisterForOnEvent(callbackId : string){
        let callbackIndex = this.onEventListeners.findIndex((c) => {
            return c.callback.id == callbackId
        })
        this.onEventListeners.splice(callbackIndex, 1)
    }

    /**
     * Register a callback for event handling
     * @param name The name of the event this callback will handle
     * @param onEventCallback The callback to execute to handle this event
     */
    public registerForOnEvent(name : SchedulableEventType, onEventCallback : Callback<[SchedulableEvent, boolean], boolean>){
        this.onEventListeners.push({eventName : name, callback:onEventCallback})
        this.getMaturedEvents().forEach((event)=>{
            if(event.name == name){
                if(onEventCallback.call([event, false])) event.handle()
            }
        })
    }

    /**
     * Stop the scheduler
     */
    public stop(){
        clearInterval(this.intervalHandler)
    }

    /**
     * Get a number of days as a schedulable date
     * @param days
     */
    static daysTime(days : number) : Date{
        return new Date(Date.now() + days * 24*60*60*1000)
    }

    /**
     * Get a number of seconds as a schedulable date
     * @param seconds
     */
    static secondsTime(seconds : number) : Date{
        return new Date(Date.now() + seconds * 1000)
    }

}


export function usePendingEvents(eventType : SchedulableEventType,
                                 eventFilter : (event:SchedulableEvent)=>boolean,
                                 ) : SchedulableEvent[]{

    const [events, setEvents] = useState([])

    const [_events, _setEvents] = useState([])

    const refresh = useForceUpdate()

    const currentUser = useCurrentUser()

    const [callbackId, setCallbackId] = useState(null)


    useEffect(()=>{
        if(currentUser != null) {
            let newCallbackID = Credentials.UUID()
            setCallbackId(newCallbackID)
            Session.schedulerService.registerForOnEvent(eventType,
                new Callback<[SchedulableEvent, boolean], boolean>(
                    newCallbackID,
                    ([e, handled]) => {
                        if (handled) {
                            let removeIndex = _events.findIndex((event) => e.equals(event))
                            if (removeIndex != -1) _events.splice(removeIndex, 1)
                            setEvents([..._events])
                        } else {
                            if (eventFilter(e)
                                && e.user == currentUser.getID()
                                && _events.find((oldE) => e.equals(oldE)) == null) {
                                _events.push(e)
                                setEvents([..._events])
                                refresh()
                            }

                        }
                        return false
                    }
                ))
        }
    }, [currentUser])

    useEffect(()=> ()=> {
        if(callbackId != null){
            Session.schedulerService.unregisterForOnEvent(callbackId)
        }
    }, [])

    return events

}
