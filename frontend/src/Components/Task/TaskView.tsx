import {
    Button,
    Divider,
    Form,
    Input,
    message,
    Popover,
    Progress,
    Skeleton,
    Space,
    Table,
    Tooltip,
    Typography
} from "antd";
import React, {useState} from "react";
import {Task} from "../../Models/DatabaseObjects/Task";

import {useCurrentUser} from "../../Services/SessionServices/Session";
import {TopLevelTask} from "../../Models/DatabaseObjects/TopLevelTask";
import {ColouredTag} from "../Utils/ColouredTag";
import {useCurrentOrganisationDevelopers} from "../../Models/DatabaseObjects/Organisation";
import {FormValidationService} from "../../Services/Utils/FormValidationService";
import {useForceUpdate} from "../Utils/UpdateComponent";
import {DeveloperSelect} from "../Utils/DeveloperSelect";
import {Project} from "../../Models/DatabaseObjects/Project";
import {MultiTagSelect} from "../Utils/MultiTagSelect";
import possibleSkills from "common/build-models/Skills";
import {MoreInfoHoverable} from "../Utils/MoreInfoHoverable";
import {Credentials} from "../../Models/Credentials";
import {EditOutlined, EyeOutlined} from "@ant-design/icons"
import {RequestFailureException} from "../../API/RequestFailureException";
import {TaskSaver} from "../../Models/DatabaseObjectSavers/TaskSaver";

const {Text, Paragraph, Title} = Typography

export function TaskView({task, project} : {task : Task, project:Project}){

    const topLevelTask = task as TopLevelTask

    const taskSaver = task instanceof TopLevelTask? new TaskSaver(task) : null

    const [loading, setLoading] = useState(false)

    const organisationDevelopers = useCurrentOrganisationDevelopers(setLoading)

    const refresh = useForceUpdate()

    const currentUser = useCurrentUser(setLoading)

    const [form] = Form.useForm()


    const onDeveloperChange = (newDevelopers : any)=>{
        taskSaver.saveDevelopers(newDevelopers.developers)
            .then(()=>{
                refresh()
                message.success("Developers Updated")
            })
            .catch(()=>{
                refresh()
                message.error("Developer UpdateFailed")
            })
    }


    const estimatedBudgetFormatter = async (optimistic:string, mostLikely:string, pessimistic:string)=>{

        let op = await FormValidationService.isNumberValidator(optimistic)
        let ml = await FormValidationService.isNumberValidator(mostLikely)
        let ps = await FormValidationService.isNumberValidator(pessimistic)

        return {optimistic:op, mostLikely:ml, pessimistic:ps}

    }
    const onEstimatedDurationsChange = (optimistic:string, mostLikely:string, pessimistic:string)=>{
        estimatedBudgetFormatter(optimistic, mostLikely, pessimistic)
            .then((vals)=>{
                if(vals.optimistic != topLevelTask.optimistic || vals.mostLikely != topLevelTask.mostLikely || vals.pessimistic != topLevelTask.pessimistic) {

                    taskSaver.setDurations(vals.optimistic, vals.mostLikely, vals.pessimistic)
                        .then(() => {
                            refresh()
                            message.success("Durations changed")
                        })
                        .catch((e:RequestFailureException) => {
                            refresh()
                            message.error(`Duration change failed - ${e.responseMessage.replaceAll("most likely", "expected")}`)
                        })
                }
            })
            .catch(()=>{
                message.error("Invalid number format")
                refresh()
            })

    }
    const onEstimatedDevelopersChange = (newEstimatedDevelopers : string)=>{
        FormValidationService.isNumberValidator(newEstimatedDevelopers)
            .then((newDevs)=>{
                if(newDevs != topLevelTask.expectedNumDevelopers) {
                    taskSaver.saveNumDevelopers(newDevs)
                        .then(()=>{
                            refresh()
                            message.success("Estimated Developers Changed")
                        })
                        .catch(()=>{
                            refresh()
                            message.error("Estimated Developer Change Failed")
                        })
                }
            }, ()=>{
                message.error("Invalid number format")
                refresh()
            })
    }

    const onSkillsChange = (newSkills : any)=>{
        taskSaver.saveSkills(newSkills.skills)
            .then(()=>{
                refresh()
                message.success("Skills changed")
            })
            .catch(()=>{
                refresh()
                message.error("Skill change failed")
            })
    }

    const onAddCostItem = (values : any)=>{
        taskSaver.addCostItem({name:values.name, cost:Number.parseFloat(values.cost)})
            .then(()=>{
                refresh()
                form.resetFields()
                message.success("Cost Item Added")
            })
            .catch(()=>{
                refresh()
                message.error("Failed to add Cost Item")
            })
    }


    const onTaskNameChange = (newName : string) =>{
        if(newName != task.name)
            taskSaver.renameTask(newName)
                .then(()=>{
                    refresh()
                    message.success("Task Renamed")
                })
                .catch(()=>{
                    refresh()
                    message.error("Rename Failed")
                })
    }

    const costItemTablePageSize = 3
    const getCostItemData = ()=>{
        let data = topLevelTask.costs.map((c)=>{
            return {key:c.name, name:c.name, cost:"£" + c.cost.toString()}
        })
        let length = data.length
        for(let i = 0; i < costItemTablePageSize - (length % costItemTablePageSize); i++){
            data.push({key:Credentials.UUID(), name:"-", cost:"-"})
        }
        return data
    }

    const getCostItemColumns= ()=>{
        return [
            {
                title: 'Name',
                dataIndex: 'name',
                key: 'name',
            },
            {
                title: 'Cost',
                dataIndex: 'cost',
                key: 'cost',
            },
            ]
    }


    const onEditCancel = ()=>{
        refresh()
    }




    const start = ()=>{
        taskSaver.start()
            .then(()=>{
                refresh()
                message.success("Task Started")
            })
            .catch((e : RequestFailureException)=>{
                let m = ""
                if(e.errorCode == 400) m=` - ${e.responseMessage}`
                refresh()
                message.error("Task Start Failed" + m)
            })
    }
    const finish = ()=>{
        taskSaver.complete()
            .then(()=>{
                refresh()
                message.success("Task Finished")
            })
            .catch((e:RequestFailureException)=>{
                let m = ""
                if(e.errorCode == 400) m=` - ${e.responseMessage}`
                refresh()
                message.error("Task Finish Failed" + m)
            })
    }

    const getBudgetStatus = ()=>{
        if(topLevelTask.isComplete() && topLevelTask.getPercentageBudgetUsed() <= 100) return "success"
        if(topLevelTask.getPercentageBudgetUsed() > 100) return "exception"
        return "active"
    }


    const CompletionTag = ()=>{
        let status = topLevelTask.getCompletionStatus()
        let statusTag = <ColouredTag value={status.name} colour={status.colour}/>
        if(topLevelTask.isComplete()){
            return statusTag
        }
        else if(topLevelTask.isStarted()){
            return <Tooltip title={"Complete Task?"}><div onClick={finish} style={{cursor:"pointer"}}>
            {statusTag}
                <EditOutlined style={{marginLeft:5}} />
                </div></Tooltip>
            }
        else{
                return <Tooltip title={"Start Task?"}><div onClick={start} style={{cursor:"pointer"}}>
            {statusTag}
                <EditOutlined style={{marginLeft:5}} />
                </div></Tooltip>
            }
    }


    const getDependencies = ()=>{
        let deps : TopLevelTask[] = []
        topLevelTask.dependencies.forEach((d)=>{
            let task = project.tasks.find((t)=>{return t.getID() == d})
            deps.push(
                task
            )
        })
        deps.sort((d1, d2)=>{
            if(d1.getCompletionStatus().name == d2.getCompletionStatus().name) return d1.name.localeCompare(d2.name)
            return d1.getCompletionStatus().completionProgressNumber - d2.getCompletionStatus().completionProgressNumber
        })

        const getDisplayColour = (task:TopLevelTask)=>{
            return task.getCompletionStatus().colour.foreground == "#FFFFFF" ? task.getCompletionStatus().colour.background : task.getCompletionStatus().colour.foreground
        }

        return <div style={{display:"flex", flexDirection:"column", gap:4}}>{deps.map((task)=><Text style={{color:getDisplayColour(task)}}>- {task.name} ({task.getCompletionStatus().name})</Text>)}</div>
    }

    const getDependentOn = ()=>{
        let dependent = project.getDependentTasks(topLevelTask)
        return <div style={{display:"flex", flexDirection:"column", gap:4}}>{dependent.map((d)=><Text>- {d.name}</Text>)}</div>
    }


    const topLevel = task instanceof TopLevelTask

    if(currentUser == null || organisationDevelopers == null) return <></>

    const isPM = project.isProjectManager(currentUser)

    return(
        <Skeleton active loading={loading} paragraph={{rows:20}}>
            <div style={{display:"flex", flexDirection:"column"}}>
                <div style={{display:"flex", gap:"8px", flexDirection:"row", alignItems:"start" , width:"95%"}}>
                    <Title
                        level={3}
                        style={{margin:0}}
                        editable={topLevel && isPM?{
                            text:task.name,
                            tooltip: 'Edit Name',
                            onChange: onTaskNameChange,
                            onCancel:onEditCancel,
                            triggerType: ["icon", "text"]} : false}>
                        {task.name}
                    </Title>

                    <div style={{marginLeft:32, gap:16, display:"flex"}}>
                        {topLevelTask.dependencies.length > 0 &&
                        <Popover content={getDependencies()} title="You can't start this task until you have completed:" trigger="hover">
                            <Button type={"ghost"} icon={<EyeOutlined/>}>Earlier Tasks Required ({topLevelTask.dependencies.length})</Button>
                        </Popover>}
                        {project.getDependentTasks(topLevelTask).length > 0 &&
                        <Popover content={getDependentOn()} title="After you have completed this task, you can start:" trigger="hover">
                            <Button type={"ghost"} icon={<EyeOutlined/>}>Later Tasks Requiring ({project.getDependentTasks(topLevelTask).length})</Button>
                        </Popover>}
                    </div>

                </div>
                <Divider/>
                <div style={{display:"flex", alignItems:"flex-start", gap:"64px"}}>
                    {topLevel &&
                    <div style={{display:"flex", flexDirection:"column", gap:24, width:"15%", height:"100%", alignItems:"center"}}>





                        {project.startDate < new Date() &&
                            <div style={{display:"flex", flexDirection:"column", gap:24, width:"100%", height:"100%", alignItems:"center"}}>
                                {topLevel&&
                                    <Text>Task Status</Text>}
                                {topLevel&&
                                    <CompletionTag/>}
                            </div>
                        }

                        {project.startDate >= new Date() &&
                            <MoreInfoHoverable info={"Start the project to begin working on tasks"}>Project Not Yet Started</MoreInfoHoverable>
                        }

                        <Divider/>

                        <Text>Budget Usage</Text>
                        <Tooltip title={
                            <div style={{display:"flex", flexDirection:"column"}}>
                                <Text style={{ color:"lightgrey"}}>Estimated Cost: £{topLevelTask.estimatedCost}</Text>
                                <Text  style={{ color:"lightgrey"}}>Current Cost: £{topLevelTask.getTotalCost()}</Text>
                                <Text  style={{ color:"lightgrey"}}>Budget left: £{topLevelTask.estimatedCost - topLevelTask.getTotalCost()}</Text>
                            </div>
                        }><Progress type="circle" percent={topLevelTask.getPercentageBudgetUsed()} status={getBudgetStatus()} format={(percent) => `${percent}%`}/></Tooltip>


                    </div>
                }
                    <div style={{display:"flex", flexDirection:"column", gap:8, width:"25%"}}>
                        <Form
                            onValuesChange={onDeveloperChange}
                            initialValues={{developers:task.developers.map(d=>d.getID())}}
                            style={{width:"100%", margin:0}}
                            layout="vertical">
                            <Form.Item label={"Developers:"} name="developers">
                                <DeveloperSelect
                                    possibleDevelopers={isPM?project.developers.map((pd)=>organisationDevelopers.find((od)=>pd.getID()==od.getID())):[currentUser]}
                                    placeholder={"Assigned Developers"}/>
                            </Form.Item>
                        </Form>

                        {topLevel&&
                            <Form
                                onValuesChange={onSkillsChange}
                                initialValues={{skills:topLevelTask.requiredSkills}}
                                style={{width:"100%", margin:0}}
                                layout="vertical">
                                <Form.Item label={"Required Skills:"} name="skills">
                                    <MultiTagSelect
                                        disabled={!isPM}
                                        key="ReqSkills"
                                        placeholder="Required Skills"
                                        data={possibleSkills}
                                        labelify={(s)=>{return {label:s, value:s}}} />
                                </Form.Item>
                            </Form>
                        }
                    {topLevel&&
                        <div style={{display:"flex", gap:"8px", flexDirection:"column", alignItems:"start", paddingBottom: '10px' }}>
                            <MoreInfoHoverable info={"Number of developers needed to finish this task"}>Developers Required</MoreInfoHoverable>
                            <Paragraph
                                editable={isPM?{
                                    text:topLevelTask.expectedNumDevelopers.toString(),
                                    tooltip: 'Edit budget',
                                    onChange: onEstimatedDevelopersChange,
                                    onCancel:onEditCancel,
                                    triggerType: ["icon", "text"]} : false}>
                                {topLevelTask.expectedNumDevelopers}
                            </Paragraph>
                        </div>}


                    <Text underline style={{fontSize:15}}>Days To Complete</Text>
                    <Space align={"start"} size={30} direction={"horizontal"}>
                        <div style={{display:"flex", flexDirection:"column", gap:8}}>
                            <MoreInfoHoverable info={"How long this task would take in the best case"}>Optimistic</MoreInfoHoverable>
                            <Paragraph
                                editable={isPM?{
                                    text:topLevelTask.optimistic.toString(),
                                    tooltip: 'Edit',
                                    onChange: (val)=>onEstimatedDurationsChange(val, task.mostLikely.toString(), task.pessimistic.toString()),
                                    onCancel:onEditCancel,
                                    triggerType: ["icon", "text"]} : false}>
                                {topLevelTask.optimistic}
                            </Paragraph>
                        </div>

                        <div style={{display:"flex", flexDirection:"column", gap:8}}>
                            <MoreInfoHoverable info={"How long this task would most likely take"}>Expected</MoreInfoHoverable>
                            <Paragraph
                                editable={isPM?{
                                    text:topLevelTask.mostLikely.toString(),
                                    tooltip: 'Edit',
                                    onChange: (val)=>onEstimatedDurationsChange(task.optimistic.toString(), val, task.pessimistic.toString()),
                                    onCancel:onEditCancel,
                                    triggerType: ["icon", "text"]} : false}>
                                {topLevelTask.mostLikely}
                            </Paragraph>
                        </div>

                        <div style={{display:"flex", flexDirection:"column", gap:8}}>
                            <MoreInfoHoverable info={"How long this task would take in the worst case"}>Pessimistic</MoreInfoHoverable>
                            <Paragraph
                                editable={isPM?{
                                    text:topLevelTask.pessimistic.toString(),
                                    tooltip: 'Edit',
                                    onChange: (val)=>onEstimatedDurationsChange(task.optimistic.toString(), task.mostLikely.toString(), val),
                                    onCancel:onEditCancel,
                                    triggerType: ["icon", "text"]} : false}>
                                {topLevelTask.pessimistic}
                            </Paragraph>
                        </div>
                    </Space>
                    </div>

                    {topLevel &&
                        <div style={{display:"flex", flexDirection:"column", height:"100%", overflow:"auto", width:"40%"}}>
                            <Text underline style={{marginBottom:5}}>Cost Items</Text>
                            {topLevelTask.costs.length > 0 &&
                            <Table dataSource={getCostItemData()} columns={getCostItemColumns()} pagination={{pageSize:costItemTablePageSize}}/>}
                            <Form form={form}
                                  layout={"horizontal"}
                                  onFinish={onAddCostItem}>
                                <div style={{display:"flex", gap:10}}>
                                <Form.Item
                                    label="Name"
                                    name="name"
                                    rules={[FormValidationService.CANNOT_BE_BLANK]}>
                                    <Input placeholder="Name"/>
                                </Form.Item>
                                <Form.Item
                                    label="Cost"
                                    name="cost"
                                    rules={[FormValidationService.CANNOT_BE_BLANK, FormValidationService.COST_FORMAT]}>
                                    <Input addonBefore={"£"} placeholder="Cost"/>
                                </Form.Item>
                                    <Form.Item><Button type="primary" htmlType="submit" >Add</Button></Form.Item>
                                </div>

                            </Form>
                        </div>
                    }
                </div>
            </div>
        </Skeleton>
    )


}