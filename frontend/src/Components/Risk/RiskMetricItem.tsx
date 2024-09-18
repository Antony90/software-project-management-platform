import {RiskMetric} from "../../Models/Risk/RiskMetric";
import React, {useState} from "react";
import {Tooltip, Typography} from "antd";
import {MoreInfoHoverable} from "../Utils/MoreInfoHoverable";
import {ReloadOutlined} from "@ant-design/icons"

const {Title} = Typography

export function RiskMetricItem({riskMetric, title=false, onRefresh=()=>{}} : {riskMetric : RiskMetric, title?:boolean, onRefresh?:()=>void}){

    const severity = riskMetric.getSeverity(true)

    const [shouldSpin, setShouldSpin] = useState(false)

    const getTitleLevel = ()=>{
        if(title) return 2
        else return 5
    }

    const ReloadIcon = ()=>{

        if(title) return (
            <Tooltip title="Re-analyse the project">
            <div onClick={onRefresh} onPointerEnter={()=>setShouldSpin(true)} onPointerLeave={()=>setShouldSpin(false)}>
            <ReloadOutlined spin={shouldSpin} style={{fontSize:"30px"}}/>
            </div></Tooltip>
        )
        else return <></>
    }

    return(
        <div style={{display:"flex", alignItems:"center", gap:"10px", width:"100%"}}>

            {severity.params.icon}

            <Title style={{margin:0}} level={getTitleLevel()}>{riskMetric.name}</Title>

            <MoreInfoHoverable info={riskMetric.description} size={20}/>


            <div style={{marginLeft:"auto", display:"flex", gap:20, alignItems:"baseline"}}>
                <Title style={{margin:0}} level={getTitleLevel()}>{severity.params.name} ({riskMetric.getRiskPercentage()}%)</Title>
                <ReloadIcon/>
            </div>

        </div>
    )

}