import React, {useEffect, useState} from 'react'
import './App.css'
import {URLParam, URLService} from './Services/NavigationServices/URLService';
import {RefreshReason, Session, useCurrentUser} from './Services/SessionServices/Session';
import {message, Spin} from 'antd';
import {Outlet, useLocation, useNavigate,} from 'react-router-dom';
import {NavRoute} from './Services/NavigationServices/NavRoutes';


function App() {

	const navigate = useNavigate()

	const [loading, setLoading ] = useState(false)

	const currentUser = useCurrentUser(setLoading)

	const location = useLocation();


	useEffect(()=>{

		if(currentUser != null){
			if(!Session.started){
				Session.start()
				//Mocker.inject() //TURN THIS OFF TO CONNECT TO THE SERVER, DON'T CHANGE ANYTHING ELSE
				let urlService = new URLService()
				let refreshReason = urlService.getUrlParam(URLParam.REFRESH_REASON)
				var shouldAutoauth = true
				if(refreshReason != null){
					shouldAutoauth = handleRefresh(refreshReason as RefreshReason)
					urlService.removeUrlParams(URLParam.REFRESH_REASON)
				}
				if(shouldAutoauth){
					if(location.pathname == "/"){
						navigate(NavRoute.MAIN)
					}
				}
				else{
					Session.setCurrentUser(null)
				}
			}
		}
	}, [currentUser])


	function handleRefresh(reason : RefreshReason) : boolean{
		switch(reason){
			case RefreshReason.LOGOUT: message.success("Logged out"); return false
			case RefreshReason.SESSION_EXPIRY: message.warning("Session expired"); return false
		}
	}
	useEffect(() => {
		window.onbeforeunload = () => {
			Session.end()
		}
	}, []);

  	


	return (
		<div className="App">
		<header className="App-header">
			<Spin spinning={loading}/>
			<Outlet />

		</header>
		</div>
	);
}

export default App;


