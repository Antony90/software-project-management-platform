import React, {useEffect} from 'react';
import {Outlet, useLocation, useNavigate} from 'react-router-dom';
import {useCurrentUser} from '../../Services/SessionServices/Session';
import {NavRoute} from "../../Services/NavigationServices/NavRoutes";


export function AuthPage() {

	const navigate = useNavigate()
	const location = useLocation()
	const {state} = useLocation()
	const currentUser = useCurrentUser()


	useEffect(()=>{
		if(currentUser != null){
			if(state != null) {
				const {redirect} = state
				if (redirect == null) navigate(NavRoute.DASHBOARD);
				else {
					if(redirect.replace("/", "") == "") navigate(NavRoute.DASHBOARD)
					else navigate(redirect)
				}
			}
			else navigate(NavRoute.DASHBOARD)

		}
		else{
			if(location.pathname.indexOf(NavRoute.CREATE_ACCOUNT) == -1){
				navigate(NavRoute.LOGIN, {state:state})
			}

		}
	}, [currentUser])



	const authStyle : React.CSSProperties = {
		border: "1px solid lightgray",
		padding: "20px",
		borderRadius: "0.5rem",
		overflow:"auto",
		maxHeight: "80%"
	}

	return (
		<div style={{width:"100%", height:"100%", display:"flex", justifyContent:"center", alignItems:"center"}}>
			<div style={authStyle}>
				<Outlet/>
			</div>
		</div>
	)
}
