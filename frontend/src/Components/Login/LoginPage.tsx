import {Button, Form, Input, message, Space, Spin} from "antd";
import React, {useState} from "react";
import {User} from "../../Models/DatabaseObjects/User";
import {AuthService} from "../../Services/SessionServices/AuthService";
import {Session} from "../../Services/SessionServices/Session";
import {NavRoute} from "../../Services/NavigationServices/NavRoutes";
import {useNavigate} from "react-router-dom";

export function LoginPage(){


	const [loading, setLoading] = useState(false)
	const navigate = useNavigate()

    const onLoginClicked = (values : any) => {
		setLoading(true)
		AuthService.authorise(values.username, values.password)
		.then((u : User)=>{
			Session.setCurrentUser(u)
		})
		.catch(()=>{
			message.error("Incorrect login details")
		})
		.finally(()=>
			setLoading(false)
		)
		
	}

	const onCreateAccountClicked = ()=>{
		navigate(NavRoute.CREATE_ACCOUNT)
	}

	return (
		<Spin spinning={loading}>
		<Form
		name="basic"
		onFinish={onLoginClicked}
		layout="vertical">
				
			<Form.Item
			label="Email"
			name="username"
			rules={[{ required: true, message: 'Cannot be blank' }]}>
				<Input />
			</Form.Item>
		
			<Form.Item
			label="Password"
			name="password"
			rules={[{ required: true, message: 'Cannot be blank' }]}>
				<Input.Password />
			</Form.Item>
			
			<Form.Item>
				<Space style={{width:"100%", justifyContent:"center"}}>
					<Button type="primary" htmlType="submit">
						Log In
					</Button>
					<Button htmlType="button" onClick={onCreateAccountClicked}>
						Create Account
					</Button>
				</Space>
			</Form.Item>
		</Form>
		</Spin>
	)
}

