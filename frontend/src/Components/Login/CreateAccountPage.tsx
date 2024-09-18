import React, {useState} from 'react';
import {Button, Form, Input, message, Space, Spin} from 'antd';
import {FormValidationService} from '../../Services/Utils/FormValidationService';
import {Session} from '../../Services/SessionServices/Session';
import {User} from '../../Models/DatabaseObjects/User';
import {RequestFailureException} from '../../API/RequestFailureException';
import {ResponseMessage} from '../../API/ResponseMessage';
import {useNavigate} from "react-router-dom";
import {NavRoute} from "../../Services/NavigationServices/NavRoutes";


export function CreateAccountPage(){

	const [form] = Form.useForm();
	const pwd = Form.useWatch('password', form);
	const repeatPwd = Form.useWatch('repeatPassword', form);
	const navigate = useNavigate()

	const [ loading, setLoading ] = useState(false)



	function onCreateAccount(values : any){
		setLoading(true)
		Session.userService.registerUser(values)
		.then((u : User)=>{
			Session.setCurrentUser(u)
		})
		.catch((e : RequestFailureException)=>{
			onIncorrectCreateAccount(e)
		})
		.finally(()=>
			setLoading(false)
		)
	}

	function onIncorrectCreateAccount(e : RequestFailureException){
		switch(e.responseMessage){
			case ResponseMessage.USER_EXISTS: message.error("User already exists"); break;
			default: message.error("An unexpected error occured: " + e.message)
		}
	}
	const onLoginClicked = ()=>{
		navigate(NavRoute.LOGIN)
	}


	return (
		<Spin spinning={loading}>
		<Form
		form={form}
		onChange={()=>{form.validateFields(['password', 'repeatPassword'])}}
		name="basic"
		onFinish={onCreateAccount}
		layout="vertical">
				
			
			<Form.Item
			label="Forename"
			name="firstname"
			rules={[FormValidationService.CANNOT_BE_BLANK, FormValidationService.NAME_FORMAT]}>
				<Input />
			</Form.Item>
		
			<Form.Item
			label="Surname"
			name="surname"
			rules={[FormValidationService.CANNOT_BE_BLANK, FormValidationService.NAME_FORMAT]}>
				<Input />
			</Form.Item>

			<Form.Item
			label="Email"
			name="email"
			rules={[FormValidationService.CANNOT_BE_BLANK, FormValidationService.EMAIL_FORMAT]}>
				<Input />
			</Form.Item>

			<Form.Item
			label="Password"
			name="password"
			rules={[FormValidationService.CANNOT_BE_BLANK, FormValidationService.PASSWORD_FORMAT, FormValidationService.PASSWORD_REPEAT_VALUE(repeatPwd)]}>
				<Input.Password />
			</Form.Item>

			<Form.Item
			label="Repeat Password"
			name="repeatPassword"
			rules={[FormValidationService.CANNOT_BE_BLANK, FormValidationService.PASSWORD_REPEAT_VALUE(pwd)]}>
				<Input.Password />
			</Form.Item>
			
			<Form.Item>
				<Space style={{width:"100%", justifyContent:"center"}}>
					<Button htmlType="button" onClick={onLoginClicked}>
						Login
					</Button>
					<Button type="primary" htmlType="submit">
						Create Account
					</Button>
				</Space>
			</Form.Item>
		</Form>
		</Spin>
	)
}