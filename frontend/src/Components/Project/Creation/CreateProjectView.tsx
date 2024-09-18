import React, {useEffect, useState} from "react";
import {Button, Form, message, Space, Spin, Steps} from "antd";
import {Session, useCurrentUser} from "../../../Services/SessionServices/Session";
import {Project} from "../../../Models/DatabaseObjects/Project";
import {CreateProjectDetailsPageFormItems, ProjectDetailsForm} from "./ProjectDetailsForm";
import {DeveloperData, ProjectDevelopersForm} from "./ProjectDevelopersForm";
import {useCurrentOrganisationDevelopers} from "../../../Models/DatabaseObjects/Organisation";
import {FileTextFilled, TeamOutlined, UnorderedListOutlined} from '@ant-design/icons'
import {User} from "../../../Models/DatabaseObjects/User";
import {TopLevelTask} from "../../../Models/DatabaseObjects/TopLevelTask";
import {TaskListView} from "../../Task/TaskListView";
import {useNavigate} from "react-router-dom";
import {NavRoute} from "../../../Services/NavigationServices/NavRoutes";
import {Task} from "../../../Models/DatabaseObjects/Task";

export function CreateProjectView(){

    

    const [loading, setLoading] = useState(false)

    const currentUser = useCurrentUser()

    const navigate = useNavigate()

    const [developerData, setDeveloperData] = useState<DeveloperData[]>([])
    const [selectedDevelopers, setSelectedDevelopers] = useState<string[]>([])
    const organisationDevelopers = useCurrentOrganisationDevelopers(setLoading)
    const [pageNumber, setPageNumber] = useState(1)

    const [formPage1] = Form.useForm();

    const [tasks, setTasks] = useState<TopLevelTask[]>([])


    useEffect(()=>{
        if(organisationDevelopers != null){
            let data : DeveloperData[] = []
            organisationDevelopers.forEach((dev : User)=>{
                if(dev.getID() != currentUser.getID()){
                    data.push( {
                        key:dev.getID(),
                        title:dev.getFullName(),
                        chosen:false
                    } as DeveloperData)
                }
            })
            setDeveloperData(data)
        }
    }, [organisationDevelopers])


    const toDays = (secs : number)=>{
        return secs / (60*60*24*1000)
    }

    const onProjectCreateClicked = ()=>{


        setLoading(true)

        let [startDate, endDate] = formPage1.getFieldValue(CreateProjectDetailsPageFormItems.DATES)

        let project = new Project(
            formPage1.getFieldValue(CreateProjectDetailsPageFormItems.NAME),
            new Date(),
            formPage1.getFieldValue(CreateProjectDetailsPageFormItems.BUDGET),
            toDays(endDate - startDate),
            startDate,
            null,
            currentUser,
            tasks,
            [...selectedDevelopers],
            null
        )

        project.tasks = project.getTaskDependencyList().map((dt)=>project.tasks.find((pt)=>dt==pt.getID()))

        Session.projectService.create(project)
        .then((p : Project)=>{
            message.success("Project Created")
            navigate(NavRoute.PROJECT + "/" + p.getID())
        })
        .catch(()=>{message.error("Project Creation Failed")})
        .finally(()=>setLoading(false))
    }

    const getDevs = ()=>{
        let devs : User[] = []
        selectedDevelopers.forEach((dev)=>{
            devs.push(organisationDevelopers.find((u : User)=>{return u.getID() == dev}))
        })
        devs.push(currentUser)
        return devs
    }


    const getProjectStartDate = ()=>{
        let currentDate = formPage1.getFieldValue(CreateProjectDetailsPageFormItems.DATES)
        if(currentDate == null) return new Date()
        return currentDate[0].toDate()

    }

    const addTask = (t : TopLevelTask)=>{
        setTasks([...tasks, t])
        return Promise.resolve()
    }

    const changeTask = (newTask : Task)=>{
        if(newTask instanceof TopLevelTask) {
            let index = tasks.findIndex((t: Task) => t.getID() == newTask.getID())
            tasks.splice(index, 1, newTask)
            setTasks([...tasks])
            return Promise.resolve()
        }
    }

    const removeTask = (removeTask : Task)=>{
        let newTasks = [...tasks]
        let index = newTasks.findIndex((t : Task)=>t.getID()==removeTask.getID())
        if (index > -1){
            newTasks.splice(index, 1)
            setTasks(newTasks)
        }
        return Promise.resolve()
    }

    const pages = [
        <ProjectDetailsForm formModel={formPage1}/>,
        <ProjectDevelopersForm data={developerData} selected={selectedDevelopers} setSelected={setSelectedDevelopers}/>,
        <TaskListView onAddTask={addTask} onRemoveTask={removeTask} onChangeTask={(t)=>changeTask(t)} projectCreation topLevel projectStartDate={getProjectStartDate()} currentTasks={tasks} projectDevelopers={getDevs()}/>
    ]


    const validateCurrentPage = (onValid : ()=>void)=>{
        if(pageNumber == 1){
            formPage1.validateFields()
            .then(()=>onValid())
            .catch()
        }
        else{
            onValid()
        }
    }


    const onChange = (value: number, currentPage : number = pageNumber) => {
        validateCurrentPage(()=>{
            if(value + 1 > currentPage) {
                setPageNumber(currentPage + 1)
                onChange(value, currentPage + 1)
            }
            else{
                setPageNumber(value + 1)
            }

        })
    };

    const onNextPage = ()=>{
        validateCurrentPage(()=>setPageNumber(pageNumber + 1))
    }

    const onPreviousPage = ()=>{
        setPageNumber(pageNumber - 1)
    }

    const getPrevVisibility = ()=>{
        if(pageNumber > 1) return "block"
        else return "none"
    }

    const getNextVisibility = ()=>{
        if(pageNumber < pages.length) return "block"
        else return "none"
    }

    const getCreateVisibility = ()=>{
        if(pageNumber == pages.length) return "block"
        else return "none"
    }

    return (
        <Spin spinning={loading} style={{display:"flex", justifyContent:"center"}}>
            <Space direction="vertical" style={{width:"80%"}}>
                <Steps
                    current={pageNumber - 1}
                    onChange={onChange}
                    items={[
                        {title: 'Details', description:"Enter some basic info about your project", icon: <FileTextFilled />},
                        {title: 'Add Developers', description:"Add your development team", icon: <TeamOutlined />},
                        {title: 'Add Tasks', description:"Get started with some tasks", icon: <UnorderedListOutlined/>},
                    ]}
                />
            {pages[pageNumber - 1]}
            <Space direction="horizontal">
                <Button onClick={onPreviousPage} style={{display:getPrevVisibility()}}>Previous</Button>
                <Button onClick={onNextPage} style={{display:getNextVisibility()}}>Next</Button>
                <Button onClick={onProjectCreateClicked} style = {{display:getCreateVisibility()}}>Create</Button>
            </Space>
            </Space>

        </Spin>
    )
}