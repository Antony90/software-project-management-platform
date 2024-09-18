import {Button, Col, Divider, Row, Space, Spin, Typography} from "antd";
import React, {useEffect, useState} from "react";
import {Project} from "../../Models/DatabaseObjects/Project";
import {Session, useCurrentUser} from "../../Services/SessionServices/Session";
import {ProjectCard} from "../Project/ProjectCard";
import {useNavigate} from "react-router-dom";
import {NavRoute} from "../../Services/NavigationServices/NavRoutes";
import {FeedbackScheduler} from "../DeveloperFeeback/DeveloperFeedback";
import {Credentials} from "../../Models/Credentials";

const { Title } = Typography

export function Dashboard(){

    const currentUser = useCurrentUser()

    const [projects, setProjects] = useState(null)

    const navigate = useNavigate()


    const [loading, setLoading] = useState(false)




    useEffect(()=>{
        if(currentUser != null) {
            setLoading(true)
            Session.projectService.getMultiple(currentUser.projects)
                .then((p : Project[])=>{
                    setProjects(p)
                    p.forEach((project)=>{
                        if(!project.isProjectManager(currentUser)) FeedbackScheduler.scheduleMoodFeeback(project.getID(), currentUser.getID())
                    })
                })
                .catch(()=>{
                    //message.error("Couldn't load projects")
                    //navigate(NavRoute.AUTHORISATION)
                    setProjects([])
                })
                .finally(()=>setLoading(false))
        }
    }, [currentUser])



    function onProjectSelected(project : Project){

        navigate("../" + NavRoute.PROJECT + "/" + project.getID())
    }
    

    function onProjectCreate(){
        navigate(NavRoute.CREATE_PROJECT)
    }

    
    function SummaryCards() : JSX.Element[]{
        if(projects == null) return [<></>]

        let upcomingCards : JSX.Element[] = []
        let succeededCards : JSX.Element[] = []
        let failedCards : JSX.Element[] = []
        let progressCards : JSX.Element[] = []


        projects.forEach(
            (project : Project) =>{
                let col = (
                    <Col key={project.getID()} style={{width : 400}}>
                        <ProjectCard key={project.getID()} project={project} onClick={()=>onProjectSelected(project)}/>
                    </Col>
                )
                if(project.isComplete() && !project.hasFailed()) succeededCards.push(col)
                else if(project.hasFailed()) failedCards.push(col)
                else if(project.startDate > new Date()) upcomingCards.push(col)
                else progressCards.push(col)
            }
        )
        if(projects.length == 0){
            return(
                [<>
                    <Space key={Credentials.UUID()} direction="vertical">
                        <Title>Looks like you don't have any projects on the go right now...</Title>
                        <Space>
                            <Button type="default" onClick={onProjectCreate}>Create a project</Button>
                        </Space>
                    </Space>
                </>]
            )
        }

        let ret = []

        if(progressCards.length != 0){
            ret.push(<Divider style={{color:"gray", fontSize:20}}>In Progress ({progressCards.length})</Divider>)
            ret.push(<Row gutter={[4, 4]} justify="center" style={{marginLeft:0, marginRight:"0px"}}>{progressCards}</Row>)
        }
        if(upcomingCards.length != 0){
            ret.push(<Divider style={{color:"gray", fontSize:20}}>Upcoming ({upcomingCards.length})</Divider>)
            ret.push(<Row gutter={[4, 4]} justify="center" style={{marginLeft:0, marginRight:"0px"}}>{upcomingCards}</Row>)
        }
        if(succeededCards.length != 0){
            ret.push(<Divider style={{color:"gray", fontSize:20}}>Successful ({succeededCards.length})</Divider>)
            ret.push(<Row gutter={[4, 4]} justify="center" style={{marginLeft:0, marginRight:"0px"}}>{succeededCards}</Row>)
        }
        if(failedCards.length != 0){
            ret.push(<Divider style={{color:"gray", fontSize:20}}>Failed ({failedCards.length})</Divider>)
            ret.push(<Row gutter={[4, 4]} justify="center" style={{marginLeft:0, marginRight:"0px"}}>{failedCards}</Row>)
        }


        return ret

    
    }

    if(currentUser == null){
		return <></>
	}
	else
        return (
            <Space>
            <Spin spinning={loading}>
                {SummaryCards()}
            </Spin>
            </Space>
        )
}