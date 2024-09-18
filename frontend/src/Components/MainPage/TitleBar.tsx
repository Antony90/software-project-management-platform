import {Dropdown, MenuProps, message, Space} from "antd";
import React from "react";
import {useNavigate} from "react-router-dom";
import {AuthService} from "../../Services/SessionServices/AuthService";
import {NavRoute} from "../../Services/NavigationServices/NavRoutes";
import {Session, useCurrentUser} from "../../Services/SessionServices/Session";
import {TitleMenu} from "./TitleMenu";
import {AvatarGenerator} from "../Utils/AvatarGenerator";


export function TitleBar(){

    const currentUser = useCurrentUser()

    const navigate = useNavigate()

    function onAccount(){
        navigate(NavRoute.ACCOUNT)
    }

    function onAbout(){
        navigate(NavRoute.ABOUT)
    }

    function onLogout(){
        AuthService.logout().then(()=>{
            message.success("Logged out")
            Session.refresh()
            navigate(NavRoute.AUTHORISATION)
        })
        .catch(()=>
            message.error("Failed to log out")
        )
    }

    const items: MenuProps['items'] = [
        {
          key: '1',
          label: (<a onClick={onAccount}>Account</a>),
        },
        {
            key: '3',
            label: (<a onClick={onAbout}>About</a>),
        },
        {
            key:'4',
            label:(<a onClick={onLogout}>Logout</a>)
        }
      ];


    if(currentUser == null){
		return <></>
	}
	else
    return (
        <div style={{display:"flex", width:"100%"}}>
            <TitleMenu />
            <Space style={{marginLeft: "auto"}}>
                <Dropdown menu={{ items }} placement="bottomRight" arrow>
                    {AvatarGenerator.forUser(currentUser, false,{size:"large"})}
                </Dropdown>
            </Space>
        </div>
    )
}