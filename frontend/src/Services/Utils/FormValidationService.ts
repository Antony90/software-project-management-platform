/**
 * Validates forms
 */
export class FormValidationService{

    //Cannot be blank validation
    static CANNOT_BE_BLANK = {required : true, message : "Cannot be blank"}

    /**
     * Validate if a value is a number
     * @param value The value to validate
     */
    static isNumberValidator(value : string) : Promise<number>{
        let x = Number(value)
        if(isNaN(x)) return Promise.reject()
        return Promise.resolve(x)
    }

    /**
     * Validate if the value is a cost
     * @param _ Should be null
     * @param value The value to check
     */
    static isCostValidator(_ : any, value : string) : Promise<number>{
        let point = value.indexOf(".")
        if(point == -1 || point == value.length - 3) return FormValidationService.isNumberValidator(value)
        else return Promise.reject()
    }

    static COST_FORMAT = {validator : FormValidationService.isCostValidator, message : "Incorrect monetary value"}

    /**
     * Validator with a regex
     * @param value The value to validate
     * @param regex The regex to compare against
     * @returns A resolved promise if value matches regex, a rejected promise otherwise
     */
    private static regexValidator(value : string, regex : RegExp) : Promise<any>{
        if(regex.test(value)) return Promise.resolve()
        return Promise.reject()
    }

    //Validator for name
    static nameValidator = (_ : any, value : string) =>{
        let nameRegExp = new RegExp(/^[a-z ,.'-]+$/i)
        return FormValidationService.regexValidator(value, nameRegExp)
    }

    //Name format validation
    static NAME_FORMAT = {validator : FormValidationService.nameValidator, message : "Invalid Characters Detected"}


    //Validator for password
    static passwordFormatValidator = (_ : any, value : string) =>{
        if(value == null) return Promise.reject()
        if(value.length < 5) return Promise.reject()
        return Promise.resolve()
    }

    //Password format validation
    static PASSWORD_FORMAT = {validator : FormValidationService.passwordFormatValidator, message : "Must contain at least 5 characters"}


    //Validator for same password
    static passwordRepeatValidator = (_ : any, value : string, comparisonValue : string) =>{
        if(value !== comparisonValue) return Promise.reject()
        return Promise.resolve()
    }

    //Password repeat validation
    static PASSWORD_REPEAT_VALUE(otherValue : string){
        return { validator : (_ : any, value : string)=>{return FormValidationService.passwordRepeatValidator(_, value, otherValue)},
         message : "Passwords must match"}
    }

    //Validator for an email
    static emailValidator = (_ : any, value : string) =>{
        let emailRegExp = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
        return FormValidationService.regexValidator(value, emailRegExp)
        
    }
    static EMAIL_FORMAT = {validator : FormValidationService.emailValidator, message : "Invalid Email"}

    


}