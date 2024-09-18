import {DeveloperFeedbackItem, DeveloperFeedbackItemParams} from "./DeveloperFeedbackItem";
import React, {useState} from "react";
import {Button, Form, message, Spin} from "antd";
import {APIRequest} from "../../API/APIRequest";
import {APIEndpoint, HTTPRequestMethod} from "../../API/APIEndpoint";
import {SchedulableEvent, SchedulableEventType, SchedulerService} from "../../Services/SessionServices/SchedulerService";
import {useForm} from "antd/es/form/Form";


export class FeedbackScheduler{

    static scheduleMoodFeeback(projectID: string, userID : string){
        SchedulerService.scheduleIfNotAlreadyScheduled(
            new SchedulableEvent(
                SchedulableEventType.DEVELOPER_FEEDBACK_EVENT,
                userID,
                SchedulerService.daysTime(7),
                {project: projectID}
            )
        )
    }

}

export function DeveloperFeedback({projectID, items, onSubmit}
                                      : {projectID : string, items:DeveloperFeedbackItemParams[], onSubmit:(n:number)=>void}){


    const [form]=useForm()

    const [loading, setLoading] = useState(false)



    const submitFeeback = (values : any)=>{
        setLoading(true)
        new APIRequest<any, any>(new APIEndpoint(null, `/project/${projectID}/mood`)).execute(
            HTTPRequestMethod.DEFAULT, {mood:values[0] - 3}
        ).then(()=>{
            onSubmit(0)
        })
        .catch(()=>{
            message.error("Mood submission failed")
        })
        .finally(()=>setLoading(false))
    }

     const components = items.map((v, i)=>{
         return <DeveloperFeedbackItem getCurrentValue={()=>form.getFieldValue(i)} key={i} params={v} index={i.toString()} />
     })

    const getInitialValues = ()=>{
        let currentIndex = 0
        let initialValues : any = {}
        for(let item of items){
            initialValues[(currentIndex++).toString()] = item.defaultValue
        }
        return initialValues
    }


    return (
        <Spin spinning={loading}>
        <Form
            form={form}
            initialValues={getInitialValues}
            onFinish={submitFeeback}>
            {components}
            <Form.Item style={{position:"relative", top:50}}>
                <Button type="primary" htmlType="submit">Send Feedback</Button>
            </Form.Item>
        </Form>
        </Spin>
    )

}