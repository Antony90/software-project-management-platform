import {Button, message, Modal, Space, Tabs, Tooltip, Typography} from "antd";
import React, {useEffect, useState} from "react";
import {Task} from "../../Models/DatabaseObjects/Task";
import {TaskCard} from "./TaskCard";
import {MinusCircleOutlined} from '@ant-design/icons';
import {TaskEditView} from "./TaskEditView";
import {User} from "../../Models/DatabaseObjects/User";
import {Credentials} from "../../Models/Credentials";
import {TopLevelTask} from "../../Models/DatabaseObjects/TopLevelTask";
import {TaskView} from "./TaskView";
import {Project} from "../../Models/DatabaseObjects/Project";
import {useForceUpdate} from "../Utils/UpdateComponent";
import {RequestFailureException} from "../../API/RequestFailureException";

const {Title} = Typography



export function TaskListView(
    {projectStartDate,
        currentTasks,
        topLevel = false,
    projectDevelopers,
    onAddTask = ()=>Promise.resolve(),
    onRemoveTask = ()=>Promise.resolve(),
    onChangeTask= ()=>Promise.resolve(),
    projectCreation=false,
    hasAdd=true,
    isPM = true,
    project = null}
    :
    {currentTasks : Task[],
        projectStartDate : Date
    projectDevelopers : User[],
    onAddTask?:(t : Task)=>Promise<any>,
    onRemoveTask?:(t:Task)=>Promise<any>,
    onChangeTask? : (t:Task)=>Promise<any>,
    projectCreation?:boolean,
    hasAdd?:boolean,
    isPM?:boolean,
    topLevel?:boolean,
    project?:Project}
){


    const [taskCardsAll, setTaskCardsAll] = useState<JSX.Element[]>([])
    const [taskCardsNotStarted, setTaskCardsNotStarted] = useState<JSX.Element[]>([])
    const [taskCardsInProgress, setTaskCardsInProgress] = useState<JSX.Element[]>([])
    const [taskCardsComplete, setTaskCardsComplete] = useState<JSX.Element[]>([])


    const [modalOpen, setModelOpen] = useState(false)

    const [taskModalContents, setTaskModalContents] = useState(<></>)

    const [modalTitle, setModalTitle] = useState("")

    const refresh = useForceUpdate()


    const addTask = (t : Task)=>{
        onAddTask(t).then(()=>{
            message.success("Task Added")
            refresh()
            setModelOpen(false)
        })
            .catch((e : RequestFailureException)=>{
                let responseMessage = ""
                if(e.errorCode == 400) responseMessage = e.responseMessage
                message.error(`Task add failed - ${responseMessage}`)
            })
    }

    const changeTask = (newTask : TopLevelTask)=>{
        onChangeTask(newTask).then(()=>{
            refresh()
            setModelOpen(false)
            message.success("Task Updated")
        })
            .catch(()=>{
                message.error("Task Change failed")
            })
    }

    const removeTask = (removeTask : Task)=>{
        onRemoveTask(removeTask).then(()=>{
            refresh()
            message.success("Task removed")
        })
            .catch(()=>{
                message.error("Task remove failed")
            })

    }


    const newTask = ()=>{
        setModalTitle("Create Task")
        setTaskModalContents(<TaskEditView topLevel={topLevel} currentTasks={topLevel?currentTasks as TopLevelTask[]:[]} projectStartDate={projectStartDate} key={Credentials.UUID()} onTaskEditComplete={addTask} possibleDevelopers={projectDevelopers} projectID={project?.getID()}/>)
        setModelOpen(true)
    }

    const onTaskCardClicked = (t : TopLevelTask)=>{
        if(projectCreation){
            setModalTitle("Edit Task")
            setTaskModalContents(<TaskEditView topLevel={topLevel} currentTasks={topLevel?currentTasks as TopLevelTask[]:[]} projectStartDate={projectStartDate} key={Credentials.UUID()} onTaskEditComplete={(newT:TopLevelTask)=>{changeTask(newT)}} possibleDevelopers={projectDevelopers} current={t} projectID={project?.getID()}/>)
        }
        else {
            setModalTitle(null)
            setTaskModalContents(<TaskView task={t} project={project}/>)
        }
        setModelOpen(true)
    }


    const getTaskList = (tasks : Task[])=>{
        let notStartedTaskCards : JSX.Element[] = []
        let inProgressTaskCards : JSX.Element[] = []
        let completeTaskCards : JSX.Element[] = []
        let allTaskCards: JSX.Element[] = []

        Project.tasksNameSorted(tasks).forEach((t : TopLevelTask)=>{
            let minus = <></>
            if(isPM) minus =(<Tooltip title={"Remove Task"}>
                <MinusCircleOutlined style={{ fontSize: '20px', color: 'black' }} onClick={() => removeTask(t)} />
            </Tooltip>)

            let card = <div key={t.name} style={{display:"flex", width:"100%", alignItems:"center"}}>
                <TaskCard key={t.name} task={t} onClick={()=>onTaskCardClicked(t)}></TaskCard>
                {!t.isStarted() && !t.isComplete() &&
                    minus}
            </div>

            if(t.isComplete()){
                completeTaskCards.push(card)
            }
            else if(t.isStarted()){
                inProgressTaskCards.push(card)
            }
            else{
                notStartedTaskCards.push(card)
            }
            allTaskCards.push(card)
        })

        if(allTaskCards.length == 0) setTaskCardsAll([<Title level={3}>No tasks have been created yet...</Title>])
        else setTaskCardsAll(allTaskCards)

        if(notStartedTaskCards.length == 0) setTaskCardsNotStarted([<Title level={3}>No tasks haven't been started...</Title>])
        else setTaskCardsNotStarted(notStartedTaskCards)

        if(inProgressTaskCards.length == 0) setTaskCardsInProgress([<Title level={3}>No tasks are currently in progress...</Title>])
        else setTaskCardsInProgress(inProgressTaskCards)


        if(completeTaskCards.length == 0) setTaskCardsComplete([<Title level={3}>No tasks have been completed yet...</Title>])
        else setTaskCardsComplete(completeTaskCards)
    }


    useEffect(()=>{
        getTaskList(project==null?currentTasks:project.tasks)
    }, [currentTasks])


    let addButton = <></>
    if(hasAdd) addButton = <Button key={Credentials.UUID()} style={{width:"80%", height:"50px"}} type="dashed" onClick={() => newTask()}>Add task</Button>


    let tabs = [
        {name:"All", contents:(<Space key={Credentials.UUID()} direction="vertical" style={{width:"100%"}}>
            {taskCardsAll}
            {addButton}
        </Space>)},
        {name:"Not Started", contents:(<Space key={Credentials.UUID()} direction="vertical" style={{width:"100%"}}>
            {taskCardsNotStarted}
        </Space>)},
        {name:"In Progress", contents:(<Space key={Credentials.UUID()} direction="vertical" style={{width:"100%"}}>
            {taskCardsInProgress}
        </Space>)},
        {name:"Complete", contents:(<Space key={Credentials.UUID()} direction="vertical" style={{width:"100%"}}>
            {taskCardsComplete}
        </Space>)}

    ]


    return(

        <div key={Credentials.UUID()}>

            {project == null &&
                (<Space key={Credentials.UUID()} direction="vertical" style={{width:"100%"}}>
                    {taskCardsAll}
                    {addButton}
                </Space>)}
            {project != null &&
                <Tabs key={Credentials.UUID()}
                    tabPosition={"left"}
                    items={tabs.map((t, i) => {
                        return {
                            label: t.name,
                            key: Credentials.UUID(),
                            children: t.contents
                        };
                    })}
                />
            }



        <Modal
            title={modalTitle}

            open={modalOpen}
            okButtonProps={{ style: {display:"none"} }}
            onCancel={()=>{
                setModelOpen(false)
                getTaskList(project==null?currentTasks:project.tasks)
            }}
            width={"90vw"}
            style={{width:"90vw", height:"90vh", position: "absolute", left: "5vw", top: "5vh"}}>
            {taskModalContents}
        </Modal>
        </div>
    )

}