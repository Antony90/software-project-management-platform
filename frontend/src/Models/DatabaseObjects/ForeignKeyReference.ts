import {DatabaseObject} from "./DatabaseObject"
import {Organisation} from "./Organisation"
import {Project} from "./Project"
import {User} from "./User"

//Types of foreign key reference
enum _TYPE{
    USER = "User",
    PROJECT = "Project",
    ORGANISATION = "Organisation",
}

/**
 * A reference in the database
 */
export class ForeignKeyReference<T extends DatabaseObject<T>> extends DatabaseObject<T>{

    static TYPE : typeof _TYPE = _TYPE

    /**
     * Foreign key reference builder
     */
    static Builder = class{

        /**
         * Build a user Reference
         * @param obj JS Object of the user
         * @returns A ForeignKeyReference to the user
         */
        static USER(obj : any) : ForeignKeyReference<User>{
            if(obj == null) return null
            if(obj instanceof ForeignKeyReference) return obj
            if(typeof(obj) == "string") return new ForeignKeyReference(User.fromObject({_id : obj}))
            return new ForeignKeyReference<User>(User.fromObject(obj))
        }

    

        /**
         * Build a project Reference
         * @param obj JS Object of the project
         * @returns A ForeignKeyReference to the project
         */
        static PROJECT(obj : any) : ForeignKeyReference<Project>{
            if(obj == null) return null
            if(obj instanceof ForeignKeyReference) return obj
            if(typeof(obj) == "string") return new ForeignKeyReference(Project.fromObject({_id : obj}))
            return new ForeignKeyReference<Project>(Project.fromObject(obj))
        }

        /**
         * Build a organisation Reference
         * @param obj JS Object of the organisation
         * @returns A ForeignKeyReference to the organisation
         */
        static ORGANISATION(obj : any) : ForeignKeyReference<Organisation>{
            if(obj == null) return null
            if(obj instanceof ForeignKeyReference) return obj
            if(typeof(obj) == "string") return new ForeignKeyReference(Organisation.fromObject({_id : obj}))
            return new ForeignKeyReference<Organisation>(Organisation.fromObject(obj))
        }

        /**
         * Build an array of ForeignKeyReferences
         * @param array The array of IDs
         * @param type The type of reference
         * @returns An array of ForeignKeyReferences for the IDs
         */
        static ARRAY<U extends DatabaseObject<U>>(array : any[], type : _TYPE) : ForeignKeyReference<U>[]{
            let ret : ForeignKeyReference<any>[] = []
            switch(type){
                case ForeignKeyReference.TYPE.USER : array.forEach((a : any)=>ret.push(this.USER(a))); break
                case ForeignKeyReference.TYPE.PROJECT : array.forEach((a : any)=>ret.push(this.PROJECT(a))); break;
                case ForeignKeyReference.TYPE.ORGANISATION : array.forEach((a : any)=>ret.push(this.ORGANISATION(a))); break;
                default: throw new Error(type + " is not a valid type for this function, try User, Project or Organisation")
            }
            return ret
        }
    }



    private mObj : T //Object wrapped in this reference

    /**
     * Create a new FKR
     * @param t The object to wrap in this reference (can be an empty object)
     * @param id The id to set for this object
     */
    constructor(t: T, id : string = null){
        super()
        this.mObj = t
        if(id != null){
            this.mObj.setID(id)
        }
    }

    /**
     * Convert this to JSON format
     */
    public toJSON() : any{
        return this.getID()
    }

    /**
     * Convert an array of FKRs to an array of their IDs
     * @param arr The array to convert
     * @return A string array of all the IDs
     */
    static toStringArray(arr : ForeignKeyReference<any>[]){
        if(arr.length == 0) return []
        return arr.map((e)=>e.getID())
    }
    
    getID() : string{return this.mObj.getID()}
    setID(id: string) {this.mObj.setID(id)}
    async getFullObject() : Promise<T>{return this.mObj.getFullObject()}
}
