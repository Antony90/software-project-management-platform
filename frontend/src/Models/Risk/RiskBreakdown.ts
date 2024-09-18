import {RiskMetric} from "./RiskMetric";

/**
 * Breakdown of the risk
 */
export class RiskBreakdown{

    /**
     * Create a new risk breakdown
     * @param risk The risk
     * @param metrics Metrics associated with the risk
     */
    constructor(
        public risk : number,
        public metrics : RiskMetric[]
    ) {
        metrics.sort((metric1, metric2)=>{return metric2.value - metric1.value})
    }

    /**
     * Get the breakdown from a JS object
     * @param obj The object to use
     */
    static fromObject(obj : any){
        if(obj == null) return null
        let metrics : RiskMetric[] = []
        obj.metrics.forEach((m : any)=>{
            metrics.push(RiskMetric.fromObject(m))
        })
        return new RiskBreakdown(obj.risk, metrics)
    }

    /**
     * Get the top level metric for this breakdown
     */
    public getTopLevelMetric() : RiskMetric{
        return new RiskMetric("Project Failure Risk", "Risk of this project failing", this.risk)
    }

}