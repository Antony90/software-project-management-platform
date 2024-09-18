import {DatabaseObjectService} from "../../Services/DatabaseObjectServices/DatabaseObjectService";
import {UpdateEndpoint} from "../DatabaseObjects/Project";
import {HTTPRequestMethod} from "../../API/APIEndpoint";
import {DatabaseObject} from "../DatabaseObjects/DatabaseObject";

/**
 * Saves DatabaseObjects
 */
export abstract class DatabaseObjectSaver<T extends DatabaseObject<T>> {

    /**
     * Create a new DB Object Saver
     * @param obj The obj to save
     * @param objService The service to use for saving
     * @param onUpdateOrFail Function to execute when the save is complete
     */
    constructor(
        public obj : T,
        public objService : DatabaseObjectService<any>,
        public onUpdateOrFail : ()=>void
    ) {

    }

    /**
     * Save the object
     * @param setField Function to set the field of the object
     * @param updatedValueEndpoint The endpoint to send the update to
     * @param previousValue The previous value
     * @param updatedValue The new value
     * @param updateMethod The method to use for the update
     * @param endpointExtras Extras required for the endpoint
     * @param withID If the endpoint should use the object ID to formulate the link
     */
    public async save(
        setField: (t: T, a: any) => void,
        updatedValueEndpoint: UpdateEndpoint,
        previousValue: any,
        updatedValue: any,
        updateMethod: HTTPRequestMethod.UPDATE_PATCH | HTTPRequestMethod.UPDATE_POST,
        endpointExtras :string = "",
        withID:boolean = true
    ) {
        setField(this.obj, updatedValue)
        try {
            return await this.objService.update(this.obj, endpointExtras + updatedValueEndpoint, updatedValue, updateMethod, withID)
        }
        catch(e){
            //Revert the object
            setField(this.obj, previousValue)
            return Promise.reject(e)
        }
        finally{
            this.onUpdateOrFail()
        }
    }
}