import {Button, Form, Input, message, Popconfirm, Space, Spin, Typography} from "antd";
import React, {useState} from "react";
import {FormValidationService} from "../../Services/Utils/FormValidationService";
import {Session, useCurrentUser} from "../../Services/SessionServices/Session";
import {RequestFailureException} from "../../API/RequestFailureException";
import {useNavigate} from "react-router-dom";
import {NavRoute} from "../../Services/NavigationServices/NavRoutes";
import possibleSkills from "common/build-models/Skills";
import {MultiTagSelect} from "../Utils/MultiTagSelect";
import {Utils} from "../../Services/Utils/Utils";
import {HTTPRequestMethod} from "../../API/APIEndpoint";
import {UserSaver} from "../../Models/DatabaseObjectSavers/UserSaver";


const { Title } = Typography

export function AccountPage(){

    const currentUser = useCurrentUser()

    const navigate = useNavigate()

    const [loading, setLoading] = useState(false)



    const onFailure = ()=>{
        message.error("Update failed")
    }

    const onSuccess = ()=>{
        message.success("Details updated successfully")
        navigate(-1)
    }

    function onSaveDetails(values : any){
    
        let firstnameChange = values.firstname !== currentUser.firstName
        let lastnameChange = values.lastname !== currentUser.lastName
        let emailChange = values.email !== currentUser.email

        if(!firstnameChange && !lastnameChange && !emailChange && !Utils.hasChanges(currentUser.skillSet, values.skillSet)) return onSuccess()

        if(firstnameChange) currentUser.firstName = values.firstname
        if(lastnameChange) currentUser.lastName = values.lastname
        if(emailChange) currentUser.email = values.email


        setLoading(true)
        new UserSaver(currentUser).saveSkills(values.skillSet)
            .then(()=>{
                onSuccess()
            })
            .catch(()=>{
                
                onFailure()
            })
            .finally(()=>
                setLoading(false)
            )

        /*
        setLoading(true)
        Session.userService.update(currentUser)
        .then((u : User)=>{
            Session.setCurrentUser(u)
            message.success("Details updated successfully")
            navigate(-1)
        })   
        .catch((e : RequestFailureException)=>{
            onFailure()
        })
        .finally(()=>
            setLoading(false)
        )
        */
    }

    const deleteAccount = ()=>{
        setLoading(true)
        Session.userService.delete(currentUser, false, HTTPRequestMethod.DELETE)
            .then(()=>{
                message.success("Account Deleted")
                Session.end()
                Session.start()
                navigate(NavRoute.LOGIN)
            })
            .catch((e : RequestFailureException)=>{
                switch (e.errorCode){
                    case 400: message.info("You must leave your organisation before deleting your account"); break;
                    default: message.error("Account Deletion Failed")
                }

            })
            .finally(()=>{
                setLoading(false)
            })

    }

    if(currentUser == null) return <></>
    else
    return (
        <Spin spinning={loading}>
        <Space style={{width:"300px", justifyContent:"center", alignItems:"center"}} direction="vertical" >
        <Title>Edit details</Title>
        <Form
		name="basic"
		initialValues={{ firstname : currentUser.firstName, lastname:currentUser.lastName, email:currentUser.email, skillSet:currentUser.skillSet  }}
		onFinish={onSaveDetails}
        style={{width:"300px"}}
		layout="vertical">

            <Form.Item
			label="First Name"
			name="firstname"
			rules={[FormValidationService.CANNOT_BE_BLANK, FormValidationService.NAME_FORMAT]}>
				<Input/>
			</Form.Item>

            <Form.Item
			label="Last Name"
			name="lastname"
			rules={[FormValidationService.CANNOT_BE_BLANK, FormValidationService.NAME_FORMAT]}>
				<Input/>
			</Form.Item>

			<Form.Item
			label="Email"
			name="email"
			rules={[FormValidationService.CANNOT_BE_BLANK, FormValidationService.EMAIL_FORMAT]}>
				<Input/>
			</Form.Item>

            <Form.Item label="Skill-set" name="skillSet">
                <MultiTagSelect placeholder="My Skills"
                                data={possibleSkills}
                                labelify={(s)=>{return{label:s, value:s}}}  />
            </Form.Item>

			<Form.Item>
                <Space>
                    <Button type="primary" htmlType="submit">
                        Save
                    </Button>
                    <Button type="default" onClick={()=>{navigate(-1)}}>
                        Cancel
                    </Button>
                </Space>
			</Form.Item>

            <Form.Item>
                <Popconfirm
                    title="Delete Account"
                    description="Are you sure you want to delete your account (this cannot be undone)"
                    onConfirm={deleteAccount}
                    okText="Yes"
                    cancelText="No"
                >
                    <Button danger>Delete Account</Button>
                </Popconfirm>
            </Form.Item>

		</Form>
        </Space>
        </Spin>
    )
}