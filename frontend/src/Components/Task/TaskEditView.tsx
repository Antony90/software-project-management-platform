import {Button, Form, Input, InputNumber, Select, Space, Typography} from "antd";
import React, {useEffect, useState} from "react";
import {Task} from "../../Models/DatabaseObjects/Task";
import {TopLevelTask} from "../../Models/DatabaseObjects/TopLevelTask";
import {User} from "../../Models/DatabaseObjects/User";
import {FormValidationService} from "../../Services/Utils/FormValidationService";
import {MultiTagSelect} from "../Utils/MultiTagSelect";
import {MoreInfoHoverable} from "../Utils/MoreInfoHoverable";
import possibleSkills from "common/build-models/Skills";


const {Option} = Select
const {Text} = Typography

export function TaskEditView({onTaskEditComplete, possibleDevelopers, current = null, projectStartDate, currentTasks = null, topLevel=false, projectID=null}:
     {onTaskEditComplete : (t : Task)=>void, possibleDevelopers:User[], current? : Task, topLevel?:boolean, projectID?:string,
     projectStartDate : Date, currentTasks : TopLevelTask[]}){


    const [form] = Form.useForm()

    const [submitButtonText, setSubmitButtonText] = useState("Create Task")


    const populateForm = (t : Task)=>{
        let developers : string[] = []
        t.developers.forEach((d)=>developers.push(d.getID()))
        if(t instanceof TopLevelTask){
            form.setFieldValue("budget", t.estimatedCost)
            form.setFieldValue("developers", t.expectedNumDevelopers)
            form.setFieldValue("skills", t.requiredSkills)
            form.setFieldValue("dependencies", t.dependencies)
        }

        form.setFieldValue("name", t.name)
        form.setFieldValue("optimistic", t.optimistic)
        form.setFieldValue("mostLikely", t.mostLikely)
        form.setFieldValue("pessimistic", t.pessimistic)



    }

    useEffect(()=>{
        if(current != null){
            populateForm(current)
            setSubmitButtonText("Update Task")
        }
    }, [])




    const labelifySkill = (s : string)=>{
        return {label:s, value:s}
    }
    const labelifyDependency = labelifySkill

    const createTask = (values : any)=>{

        if(topLevel) {
            onTaskEditComplete(new TopLevelTask(projectID, projectStartDate, values.name, [], [], values.dependencies, values.optimistic, values.mostLikely, values.pessimistic, values.budget,
                values.skills, null, null, values.developers))
        }
        else{
            onTaskEditComplete(new Task(projectID, values.name, [], values.developers, values.optimistic, values.mostLikely, values.pessimistic))
        }
    }

    const currencies = (
        <Select defaultValue="GBP" style={{ width: 60 }}>
          <Option value="USD">$</Option>
          <Option value="EUR">€</Option>
          <Option value="GBP">£</Option>
        </Select>
      );




    
    if(possibleDevelopers == null)return <></>
    return(
        <Form
		name="basic"
        form={form}
		onFinish={createTask}
        style={{display:"flex", gap:"10px"}}
		layout="vertical">

            <Space direction="vertical" style={{width:"50vw"}}>

                <Form.Item
                label="Task name"
                name="name"
                rules={[FormValidationService.CANNOT_BE_BLANK]}>
                    <Input disabled={current!=null} />
                </Form.Item>

                {topLevel && (
                    <Form.Item
                    label="Task Budget"
                    name="budget"
                    rules={[FormValidationService.CANNOT_BE_BLANK]}>
                    <InputNumber addonBefore={currencies} min={0} placeholder="Estimated Task Budget"/>
                    </Form.Item>
                )}

                <Text underline style={{fontSize:15}}>Days To Complete</Text>
                <Space align={"start"} size={30} direction={"horizontal"}>
                    <Form.Item
                        label={<MoreInfoHoverable info={"How long would this task take in the best case?"}>Optimistic</MoreInfoHoverable>}
                        name="optimistic"
                        rules={[FormValidationService.CANNOT_BE_BLANK]}>
                        <InputNumber min={0}/>
                    </Form.Item>

                    <Form.Item
                        label={<MoreInfoHoverable info={"How long would this task most likely take?"}>Expected</MoreInfoHoverable>}
                        name="mostLikely"
                        rules={[FormValidationService.CANNOT_BE_BLANK]}>
                            <InputNumber min={0}/>
                    </Form.Item>
                    <Form.Item
                        label={<MoreInfoHoverable info={"How long would this task take in the worst case?"}>Pessimistic</MoreInfoHoverable>}
                        name="pessimistic"
                        rules={[FormValidationService.CANNOT_BE_BLANK]}>
                        <InputNumber min={0}/>
                    </Form.Item>
                </Space>
                <Form.Item>
                    <Button type={"primary"} htmlType={"submit"} style={{position: "absolute", marginTop:"50px"}}>{submitButtonText}</Button>
                </Form.Item>
            </Space>
            <Space style={{width:"500px"}} direction={"vertical"}>

                <Form.Item
                    label={<MoreInfoHoverable info={"Number of developers needed to finish this task"}>Developers Required</MoreInfoHoverable>}
                    name="developers"
                rules={[FormValidationService.CANNOT_BE_BLANK]}>
                    <InputNumber min={0}/>

                </Form.Item>

                {topLevel &&
                    (<Form.Item label = "Required skills" name="skills">
                    <MultiTagSelect
                        key="ReqSkills"
                        placeholder="Required Skills"
                                    data={possibleSkills}
                                    labelify={labelifySkill}  />
                        </Form.Item>
                    )}
                {topLevel && (
                    <Form.Item label="Task Dependencies" name="dependencies">
                        <MultiTagSelect key="TaskDep" data={TopLevelTask.getTaskPossibleNewDependencies(current as TopLevelTask, currentTasks).map((t)=>t.getID())} placeholder={"Dependencies"} labelify={labelifyDependency}/>
                    </Form.Item>)}
            </Space>

        </Form>
    )
}