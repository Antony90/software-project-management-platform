import {User} from "../../Models/DatabaseObjects/User";
import {MultiTagSelect} from "./MultiTagSelect";
import {AvatarGenerator} from "./AvatarGenerator";
import React from "react";

export function DeveloperSelect({value = [], onChange, possibleDevelopers, placeholder, disabled=false} :
                                    {value? : string[], onChange?: (s:string[])=>void, possibleDevelopers:User[], placeholder:string, disabled?:boolean}){

    const getDeveloper = (id : string)=>{
        return possibleDevelopers.find((u)=>u.getID() == id)
    }

    const labelifyDeveloper = (id : string)=>{
        let d = getDeveloper(id)
        return {label:d.getFullName(), value:d.getID()}
    }




    if(possibleDevelopers == null) return <></>
    return(

        <MultiTagSelect
                        value={value}
                        onChange={onChange}
                        disabled={disabled}
                        placeholder={placeholder}
                        data={possibleDevelopers.map((d)=>d.getID())}
                        labelify={labelifyDeveloper}
                        getTag={(props)=>AvatarGenerator.forName(props.value, props.label, true)}/>
    )


}