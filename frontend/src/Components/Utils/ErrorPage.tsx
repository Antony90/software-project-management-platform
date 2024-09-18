import {Button, Divider, Typography} from "antd";
import React from "react";
import {useNavigate} from "react-router-dom";
import {NavRoute} from "../../Services/NavigationServices/NavRoutes";

const {Title} = Typography

export function ErrorPage(){

    const navigate = useNavigate()
    return (
    <div style={{display:"flex",flexDirection:"column",justifyContent:"center", alignItems:"center", width:"100%", height:"100%"}}>
        <Title>Oops!</Title>
        <Title level={3}>This page doesn't exist or an unexpected error occurred</Title>
        <Divider style={{minWidth:"200px", width:"200px" }}/>
        <Button type="primary" onClick={()=>{navigate(NavRoute.DASHBOARD); window.location.reload()}}>Home</Button>
    </div>
    )
}