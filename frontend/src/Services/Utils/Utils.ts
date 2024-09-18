import {ForeignKeyReference} from "../../Models/DatabaseObjects/ForeignKeyReference";

/**
 * Utilities
 */
export class Utils{


    /**
     * Find additions to an array
     * @param arrOld The old array
     * @param arrNew The new array
     */
    static findAdditions(arrOld : any[], arrNew : any[]){
        let additions : any[] = []

        arrNew.forEach((n)=>{
            if(arrOld.find((o)=>JSON.stringify(o) == JSON.stringify(n)) == null){
                additions.push(n)
            }
        })
        return additions
    }

    /**
     * Check is there are changes between two arrays
     * @param arrOld The old array
     * @param arrNew The new array
     */
    static hasChanges(arrOld : any[], arrNew : any[]){
        return this.findRemovals(arrOld, arrNew).length != 0 || this.findAdditions(arrOld, arrNew).length != 0
    }
    /**
     * Find removals from an array
     * @param arrOld The old array
     * @param arrNew The new array
     */
    static findRemovals(arrOld : any[], arrNew : any[]){
        return this.findAdditions(arrNew, arrOld)
    }


    /**
     * Remove elements from an array
     * @param array The array
     * @param elements A list of elements to remove
     * @return If elements were removed
     */
    static removeElements(array : any[], elements : any[]){
        let removed = false
        elements.forEach((sRemove)=>{
            let index = array.findIndex((s)=>JSON.stringify(s)==JSON.stringify(sRemove))
            if(index != -1) {
                array.splice(index, 1)
                removed = true
            }
        })
        return removed
    }

    /**
     * Remove elements from a ForeignKeyReference array
     * @param array The array
     * @param elements A list of elements to remove
     */
    static removeFKRElements(array : ForeignKeyReference<any>[], elements : string[]){
        let removed = false
        elements.forEach((sRemove)=>{
            let index = array.findIndex((s)=>s.getID()==sRemove)
            if(index != -1) {
                array.splice(index, 1)
                removed = true
            }
        })
        return removed
    }

    /**
     * Get text in the correct numerical form
     * @param number The number to use for formatting
     * @param singular The singular form of the word
     * @param plural The plural form of the word
     */
    static pluralise(number : number, singular : string, plural : string){
        if(number == 1) return singular
        return plural
    }

}