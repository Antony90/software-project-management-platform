/**
 * Format values
 */
export class FormattingService{

    /**
     * Format a number as a cost
     * @param n The number to format
     */
    static asCost(n : number){
        if(n == null) return ""
        let cost = n.toString()
        const pointIndex = cost.indexOf(".")
        if(pointIndex == -1) return cost
        else if(pointIndex == cost.length - 2) return cost + "0"
        else return cost.substring(0, pointIndex+3)

    }

    static addZeros(value : number, expectedLength : number){
        let stringValue = value.toString()
        for(let i = stringValue.length; i < expectedLength; i++){
            stringValue = "0" + stringValue
        }
        return stringValue
    }

    static dateFormatter(date : Date){
        return `${FormattingService.addZeros(date.getFullYear(), 4)}-${FormattingService.addZeros(date.getMonth() + 1,2)}-${FormattingService.addZeros(date.getDate(), 2)}`
    }
}