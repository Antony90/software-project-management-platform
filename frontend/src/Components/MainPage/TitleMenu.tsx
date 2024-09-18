import {Menu, MenuProps} from "antd";
import React, {useEffect, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {NavRoute} from "../../Services/NavigationServices/NavRoutes";
import {useCurrentUser} from "../../Services/SessionServices/Session";
import {ClusterOutlined, HomeOutlined, ProjectOutlined} from '@ant-design/icons';

type MenuItem = Required<MenuProps>['items'][number];



function getItem(label: React.ReactNode,key: React.Key, children?: MenuItem[], icon?:JSX.Element, type?: 'group'): MenuItem {
  	return {key,children,label,type, icon} as MenuItem;
}



export function TitleMenu(){

	const [items, setItems] = useState(null)

	const currentUser = useCurrentUser()

	const getItems : ()=>MenuProps['items'] = ()=>{ 
		let orgItems
		if(currentUser.organisation != null){
			orgItems= [
				getItem("My Organisation", NavRoute.ORGANISATION),
				getItem( "Leave Organisation", NavRoute.LEAVE_ORGANISATION),
			]
		}
		else{
			orgItems=[
				getItem("Create Organisation", NavRoute.CREATE_ORGANISATION),
				getItem("Join Organisation", NavRoute.JOIN_ORGANISATION)
			]
		}

		return [
			getItem("Dashboard", NavRoute.DASHBOARD, null, <HomeOutlined/>),
			getItem("Projects", NavRoute.PROJECT, [
				getItem("New Project", NavRoute.CREATE_PROJECT),
			], <ProjectOutlined />),
			getItem("Organisation", null, orgItems, <ClusterOutlined/>)
		]
	}


	const [currentSidebarSelection, setCurrentSidebarSelection] = useState([])

	const navigate = useNavigate()

	const location = useLocation();

	useEffect(()=>{
		if(currentUser != null){
			setItems(getItems())
		}
		try{
			let r = location.pathname as NavRoute
			setCurrentSidebarSelection([r])
		}
		catch{setCurrentSidebarSelection([])}
	}, [location, currentUser])


	const setContent = (route : NavRoute)=>{
		navigate(route)
	}
	
  	const onMenuSelection : MenuProps['onClick'] = (e)=>{
		setContent(e.key as NavRoute)
  	}



	return (
		<Menu
		onClick={onMenuSelection}
		mode="horizontal"
		items={items}
		selectedKeys={currentSidebarSelection}
		style={{backgroundColor:"transparent"}}
		/>
	)
}

  