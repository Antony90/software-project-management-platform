import {message, Modal, Spin, Typography} from "antd"
import React, {useEffect, useState} from "react"
import {useNavigate} from "react-router-dom"
import {Organisation} from "../../Models/DatabaseObjects/Organisation"
import {Session, useCurrentUser} from "../../Services/SessionServices/Session"
import {NavRoute} from "../../Services/NavigationServices/NavRoutes";

const {Text} = Typography

export function LeaveOrganisationView(){
    const navigate = useNavigate()
    const [modal, setModal] = useState(true)
    const currentUser = useCurrentUser()
    const [contents, setContents ] = useState(<></>)
    const [loading, setLoading] = useState(true)

    const getContents = (o : Organisation)=>{
        return (<Text>
            Are you sure you want to leave {o.name}
        </Text>)
    }

    useEffect(()=>{
        if(currentUser != null){
            currentUser.organisation.getFullObject()
            .then((o : Organisation)=>{
                setContents(getContents(o))
            })
            .catch(()=>{
                message.error("Failed to load organisation data")
                navigate(-1)
            })
            .finally(()=>setLoading(false))
        }
    }, [currentUser])

    const onCancelOrError = () =>{
        navigate(-1)
    }

    const onOK = ()=>{
        setLoading(true)
        Session.organisationService.leave(currentUser)
        .then(()=>{
            Session.userService.currentUser.organisation = null
            message.success("Organisation left successfully")
            navigate(NavRoute.DASHBOARD)
        })
        .catch(()=>{
            message.error("Failed to leave organisation")
            onCancelOrError()
        })
        .finally(()=>{
            setLoading(false)
            setModal(false)
        })
    }

    return (
        <Modal title="Leave Organisation?" open={modal} onOk={onOK} onCancel={onCancelOrError}>
            <Spin spinning={loading}>
                {contents}
            </Spin>
        </Modal>
    )
}