import React, {useEffect, useState} from "react";
import {Chart, ReactGoogleChartEvent} from "react-google-charts";
import {Task} from "../../Models/DatabaseObjects/Task";
import {TopLevelTask} from "../../Models/DatabaseObjects/TopLevelTask";
import {ColourScheme} from "../Styles/ColourScheme";
import {Typography} from "antd"
import {Project} from "../../Models/DatabaseObjects/Project";

const {Title} = Typography

export function GanttChart({tasks, title, pxPerDay=10, onClickTask=()=>{}, actualIfPossible}
: {tasks : TopLevelTask[], title:string, pxPerDay? : number, onClickTask?:(t:TopLevelTask)=>void, actualIfPossible : boolean}){


    const BAR_HEIGHT = 42
    const BOTTOM_ROW_HEIGHT = 60
    const TASK_DISPLAY_HEIGHT = 175

    const [rows, setRows] = useState([])
    const columns =
    [
        { type : "string", label: "Task ID" },
        { type: "string", label: "Task Name" },
        { type: "string", label: "Task" },
        { type: "date", label: "Start Date" },
        { type: "date", label: "End Date" },
        { type: "number", label: "Duration" },
        { type: "number", label: "Percent Complete" },
        { type: "string", label: "Dependencies" },
    ]

    const [convertedTasks, setConvertedTasks] = useState([])

    const [firstTask, setFirstTask] = useState(null)
    const [lastTask, setLastTask] = useState(null)

    useEffect(()=>{
        if(tasks.length != 0) {
            let rows = getRows(tasks)
            setFirstTask(findFirstTask(rows))
            setLastTask(findLastTask(rows))
            setConvertedTasks(tasks)
            setRows(rows)
        }
    }, [tasks, actualIfPossible])



    /**
    const enumerateTasks = (tasks : Task[], currentLevel : number = 0, parentID : string = null):TopLevelTask[] =>{
        let enumerated:TopLevelTask[] = []
        tasks.forEach((t : TopLevelTask)=>{
            t.level = currentLevel
            t.parentID = parentID
            enumerated.push(t)
            enumerated = [...enumerated, ...enumerateTasks(t.subtasks, currentLevel + 1, t.getID())]
        })
        return enumerated
    }
     **/

    const formatDependancies = (s : string[]): string =>{
        if(s.length == 0) return null
        return s.join(",")
    }



    const getRows = (tasks : TopLevelTask[])=>{
        
        let rows : any[] = []

        let sortedTasks = Project.tasksDateSorted(tasks, actualIfPossible)

        sortedTasks.forEach((t : TopLevelTask)=>{
            let dependencies = null
            if(t instanceof TopLevelTask) dependencies = formatDependancies(t.dependencies)
            let completeness = 0
            if(t.isComplete()) completeness = 100
            let timeFrame = t.getTimeFrame(actualIfPossible)
            let addon = ""
            if(t instanceof TopLevelTask && t.isComplete() && actualIfPossible) addon = " (Complete)"
            let row = 
                [
                    t.getID(),
                    t.name + addon,
                    null,
                    timeFrame.startDate,
                    timeFrame.endDate,
                    timeFrame.duration,
                    completeness,
                    dependencies
                    
                ]
            rows.push(row)
            }
            
        )
        return rows
    }


    const findFirstTask : (rows:any[])=>number =(rows)=>{
        let currentFirst = rows[0][3].getTime()
        rows.forEach((r : any[])=>{
            if(r[3].getTime() < currentFirst) currentFirst = r[3].getTime()
        })
        return currentFirst
    }

    const findLastTask : (rows:any[])=>number = (rows)=>{
        let currentLast = rows[0][4].getTime()
        rows.forEach((r : any[])=>{
            if(r[4].getTime() > currentLast) currentLast = r[4].getTime()
        })
        return currentLast
    }

    const msToDays : (ms : number)=>number= (ms : number)=>{
        return ms/(1000*60*60*24)
    }

    const getMinWidth : ()=>number = ()=>{
        if(firstTask == null || lastTask == null) return 0
        return msToDays(lastTask - firstTask) * pxPerDay
    }

    const getMinHeight : ()=>number = ()=>{
        return tasks.length * BAR_HEIGHT + BOTTOM_ROW_HEIGHT
    }



    const options = {gantt:
        {
            sortTasks : false,
            criticalPathEnabled : !actualIfPossible,
            arrow:{
              color:actualIfPossible ? "transparent" : null
            },
            labelStyle : {
                width:"100%",
                textAlign:"left"
            }
        }

    }




    const chartEvents: ReactGoogleChartEvent[] = [
        {
            eventName: "select",
            callback: ({ chartWrapper }) => {
                const chart = chartWrapper.getChart();
                const selection = chart.getSelection();
                if (selection.length === 1) {
                    const [selectedItem] = selection;
                    const { row } = selectedItem;
                    let id = rows[row][0]
                    let task = convertedTasks.find((t:TopLevelTask)=>{return t.getID() == id})
                    onClickTask(task)
                }
            },
        },
      ];

    const divWrapperStyle : React.CSSProperties = {
        display:"flex",
        flexDirection:"column",
        background:"#ffffff",
        border:`1px solid ${ColourScheme.colourPrimary}`,
        borderRadius:"1rem",
        overflow:"hidden",
        height:"min-content",
        paddingBottom:5
    }

    if(tasks.length == 0) return <></>
    return (
        <div style={divWrapperStyle}>
            <Title style={{backgroundColor:ColourScheme.colourBackground, margin:0, paddingTop:20, paddingBottom:20}} level={3}>{title}</Title>
            <div style={{minHeight:TASK_DISPLAY_HEIGHT,overflowX:"auto",overflowY:"hidden"}} className="gantt">
                <Chart
                style={{minWidth:getMinWidth(), minHeight:TASK_DISPLAY_HEIGHT}}
                chartType="Gantt"
                height={getMinHeight()}
                options={options}
                chartEvents={chartEvents}
                data={[columns, ...rows]}/>
            </div>
        </div>
    )

}