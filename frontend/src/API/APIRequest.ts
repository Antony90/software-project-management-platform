import {DatabaseObject} from "../Models/DatabaseObjects/DatabaseObject"
import {APIEndpoint, HTTPRequestMethod} from "./APIEndpoint"
import {RequestFailureException} from "./RequestFailureException"

/**
 * An API Request
 */
export class APIRequest<I extends DatabaseObject<I>, O extends DatabaseObject<O>>{

    static BASE_URL(){
        if(window.location.href.indexOf("localhost:3000") != -1 ) return "http://localhost:8000"
        else return process.env.REACT_APP_BACKEND_URL
    }

    

    

    /**
     * Construct a new APIRequest
     * @param endpoint The endpoint for the request
     * @param id The id of the object to send to the endpoint
     */
    constructor(public endpoint : APIEndpoint, public id : string = null){
        if(id == null) this.id = ""
        else this.id = id
    }

    /**
     * Process the response of the request
     * @param r The response
     * @param j The json of the response
     * @returns JSON promise
     * @throws RequestFailedException in case of reponse error
     */
    private processResponse(r : Response, j : any){
        if(j == null) j = {message : "No response message sent"}
        if(r.status===200 && r.ok){
            return
        }
        throw new RequestFailureException(r.status, j.message)
    }

    /**
     * Execute the request
     * @param method Request method to use
     * @param data Data to send
     * @param parseMethod Function to parse incoming data
     * @param args The arguments to use for this execute
     * @returns The returned object or null
     */
    public async execute(method : HTTPRequestMethod, data? : I, parseMethod : (s: any)=>O = null, args : any = null) : Promise<O>{
        var stringData = ""
        if(data != null) stringData = JSON.stringify(data)
        
        try{
            let response = await this.endpoint.send(APIRequest.BASE_URL(), method, this.id, stringData, args)
            let json = null
            try{
                json = await response.json()
            }
            catch{}
            this.processResponse(response, json)
            if(parseMethod != null){
                return Promise.resolve(parseMethod(json))
            }
            else {
                return Promise.resolve(null)
            }
        }
        catch(e){
            
            return Promise.reject(e)
        }
    }


}