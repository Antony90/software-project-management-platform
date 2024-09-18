import {Avatar, Card, message, Typography} from "antd";
import React, {useEffect, useState} from "react";
import {Task} from "../../Models/DatabaseObjects/Task";
import {AvatarGenerator} from "../Utils/AvatarGenerator";
import {Session} from "../../Services/SessionServices/Session";
import {ColouredTag} from "../Utils/ColouredTag";
import {TopLevelTask} from "../../Models/DatabaseObjects/TopLevelTask";

const { Title } = Typography;

export function TaskCard({task, onClick} : {task : Task, onClick : ()=>void}){

    const [devAvatars, setDevAvatars] = useState<JSX.Element>(<></>)

    useEffect(()=>{
        Session.userService.getMultiple(task.developers)
            .then((users)=> {
                let avatars: JSX.Element[] = []
                users.forEach((u) => {
                    avatars.push(AvatarGenerator.forUser(u, true))
                })
                if(avatars.length == 0) setDevAvatars(<div>No Assigned Developers</div>)
                else setDevAvatars(<Avatar.Group maxCount={4}>{avatars}</Avatar.Group>)
            })
            .catch(()=>{
                message.error("Failed to load users")
            })

    }, [])

    const CompletionTag = ()=>{
        if(task instanceof TopLevelTask){
            let status = task.getCompletionStatus()
            return <ColouredTag value={status.name} colour={status.colour}/>
        }
        else{
            return <></>
        }


    }


    return(
        <Card key={task.name} hoverable onClick={onClick} style={{ margin : "5px", textAlign:"start", width:"100%"}}>
            <div style={{display:"flex", alignItems:"center", position:"relative", gap:24}}>
                <div style={{width:"50%"}}><Title level={5} style={{margin:0}}>{task.name}</Title></div>
                <div style={{position:"absolute", right:"30%"}}><CompletionTag/></div>
                <div style={{marginLeft:"auto"}}>{devAvatars}</div>
            </div>
        </Card>
    )

}