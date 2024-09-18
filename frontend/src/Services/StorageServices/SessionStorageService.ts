
export class SessionStorageService {

    /**
     * Get an item from the session storage
     * @param key The key of the item to get
     */
    static get(key : string) : string{
        return window.sessionStorage.getItem(key)
    }

    /**
     * Put an item into the session storage
     * @param key The key of the item
     * @param value The value of the item
     */
    static put(key : string, value : string){
        
        return window.sessionStorage.setItem(key, value)
    }

    /**
     * Get all the keys of the items in the session storage
     */
    static getAllKeys(){
        return Object.keys(window.sessionStorage)
    }

    /**
     * Delete an item in the session storage
     * @param key The key of the item to remove
     */
    static delete(key : string){
        return window.sessionStorage.removeItem(key)
    }

    /**
     * Clear the session storage
     */
    static clear(){
        return window.sessionStorage.clear()
    }

    /**
     * Get all keys starting with a specific value
     * @param keyStart The value to filter for at the start
     */
    static getAllStartingWith(keyStart:string){
        return this.getAllKeys().filter((key)=>key.startsWith(keyStart))
    }

}