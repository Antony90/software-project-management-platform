//A callback function
export class Callback<T, U>{

    /**
     * Create a new callback
     * @param id The id of the callback
     * @param callback The function to call as the callback
     */
    constructor(public readonly id : string, public readonly callback : (t: T)=>U) {}

    /**
     * Call the callback
     * @param t The parameter of the callback
     */
    public call(t : T) : U{
        return this.callback(t)
    }
}