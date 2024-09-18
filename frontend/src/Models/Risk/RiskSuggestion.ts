import {RiskSeverity} from "./RiskMetric";
import skills from "common/build-models/Skills";
import {Utils} from "../../Services/Utils/Utils";

export enum RiskSuggestionType{
    DELAYED_TASK = "Delayed Task",
    TASK_MISSING_DEVELOPERS = "Task missing developers",

    MISSING_SKILL = "Missing skill",

    EXPENSIVE_TASK = "Expensive task",

    SKILL_MISMATCH = "Skill mismatch",

    UNEVEN_WORK_HOURS = "Uneven Work Hours Distribution",

    TASK_EXCEEDS_COST = "Task Exceeds Estimated Cost"


}

export enum RiskSuggestionExtra{
    BUTTON_TASK,
    BUTTON_TASKS
}

/**
 * A risk suggestion
 */
export class RiskSuggestion{

    /**
     * Create a new risk suggestion
     * @param name The name of the suggestion
     * @param type The type of the suggestion
     * @param severity How severe the risk is
     * @param description The description of the suggestion
     * @param messages The suggestion messages
     * @param extras The suggestion extras
     */
    constructor(
        public name : RiskSuggestionType,
        public type : number,
        public severity : number,
        public description : string,
        public messages : string[],
        public extras : any
    ) {
        if(this.extras == null) this.extras = {}
        if(this.messages == null) this.messages = []

        switch (name){
            case RiskSuggestionType.TASK_MISSING_DEVELOPERS: this.messages.push("Add some developers to the task")
        }

    }

    /**
     * Get the suggestion from a JS object
     * @param obj The object to use
     */
    static fromObject(obj : any) : RiskSuggestion{
        let messages = null
        let extras = null
        if(obj.resolution != null){
            messages = obj.resolution.messages
            extras = obj.resolution.extras
        }
        else{
            if(obj.messages != null) messages = obj.messages
            if(obj.extras != null) extras = obj.extras
        }
        return new RiskSuggestion(obj.name, obj.type, obj.severity, obj.description, messages, extras)
    }

    /**
     * Get the skill missing from this task
     */
    public getMissingSkill(){
        for(let skill of skills){
            if(this.description.indexOf(skill) != -1) return skill
        }
        return ""
    }

    /**
     * Get the title of this suggestion
     */
    public getTitle(){
        let prefix = ""
        let title = this.name
        let postfix = ""
        switch (this.name){
            case RiskSuggestionType.DELAYED_TASK: {
                let days = Math.ceil(this.extras.daysDelayed)
                postfix = `: ${this.extras.task} (${days} ${Utils.pluralise(days, "Day", "Days")} Late)`;
            }break
            case RiskSuggestionType.TASK_MISSING_DEVELOPERS: postfix = `: ${this.extras.task}`;break
            case RiskSuggestionType.MISSING_SKILL: postfix = `: Tasks '${this.extras.tasks.join(", ")}' are missing Skill '${this.getMissingSkill()}'`;break
            case RiskSuggestionType.EXPENSIVE_TASK: postfix = `: ${this.extras.task}`;break;
            case RiskSuggestionType.TASK_EXCEEDS_COST : postfix = `: ${this.extras.task} (£${this.extras.exceedAmount} over budget)`; break
            case RiskSuggestionType.UNEVEN_WORK_HOURS : postfix = `: ${this.extras.developer}`
        }
        return prefix + title + postfix
    }

    /**
     * Get the extra to apply to the suggestion card for this suggestion
     */
    public getExtra() : RiskSuggestionExtra{
        switch (this.name){
            case RiskSuggestionType.DELAYED_TASK:return RiskSuggestionExtra.BUTTON_TASK
            case RiskSuggestionType.TASK_MISSING_DEVELOPERS: return RiskSuggestionExtra.BUTTON_TASK
            case RiskSuggestionType.MISSING_SKILL: return RiskSuggestionExtra.BUTTON_TASKS
            case RiskSuggestionType.EXPENSIVE_TASK: return RiskSuggestionExtra.BUTTON_TASK
            case RiskSuggestionType.TASK_EXCEEDS_COST: return RiskSuggestionExtra.BUTTON_TASK
            default:return null
        }
    }


    /**
     * Get the severity of this risk suggestion
     */
    public getSeverity() : RiskSeverity{
        switch (this.severity){
            case 0: return RiskSeverity.LOW
            case 1: return RiskSeverity.MEDIUM
            case 2: return RiskSeverity.HIGH
        }
    }



}