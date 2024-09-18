import React from "react";
import {RiskSuggestion, RiskSuggestionExtra} from "../../Models/Risk/RiskSuggestion";
import {Button, Collapse, List, Typography} from "antd";

const {Title} = Typography

const {Panel} = Collapse

let shouldCollapse = true

export function RiskSuggestionCard({risk, setTaskVisible, collapsed, setCollapsed, index}:
           {risk : RiskSuggestion, setTaskVisible : (t:string)=>void, collapsed?:boolean[], setCollapsed:(b:boolean[])=>void, index? : number}){


    function getExtra() : JSX.Element{

        switch (risk.getExtra()){
            case RiskSuggestionExtra.BUTTON_TASK: {
                let taskName : string = null
                if(risk.extras.taskName != null) taskName = risk.extras.taskName
                if(risk.extras.task != null) taskName = risk.extras.task
                if(taskName != null) {
                    return <Button
                        type="primary"
                        style={{marginLeft: "auto"}}
                        onClick={() => {
                            setTaskVisible(taskName);
                            shouldCollapse = false
                        }}>View Task</Button>
                }
                else{
                    return <></>
                }
            }

            case RiskSuggestionExtra.BUTTON_TASKS: {
                if(risk.extras.tasks.length == 0) return null
                return <Button
                    type="primary"
                    style={{marginLeft:"auto"}}
                    onClick={()=>{setTaskVisible(risk.extras.tasks[0]); shouldCollapse=false}}>View Task</Button>
            }
            default: return null
        }

    }

    const setActiveKey = ()=>{
        if(collapsed != null){
            if(shouldCollapse) {
                let newCollapsed = [...collapsed]
                newCollapsed[index] = !collapsed[index]
                setCollapsed(newCollapsed)
            }
            else{
                shouldCollapse = true
            }
        }
    }

    const getActiveKey = ()=>{
        if(collapsed == null) return []
        if(collapsed[index]) return []
        return [1]
    }
    const header = <div>
        <Title style={{textAlign:"left", margin:0}} level={5}>{risk.description}</Title>
        <br/>
        <Title style={{textAlign:"left", margin:0}} level={5}>To lower the chance of this putting your project at risk...</Title>
    </div>

    return (<div className="projectRiskCollapse">
        <Collapse onChange={()=>{setActiveKey()}} activeKey={getActiveKey()} style={{background:"transparent", border:0, width:"100%", height:"100%"}} >
            <Panel
                style={{
                    height:"100%",
                    display:"flex",
                    flexDirection:"column",
                    width:"100%",
                    paddingTop:20,
                    paddingBottom:20,
                    paddingLeft:20,
                    paddingRight:60,
                    border:"1px solid " + risk.getSeverity().params.colour.foregroundWithAlpha(0.2),
                    borderRadius:"1rem",
                    background:risk.getSeverity().params.colour.background
                }}
                header={
                    <div style={{display:"flex", alignItems:"center", gap:"10px", height:"100%", width:"100%"}}>
                        {risk.getSeverity().params.icon}
                        <Title style={{margin : 0}} level={4}>{risk.getTitle()}</Title>
                        {getExtra()}
                    </div>
                }
                key="1"
            >
                <List
                    style={{background:risk.getSeverity().params.colour.background, paddingLeft:30, paddingRight:30}}
                    size="large"
                    header={header}
                    dataSource={risk.messages}
                    renderItem={(item) => <List.Item style={{textAlign:"left", width:"100%"}}>{item}</List.Item>}
                />

            </Panel>

        </Collapse>
    </div>)

}