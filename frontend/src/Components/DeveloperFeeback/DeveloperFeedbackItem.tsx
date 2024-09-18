import {Typography} from "antd";
import React, {useEffect, useState} from "react";
import {IconSlider} from "./IconSlider";
import Mood, {toString as moodToString} from "common/build-models/Mood";

const {Title, Text} = Typography

export enum InputType{
    SLIDER_SMILEY
}


export type DeveloperFeedbackItemParams = {
    title:string,
    question : string,
    inputType : InputType,
    defaultValue : any,
    inputTypeProps : any,
    descriptionTextMapper : (value:number)=>string
}

export class DeveloperFeedbackItemsParams{

    /**@ts-ignore**/
    static moodOptions = [Mood.Neg1, Mood.Neg2, Mood.Neutral, Mood.Plus1, Mood.Plus2].map((m)=>moodToString(m).name)

    static MOOD_SLIDER : DeveloperFeedbackItemParams = {title : "Mood",
        question:"How would you rate your mood about this project?",
        inputType:InputType.SLIDER_SMILEY,
        defaultValue:3,
        inputTypeProps : {
            min:1,
            max:5,
            tooltip:{formatter:(n:number)=>this.moodOptions[n-1]}
        },
        descriptionTextMapper:(mood)=>{
            return moodToString(mood-3).description
        }

    }
}



export function DeveloperFeedbackItem({params, index, getCurrentValue} :
                                          {params : DeveloperFeedbackItemParams, index : string, getCurrentValue:()=>number}){


    const [value, setValue] = useState(getCurrentValue())
    const MyInput = ()=>{
        switch (params.inputType){
            case InputType.SLIDER_SMILEY: return <IconSlider onChange={()=>setValue(getCurrentValue())} defaultValue={params.defaultValue} formID={index} props={params.inputTypeProps}/>
            default: return <></>
        }
    }

    const [input] = useState(<MyInput/>)

    useEffect(()=>{
        setValue(params.defaultValue)
    }, [])




    return(
        <div style={{display:"flex", flexDirection:"column", gap:16}}>
            <Title level={5}>{params.title}</Title>
            <Text>{params.question}</Text>
            {input}
            <Text style={{padding:0, color:"gray"}}>{params.descriptionTextMapper!=null ? params.descriptionTextMapper(value) : ""}</Text>
        </div>
    )


}