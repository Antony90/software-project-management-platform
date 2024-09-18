import {ColourScheme} from "../../Components/Styles/ColourScheme";
import {CheckSquareOutlined, ExclamationCircleOutlined, InfoCircleOutlined, WarningOutlined} from "@ant-design/icons";
import {RiskSeverityParams} from "../../Components/Risk/RiskOverview";

export class RiskSeverity {

    constructor(public params : RiskSeverityParams) {

    }

    static HIGH = new RiskSeverity(new RiskSeverityParams(ColourScheme.severeWarning, WarningOutlined, "High"))
    static MEDIUM = new RiskSeverity(new RiskSeverityParams(ColourScheme.mediumWarning, ExclamationCircleOutlined, "Medium"))
    static LOW = new RiskSeverity(new RiskSeverityParams(ColourScheme.lightWarning, InfoCircleOutlined, "Low"))
    static OK = new RiskSeverity(new RiskSeverityParams(ColourScheme.ok, CheckSquareOutlined, "Low"))
}


/**
 * A risk metric
 */
export class RiskMetric{

    /**
     * Create a new risk metric
     * @param name The name of the metric
     * @param description The description of the metric
     * @param value The value of the metric
     */
    constructor(public name : string, public description : string, public value : number) {

    }

    /**
     * Get the risk from a JS object
     * @param obj The object to use
     */
    static fromObject(obj : any) : RiskMetric{
        return new RiskMetric(obj.name, obj.description, obj.value)
    }

    /**
     * Get the severity of the risk metric
     * @param shouldUseOkForLow Whether to allocate 'OK' to a low risk item rather than 'LOW'
     */
    public getSeverity(shouldUseOkForLow = false) : RiskSeverity{
        if(this.value > 0.66) return RiskSeverity.HIGH
        if(this.value > 0.33) return RiskSeverity.MEDIUM
        if(shouldUseOkForLow) return RiskSeverity.OK
        else return RiskSeverity.LOW
    }

    /**
     * Get the percentage chance of failure
     */
    public getRiskPercentage() : number{
        return Math.round(this.value * 100)
    }



}