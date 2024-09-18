import {Button, Divider, Input, message, Modal, Space, Spin, Typography} from "antd";
import React, {useEffect, useState} from "react";
import {Organisation} from "../../Models/DatabaseObjects/Organisation";
import {Session, useCurrentUser} from "../../Services/SessionServices/Session";
import {useLocation, useNavigate, useParams} from "react-router-dom";
import {NavRoute} from "../../Services/NavigationServices/NavRoutes";


const { Text, Title } = Typography;

export function JoinOrganisation(){

    const navigate = useNavigate()


    const {state} = useLocation();

    const { id } = useParams()

    const currentUser = useCurrentUser()
    
    const [ loading, setLoading ] = useState(false)

    const [ view, setView ] = useState(<></>)

    const [ modalVisibility , setModalVisibility ] = useState(false)

    const [ orgID, setOrgID ] = useState("")

    const body = (o : Organisation) => (
       
        <Space direction="vertical" size="middle" style={{ display: 'flex', width:"100%" }}>
            <Title>Join '{o.name}'</Title>
            <Divider/>
            <div style={{display:"flex", flexDirection:"column"}}>
            <Text>You have been invited to join an organisation with {o.numMembers} members</Text>
            <Text>(Admin: {o.admin.getID().replace(",", "")})</Text>
            </div>
            <Divider/>

            <Space>
                <Button type="primary" onClick={()=>onJoin(o)}>Join</Button>
                <Button type="default" onClick={()=>navigate(-1)}>Cancel</Button>
            </Space>
        </Space>
    )

    const getOrganisation = (id : string)=>{
        setLoading(true)
        Session.organisationService.get(id)
        .then((o : Organisation) =>{
            o.setID(id)
            setView(body(o))
            setModalVisibility(false)
        })
        .catch(() =>{
            message.error("Incorrect join details")
        })
        .finally(()=>{
            setLoading(false)
        })
    }

    useEffect(() => {
        if(currentUser != null){
            if(id == null) setModalVisibility(true)
            else {
                if(currentUser.organisation == null) getOrganisation(id)
                else {
                    message.info("You are already a member of an organisation")
                    navigate(NavRoute.DASHBOARD)
                }
            }
        }
    }, [currentUser])


    function onCancelOrError(){

        if(id==null){
            if(state == null) navigate(-1)
            else{
                const {popBackTimes} = state
                navigate(parseInt(popBackTimes) * -1)
            }
        } 
        else navigate(NavRoute.DASHBOARD)
    }



    function onJoin(org : Organisation){
        setLoading(true)
        Session.organisationService.join(org)
        .then(( o : Organisation)=>{
            Session.userService.currentUser.setOrganisation(o)
            message.success("Joined successfully")
            navigate(NavRoute.ORGANISATION)
        })
        .catch(()=>{
            message.error("Join Failed")
            onCancelOrError()
        })
        .finally(()=>setLoading(false))
    }


    const onOrgID = ()=>{
        getOrganisation(orgID)
    }

    
    if(currentUser == null)return <></>
    else return(
        <>
        <Modal title="Organisation Join Code" open={modalVisibility} onOk={onOrgID} onCancel={onCancelOrError}>
            <Spin spinning={loading}>
            <Text>You're not currently a member of an organisation, enter a join code below to link up with your team.</Text>
            <Input style={{marginTop : "10px"}} placeholder="Code" value={orgID} onChange={(e : any) => setOrgID(e.target.value)}/>
            </Spin>
        </Modal>
        <Spin spinning={loading && !modalVisibility}>
            <div style={{display:"flex", justifyContent:"center", alignItems:"center", width:"100%"}}>
                {view}
            </div>
        </Spin>
        </>
    )

}