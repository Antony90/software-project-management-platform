import {ColourPair} from "../Styles/ColourScheme";
import React from "react";
import {Typography} from "antd";

const {Text} = Typography

export function ColouredTag({value, colour} : {value : string, colour:ColourPair}){

    return (
        <Text style={{
            backgroundColor:colour.background,
            color:colour.foreground,
            padding:10,
            fontWeight:"bold",
            borderRadius:"0.25rem"}}>
            {value}
        </Text>
    )

}