import {FrownTwoTone, SmileTwoTone} from "@ant-design/icons";
import {ColourScheme} from "../Styles/ColourScheme";
import {Form, Slider} from "antd";
import React from "react";

export function IconSlider ({onChange, defaultValue, formID, props} :{onChange:()=>void, props:any, defaultValue :number, formID:string}) {


    return (
        <div style={{display:"flex", gap:16, fontSize: 30, justifyContent:"left"}}>
            <FrownTwoTone twoToneColor={ColourScheme.severeWarning.foreground} style={{marginRight:0}}/>
            <Form.Item name={formID} style={{marginBottom:0}}>
                <Slider onChange={onChange} defaultValue={defaultValue} style={{minWidth : 200, width:"100%"}} {...props}/>
            </Form.Item>
            <SmileTwoTone twoToneColor={ColourScheme.ok.foreground} style={{marginLeft:15}}/>
        </div>
    );
}


