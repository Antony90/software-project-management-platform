export class RequestFailureException extends Error{

    responseMessage : string
    errorCode : number

    constructor(code : number, message: string){
        super("Request Failed with code " + code + " | Message: '" + message + "'")
        this.errorCode = code
        this.responseMessage = message
    }
}