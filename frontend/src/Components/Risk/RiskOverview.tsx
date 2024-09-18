import {RiskBreakdown} from "../../Models/Risk/RiskBreakdown";
import {ColourPair} from "../Styles/ColourScheme";
import React from "react";
import {Collapse, List} from "antd";
import {RiskMetric} from "../../Models/Risk/RiskMetric";
import {RiskMetricItem} from "./RiskMetricItem";


const {Panel} = Collapse
export class RiskSeverityParams{

    public icon : JSX.Element
    constructor(
        public colour : ColourPair,
        Icon : any,
        public name : string
    ) {

        this.icon = <Icon style={{color:colour.foreground, fontSize:"20px"}}/>

    }
}


export function RiskOverview({riskBreakdown, onRefresh}: {riskBreakdown : RiskBreakdown, onRefresh:()=>void}){

    if(riskBreakdown == null) return <></>

    const topLevelMetric = riskBreakdown.getTopLevelMetric()
    const topLevelMetricSeverity = topLevelMetric.getSeverity(true)

    const overallRiskDisplay = (<RiskMetricItem title onRefresh={onRefresh} riskMetric={topLevelMetric}/>)
    return(
        <div className="projectRiskCollapse">
        <Collapse  style={{background:"transparent", border:0}} >
            <Panel style={{
                padding:40,
                border:"1px solid " + topLevelMetricSeverity.params.colour.foregroundWithAlpha(0.2),
                borderRadius:"1rem",
                background:topLevelMetricSeverity.params.colour.background,
            }}
                   header={overallRiskDisplay} key="1">
                <List
                    style={{border:`1px solid ${topLevelMetricSeverity.params.colour.foregroundWithAlpha(0.2)}`,
                        background:topLevelMetricSeverity.params.colour.background
                    }}
                    size="large"
                    dataSource={riskBreakdown.metrics}
                    renderItem={(metric : RiskMetric) =>
                        <List.Item style={{textAlign:"left", background:metric.getSeverity(true).params.colour.background, width:"100%"}}>
                            <RiskMetricItem riskMetric={metric}/>
                        </List.Item>
                    }
                />
            </Panel>
        </Collapse>
        </div>

    )

}