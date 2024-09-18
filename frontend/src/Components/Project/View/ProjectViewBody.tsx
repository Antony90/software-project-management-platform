import {Project} from "../../../Models/DatabaseObjects/Project";
import {RiskOverview} from "../../Risk/RiskOverview";
import {GanttChart} from "../../Utils/GanttChart";
import {Badge, Divider, Modal, Switch, Tabs, Tooltip, Typography} from "antd";
import React, {useEffect, useState} from "react";
import {Credentials} from "../../../Models/Credentials";
import {Task} from "../../../Models/DatabaseObjects/Task";
import {TaskView} from "../../Task/TaskView";
import {TaskListView} from "../../Task/TaskListView";
import {useCurrentOrganisationDevelopers} from "../../../Models/DatabaseObjects/Organisation";
import {User} from "../../../Models/DatabaseObjects/User";
import {SchedulableEventType, usePendingEvents} from "../../../Services/SessionServices/SchedulerService";
import {DeveloperFeedback, FeedbackScheduler} from "../../DeveloperFeeback/DeveloperFeedback";
import {DeveloperFeedbackItemParams, DeveloperFeedbackItemsParams} from "../../DeveloperFeeback/DeveloperFeedbackItem";
import {useCurrentUser} from "../../../Services/SessionServices/Session";
import {MoodOverview} from "../../Mood/MoodOverview";
import {
    HourglassOutlined,
    ProjectFilled,
    SecurityScanFilled,
    SmileOutlined,
    UnorderedListOutlined
} from '@ant-design/icons'
import {ProjectRiskItemCarousel} from "./ProjectRiskItemCarousel";
import {useForceUpdate} from "../../Utils/UpdateComponent";
import {ProjectSaver} from "../../../Models/DatabaseObjectSavers/ProjectSaver";

const {Title, Text} = Typography


export function ProjectViewBody({project, ProjectSaver, onRefresh}: {project:Project, ProjectSaver:ProjectSaver, onRefresh:()=>void}){

    const organisationDevs = useCurrentOrganisationDevelopers()

    const pendingFeedbacks = usePendingEvents(SchedulableEventType.DEVELOPER_FEEDBACK_EVENT, (e)=>{
        return e.extras.project == project.getID()
    })

    const refresh = useForceUpdate()

    const [actualTimeFrames, setActualTimeFrames] = useState(false)


    const user = useCurrentUser()

    useEffect(()=>{
        if(project != null){
            refresh()
        }
    }, [project, project.tasks])

    const onFeedbackComplete = (feedbackIndex : number)=>{
        pendingFeedbacks[feedbackIndex].handle()
        FeedbackScheduler.scheduleMoodFeeback(project.getID(), user.getID())
        setFeedbackModalOpen(false)
    }


    useEffect(()=>{
        let feedbackItems : DeveloperFeedbackItemParams[] = pendingFeedbacks.map(()=>{
            return DeveloperFeedbackItemsParams.MOOD_SLIDER
        })
        setFeedbackModalContents(<DeveloperFeedback onSubmit={onFeedbackComplete} projectID={project.getID()} items={feedbackItems} />)
    }, [pendingFeedbacks])









    const _setTaskVisible = (t:string)=>{
        let task = project.tasks.find((value)=>{return value.name == t})
        setTaskVisible(task)
    }


    const setTaskVisible = (t:Task)=>{
        setTaskModalContents(<TaskView key={Credentials.UUID()} task={t} project={project}/>)
        setTaskModalOpen(true)
    }

    const [taskModalOpen, setTaskModalOpen] = useState(false)
    const [taskModalContents, setTaskModalContents] = useState(<></>)

    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false)
    const [feedbackModalContents, setFeedbackModalContents] = useState(<></>)







    const getDevs = ()=>{
        if(organisationDevs == null) return []
        else{
            let devs : User[] = []
            project.developers.forEach((dev)=>{
                devs.push(organisationDevs.find((v)=>{return v.getID() == dev.getID()}))
            })
            return devs

        }
    }



    const toggleActualTimeFrames = (newVal:boolean)=>{
        setActualTimeFrames(newVal)
    }

    const showDevelopFeedbacks = ()=>{
        setFeedbackModalOpen(true)
    }

    if(user == null) return <></>

    let tabItems : {icon: React.ReactNode, label : string, contents : JSX.Element}[] = []
    let RISK_OVERVIEW = {icon: <SecurityScanFilled />, label:"Risk Overview", contents:(
        <div style={{display:"flex", flexDirection:"column", justifyContent:"center", gap:16, width:"100%", marginBottom:"10px"}}>
            <RiskOverview onRefresh={onRefresh} riskBreakdown={project.breakdown}/>
            <Divider/>
            <ProjectRiskItemCarousel project={project} setTaskVisible={_setTaskVisible}/>
        </div>
    )}

    let MOOD_GRAPH = {icon: <SmileOutlined />,label:"Developer Mood", contents:(<MoodOverview projectMood={project.mood}
                                                                                              developers={organisationDevs == null ? [] : project.developers.map(pD=>organisationDevs.find(oD=>oD.getID()==pD.getID()))}
                                                                                              projectManagerID={project.projectManager.getID()}/>)}
    let ROADMAP = {icon: <ProjectFilled />,
        label:"Roadmap", contents:(
            <div style={{display:"flex", flexDirection:"column", alignItems:"center", gap:16}}>
                <div style={{width:"100%", overflowX:"auto"}}><GanttChart actualIfPossible={actualTimeFrames} title="Roadmap" tasks={project.tasks} pxPerDay={10} onClickTask={setTaskVisible}/></div>
                {project.hasAnyActualTimes() &&
                    <Switch style={{width:"min-content"}} checked={actualTimeFrames} onClick={toggleActualTimeFrames} checkedChildren="Actual" unCheckedChildren="Estimated"/>}
            </div>)}
    let TASKS = {icon: <UnorderedListOutlined />,label:"Tasks", contents:(<TaskListView key={Credentials.UUID()} topLevel project={project} isPM={project.isProjectManager(user)} projectStartDate={project.startDate} hasAdd={project.isProjectManager(user)} currentTasks={project.tasks} projectDevelopers={getDevs()}
                                                        onAddTask={(t)=>ProjectSaver.addTask(t).then(()=>refresh())} onRemoveTask={(t)=>ProjectSaver.removeTask(t).then(()=>refresh())}/>)}
    let NOT_MUCH_TO_DO = {icon: <HourglassOutlined />, label:"Overview", contents:(<div><Text>Looks like this project doesn't have any tasks, ask you project manager to kick things off</Text></div>)}

    if(project.isProjectManager(user)){
        tabItems.push(RISK_OVERVIEW)
        if(project.tasks.length != 0) tabItems.push(ROADMAP)
        tabItems.push(TASKS)
        if(Object.keys(project.mood).length != 0) tabItems.push(MOOD_GRAPH)
    }
    else{
        if(project.tasks.length != 0){
            tabItems.push(ROADMAP)
            tabItems.push(TASKS)
        }
        else tabItems.push(NOT_MUCH_TO_DO)
    }


    return(
        <div style={{width:"100%", overflow:"auto"}}>
            <div style={{width:"70%", paddingLeft:30, display:"flex", flexDirection:"column", gap:10, overflow:"hidden"}}>
                <div style={{display:"flex", justifyContent:"flex-start", width:"100%"}}>
                    <Title style={{fontWeight:"bolder", marginTop:"0px", direction:"ltr"}}>{project.name}</Title>
                    <a onClick={showDevelopFeedbacks} style={{lineHeight:"20px"}}>
                        <Tooltip placement={"right"} title={"Uncompleted Feedback Items"}>
                            <Badge count={pendingFeedbacks.length} style={{marginRight:"auto"}}/>
                        </Tooltip>
                    </a>
                </div>
                <Tabs
                    defaultActiveKey="1"
                    size={"large"}
                    items={tabItems.map((tabItem, i) => {
                        return {
                            label: <span>{tabItem.icon} {tabItem.label}</span>,
                            key: Credentials.UUID(),
                            children: tabItem.contents
                        };
                    })}
                />

            </div>



            <Modal
                title="Give Feedback"

                open={feedbackModalOpen}
                okButtonProps={{ style: {display:"none"} }}
                onCancel={()=>setFeedbackModalOpen(false)}
                width={"90vw"}
                style={{width:"90vw", minHeight: "90vh", position: "absolute", left: "5vw", top: "5vh"}}>
                {feedbackModalContents}
            </Modal>

            <Modal
                title={null}

                open={taskModalOpen}
                okButtonProps={{ style: {display:"none"} }}
                onCancel={()=>{
                    refresh()
                    setTaskModalOpen(false)
                }}
                width={"90vw"}
                style={{width:"90vw", height: "90vh", position: "absolute", left: "5vw", top: "5vh"}}>
                {taskModalContents}
            </Modal>

        </div>
    )
}