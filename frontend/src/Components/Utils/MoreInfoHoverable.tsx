import {Tooltip} from "antd";
import React from "react";
import {QuestionCircleOutlined} from "@ant-design/icons"

export function MoreInfoHoverable({info, size=16, children=null} : {info : string, size?:number, children?:string}){

    if(children != null){
        return(
            <div style={{display:"flex", gap:8, alignItems:"center"}}>
                <span>
                    {children}
                </span>
                <Tooltip placement="top" title={info} >
                    <QuestionCircleOutlined style={{fontSize:size}}/>
                </Tooltip>
            </div>
        )
    }

    else return(
        <Tooltip placement="top" title={info} >
            <QuestionCircleOutlined style={{fontSize:size}}/>
        </Tooltip>
    )

}