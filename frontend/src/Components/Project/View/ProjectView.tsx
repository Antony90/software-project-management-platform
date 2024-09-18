import {message, Skeleton} from "antd";
import React, {useState} from "react";
import {useProject} from "../../../Models/DatabaseObjects/Project";
import {useParams} from "react-router-dom";
import {ProjectViewSidecard} from "./ProjectViewSidecard";
import {ProjectViewBody} from "./ProjectViewBody";
import {Session} from "../../../Services/SessionServices/Session";

export function ProjectView(){

    const { id } = useParams()


    const [loading, setLoading] = useState(false)
    const [project, ProjectSaver, setProject ] = useProject(id, setLoading)




    const refresh = ()=>{
        setLoading(true)
        Session.projectService.get(project.getID(), true)
            .then((p)=>{
                setProject(p)
                message.success("Reloaded successfully")
            })
            .catch(()=>{
                
                message.error("Failed to reload project")
            })
            .finally(()=>setLoading(false))
    }

    if(project == null) return <Skeleton active loading={loading} paragraph={{rows:20}}> <></> </Skeleton>
    else
    return (
        <>
            <Skeleton active loading={loading} paragraph={{rows:20}}>
                <div style={{display:"flex", width:"100%", height:"100%", overflow:"hidden", position:"relative"}}>
                    <ProjectViewSidecard project={project} projectSaver={ProjectSaver}/>
                    <ProjectViewBody onRefresh={refresh} project={project} ProjectSaver={ProjectSaver}/>
                </div>
            </Skeleton>
        </>
    )
}