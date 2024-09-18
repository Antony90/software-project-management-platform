import {Select, SelectProps} from "antd";
import React, {ReactElement} from "react";
export function MultiTagSelect({ value, onChange, placeholder, data, labelify, disabled=null, getTag = null} :
    {value? : any, onChange? :(a:any[])=>void,placeholder : string,
        data : string[], labelify : (a : any)=>{label:string, value:string}, getTag? : (props:any)=>ReactElement, disabled?:boolean }) {



    const selectProps: SelectProps = {
          mode: 'multiple',
          style: { width: '100%' },
          options:data.map(i=>labelify(i)),
          placeholder: placeholder,
          maxTagCount: 'responsive',
    };

    if(getTag == null){
        return <Select value={value} onChange={onChange} disabled={disabled} {...selectProps}/>
    }
    else{
        return <Select value={value} onChange={onChange} disabled={disabled} {...selectProps} tagRender={getTag}/>
    }
}