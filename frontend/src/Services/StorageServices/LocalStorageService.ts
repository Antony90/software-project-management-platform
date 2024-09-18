/**
 * Handles cookies
 */
export class LocalStorageService {
    /**
     * Set a cookie
     * @param key Cookie key
     * @param value Value to set
     */
    static set(key: string, value: string) {
        
        window.localStorage.setItem(key, value)
    }

    /**
     * Get a cookie
     * @param key Cookie to get
     * @returns Value of the cookie
     */
    static get(key: string) : string {
        return window.localStorage.getItem(key)
    }

    /**
     * Delete a cookie
     * @param key The cookie to delete
     */
    static delete(key: string) {
        window.localStorage.removeItem(key)
    }

    /**
     * Clear the local storage
     */
    static clear(){
        window.localStorage.clear()
    }

}