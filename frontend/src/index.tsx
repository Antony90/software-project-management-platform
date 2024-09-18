import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {createBrowserRouter, RouterProvider,} from "react-router-dom";
import {NavRoute} from './Services/NavigationServices/NavRoutes';
import {AuthPage} from './Components/Login/AuthPage';
import {MainContent} from './Components/MainPage/MainContent';
import {CreateOrganisation} from './Components/Organisation/CreateOrganisationView';
import {JoinOrganisation} from './Components/Organisation/JoinOrganisation';
import {OrganisationView} from './Components/Organisation/OrganisationView';
import {CreateProjectView} from './Components/Project/Creation/CreateProjectView';
import {ProjectView} from './Components/Project/View/ProjectView';
import {AccountPage} from './Components/Settings/AccountPage';
import {Dashboard} from './Components/Dashboard/Dashboard';
import {ErrorPage} from './Components/Utils/ErrorPage';
import {LeaveOrganisationView} from './Components/Organisation/LeaveOrganisationView';
import {CreateAccountPage} from "./Components/Login/CreateAccountPage";
import {LoginPage} from "./Components/Login/LoginPage";
import {About} from "./Components/About/About";

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

const router = createBrowserRouter([
	{
		path: NavRoute.ROOT,
		element: <App />,
		errorElement: <ErrorPage />,
		children:[
			{
				path: NavRoute.AUTHORISATION,
				element: <AuthPage />,
				children:[
					{
						path:NavRoute.CREATE_ACCOUNT,
						element: <CreateAccountPage/>
					},
					{
						path:NavRoute.LOGIN,
						element: <LoginPage/>
					}
				]
			},
			{
				path: NavRoute.MAIN,
				element: <MainContent />,
				children:[
					{
						path: NavRoute.CREATE_PROJECT,
						element: <CreateProjectView/>
					},
					{
						path: NavRoute.DASHBOARD,
						element:<Dashboard/>
					},
					{
						path:NavRoute.PROJECT + "/:id",
						element:<ProjectView/>
					},
					{
						path:NavRoute.ORGANISATION,
						element:<OrganisationView/>
					},
					{
						path:NavRoute.JOIN_ORGANISATION + "/:id",
						element:<JoinOrganisation/>
					},
					{
						path:NavRoute.JOIN_ORGANISATION,
						element:<JoinOrganisation/>
					},
					{
						path:NavRoute.ACCOUNT,
						element:<AccountPage/>
					},
					{
						path:NavRoute.ABOUT,
						element: <About/>
					},
					{
						path:NavRoute.CREATE_ORGANISATION,
						element:<CreateOrganisation/>
					},
					{
						path: NavRoute.LEAVE_ORGANISATION,
						element:<LeaveOrganisationView/>
					}

				]
			},
		]
	},
	
]);


root.render(

    <RouterProvider router={router} />

);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
