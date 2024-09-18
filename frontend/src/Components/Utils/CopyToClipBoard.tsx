import React from "react";
import {CopyOutlined} from "@ant-design/icons"
import {message, Tooltip} from "antd";

export function CopyToClipBoard({children}:{children:string}){

    const copy = ()=>{
        if(navigator.clipboard == undefined) message.error("Copy failed due to lack of https")
        navigator.clipboard.writeText(children)
            .then(()=>{
                message.success("Text Copied!")
            })
            .catch(()=>{
                message.error("Copy failed")
            })
    }

    return(
        <div style={{display:"flex", gap:8}}>

            {children}
            <Tooltip title={"Copy"}><CopyOutlined onClick={copy} style={{cursor:"pointer", display:"flex", alignItems:"center"}}/></Tooltip>

        </div>
    )

}