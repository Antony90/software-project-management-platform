import {Button, Carousel, Tooltip} from "antd";
import React, {useEffect, useState} from "react";
import {RiskSuggestionCard} from "../../Risk/RiskSuggestionCard";
import {Credentials} from "../../../Models/Credentials";
import {Project} from "../../../Models/DatabaseObjects/Project";
import {PauseCircleOutlined, PlayCircleOutlined} from '@ant-design/icons'

export function ProjectRiskItemCarousel({project, setTaskVisible}:{project:Project, setTaskVisible:(t:string)=>void}){

    const [collapsed, setCollapsed] = useState(null)
    const [autoplay, setAutoplay] = useState(true);

    useEffect(()=>{
        if(project != null){
            resetCollapsed()
        }
    }, [project, project.tasks])
    const resetCollapsed = ()=>{
        let newCollapsed : boolean[] = []
        project.suggestions.forEach(()=> {
            newCollapsed.push(true)
        })
        setCollapsed(newCollapsed)
    }

    const getRiskItems = ()=>{
        let items : JSX.Element[] = []
        let index : number = 0

        project.suggestions.forEach((r)=>{
            items.push(<RiskSuggestionCard key={"RISK" + r.name + Credentials.UUID()}
                                           setTaskVisible={setTaskVisible}
                                           risk={r}
                                           collapsed={collapsed}
                                           setCollapsed={setCollapsed}
                                           index={index}/>)
            index++
        })
        return items
    }

    return(
        <div style={{paddingBottom:10, width:"100%", overflow:"visible"}}>

            {project.suggestions.length > 1 &&
                <div style={{ position: 'relative', display:'flex', height:0, justifyContent:"flex-end", top:'27px', marginRight:10, width:"max-content", marginLeft:"auto" }}>
                    <Tooltip title={autoplay ? "Pause Scroll" : "Play Scroll"}>
                        <Button style={{zIndex: 1000}} type="ghost" shape='circle' icon={autoplay ? <PauseCircleOutlined /> : <PlayCircleOutlined />} size="large" onClick={() => {
                            setAutoplay(v => !v)
                        }} />
                    </Tooltip>

                </div>
            }

            {project.suggestions.length > 0 &&
            <Carousel style={{width:"100%", height:"100%"}} beforeChange={resetCollapsed} autoplay={autoplay}>
                {getRiskItems()}
            </Carousel>
            }

        </div>
    )
}