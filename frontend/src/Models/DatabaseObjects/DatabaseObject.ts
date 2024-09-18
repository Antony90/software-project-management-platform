export abstract class DatabaseObject<T>{

    /**
     * Get the full version of this object
     * @returns A populated version of this object
     */
    abstract getFullObject() : Promise<T>

    /**
     * Get the unique ID of this object
     * @returns The unique ID of this object
     */
    abstract getID() : string

    /**
     * Set the unique ID of this object
     * @param id The new unqiue ID
     */
    abstract setID(id : string) : void

}
