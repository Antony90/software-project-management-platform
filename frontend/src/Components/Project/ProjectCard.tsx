import {Avatar, Badge, Card, message, Progress, Space, Tooltip, Typography} from "antd";
import React, {useEffect, useState} from "react";
import {Project} from "../../Models/DatabaseObjects/Project";
import {AvatarGenerator} from "../Utils/AvatarGenerator";
import {Session, useCurrentUser} from "../../Services/SessionServices/Session";
import {SchedulableEventType, usePendingEvents} from "../../Services/SessionServices/SchedulerService";
import {ClockCircleOutlined} from "@ant-design/icons"
import {Utils} from "../../Services/Utils/Utils";

const {Text} = Typography
export function ProjectCard({project, onClick} : {project : Project, onClick : ()=>void}){

    const [devAvatars, setDevAvatars] = useState(<></>)

    const pendingFeedbacks = usePendingEvents(SchedulableEventType.DEVELOPER_FEEDBACK_EVENT, (e)=>{
        return e.extras.project == project.getID()
    })

    const currentUser = useCurrentUser()


    useEffect(()=>{
        let avatars : JSX.Element[] = []

        Session.userService.getMultiple(project.developers)
            .then((users)=>{
                users.forEach((u)=>{
                    avatars.push(AvatarGenerator.forUser(u, true))
                    setDevAvatars(<Avatar.Group maxCount={4}>{avatars}</Avatar.Group>)
                })
            })
            .catch(()=>{
                
                message.error("Failed to load users")
            })
    }, [])

    const getTimeProgress = ()=>{
        if(project.startDate > new Date()){
            let daysToStart = project.getDaysUntilStart()
            return <div style={{display:"flex", gap:8, justifyContent:"center", alignItems:"center"}}>
                <ClockCircleOutlined />
                <Text>{`${daysToStart} ${Utils.pluralise(daysToStart, "day", "days")} Until Start`}</Text>
            </div>
        }
        let daysUntilCompletion = project.getDaysUntilCompletion()
        let progressText = `${daysUntilCompletion} ${Utils.pluralise(daysUntilCompletion, "day", "days")} Left`
        let progressStatus : "active" | "exception" | "normal" | "success" = "active"
        let progressValue = project.getTimeframeProgressPercentage()

        if(project.hasFailed()) {
            progressStatus = "exception"
            progressValue = 100
            progressText = "Failed"
        }
        else if(project.isComplete()) {
            progressStatus = "success"
            progressValue = 100
            progressText = "Succeeded"
        }
        return <Progress status={progressStatus} style={{width:"80%"}} percent={progressValue} format={() => progressText} />
    }

    const incompleteTasks = ()=>{
        let tasks = 0
        project.tasks.forEach((t)=>{
            if(!t.isComplete()){
                tasks++
            }
        })
        return tasks
    }

    const getIncompleteTasksText = ()=>{
        let tasks = incompleteTasks()
        if(tasks == 1) return (<Text>{tasks} task to complete</Text>)
        else return (<Text>{tasks} tasks left ({project.getCompletionPercentage()}% complete)</Text>)

    }

    const getFailureRisk = ()=>{
        if(project.isProjectManager(currentUser)){
            return (
                <div style={{display:"flex", gap:8, alignItems:"center"}}>
                    <Text>Risk of failure: {project.breakdown.getTopLevelMetric().getRiskPercentage()}%</Text>
                    <Tooltip title={`${project.breakdown.getTopLevelMetric().getSeverity(true).params.name} chance of failure`}>
                        {project.breakdown.getTopLevelMetric().getSeverity(true).params.icon}
                    </Tooltip>
                </div>
            )
        }
        return <></>
    }



    if(currentUser == null) return <></>
    return (

        <Card hoverable onClick={onClick} title={project.name} extra={
            <Tooltip title={"Uncompleted feedback items"}><Badge count={pendingFeedbacks.length}/></Tooltip>
        } style={{ margin : "20px", textAlign:"start", height:"250px"}}>

            <Space direction={"vertical"} size={12} style={{width:"100%"}}>
                {getTimeProgress()}
                {getIncompleteTasksText()}
                {getFailureRisk()}
                <Avatar.Group>
                    {devAvatars}
                </Avatar.Group>
            </Space>
        </Card>
    )
}