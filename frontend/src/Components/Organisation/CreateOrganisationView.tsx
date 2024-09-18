import {Form, Input, message, Modal, Spin} from "antd";
import React, {useState} from "react";
import {useNavigate} from "react-router-dom";
import {Organisation} from "../../Models/DatabaseObjects/Organisation";
import {FormValidationService} from "../../Services/Utils/FormValidationService";
import {NavRoute} from "../../Services/NavigationServices/NavRoutes";
import {Session, useCurrentUser} from "../../Services/SessionServices/Session";


export function CreateOrganisation(){

    const currentUser = useCurrentUser()

    const navigate = useNavigate()

    const [loading, setLoading] = useState(false)
    const [modalOpen, setModalOpen] = useState(true)

    const [form] = Form.useForm()


    const onOrganisationCreate = (values : any)=>{
        setLoading(true)
        let org = new Organisation(values.name, currentUser, [currentUser], null)
        Session.organisationService.create(org)
        .then(() =>{
            setModalOpen(false)
            Session.userService.currentUser.setOrganisation(org)
            message.success("Organisation created")
            navigate(NavRoute.ORGANISATION)
        })
        .catch(()=>{
            message.error("Organisation creation failed")
        })
        .finally(()=>setLoading(false))

    }

    const onCancel = ()=>{
        setModalOpen(false)
        navigate(-1)
    }

    if(currentUser == null) return <></>
    else
    return (
        <>
        <Modal
        okText="Create"
        open={modalOpen}
        onOk={form.submit}
        onCancel={onCancel}
        >
            <Spin spinning={loading}>
            <Form form={form}
            name="basic"
            onFinish={onOrganisationCreate}
            layout="vertical">


                <Form.Item
                label="Organisation name"
                name="name"
                rules={[FormValidationService.CANNOT_BE_BLANK]}>
                    <Input />
                </Form.Item>
            </Form>
            </Spin>
        </Modal>
        </>
    )

}