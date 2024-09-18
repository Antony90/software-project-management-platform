import React, {useState} from "react";
import {List, Select, Typography} from "antd";
import {VersionService} from "../../Services/Utils/VersionService";

const {Title} = Typography


function VersionNotes({versionNumber}: {versionNumber:string}){


    const version = VersionService.getReleaseNotes(versionNumber)


    const VersionItemsList = ({noContentsString, listIn}:{noContentsString : string, listIn : {title:string, description:string}[]})=>{
        if(listIn.length == 0) return <Title level={5}>{noContentsString}</Title>
        else return(
        <List
            itemLayout="horizontal"
            style={{width:"100%"}}
            dataSource={listIn}
            renderItem={(item) => (
                <List.Item>
                    <List.Item.Meta
                        style={{width : "100%", textAlign:"left"}}
                        title={item.title}
                        description={item.description}
                    />
                </List.Item>
            )}
        />
        )
    }


    if(version == null) return <Title level = {3}>This version does not have release notes yet!</Title>

    else return(

    <div style={{display:"flex", alignItems:"start", flexDirection:"column", width:"100%", gap:"8px"}}>

        <Title level={4}>New Features Released</Title>
        <VersionItemsList noContentsString="No new features were added in this release" listIn={version.new_features}/>

        <Title level={4}>Bugs Fixed</Title>
        <VersionItemsList noContentsString="No bugs were fixed in this release" listIn={version.fixed_bugs}/>

    </div>
    )

}

export function About(){

    const version = process.env.REACT_APP_VERSION

    const [versionNotes, setVersionNotes] = useState(<VersionNotes versionNumber={version}/>)
    const changeVersionNotes = (value: string) => {
        setVersionNotes(<VersionNotes versionNumber={value}/>)
    };


    const getVersionSelectOptions = ()=>{

        let versions = VersionService.getVersions()

        if(versions.indexOf(version) == -1){
            versions = [version, ...versions]
        }

        let options : {value:string, label:string}[] = []

        versions.forEach((v)=>{
            options.push({value:v, label:v})
        })

        return options

    }



    return (

        <div style={{display:"flex", flexDirection:"column", gap:"16px", width:"100%", alignItems:"start"}}>
            <Title underline>CURRENT VERSION: {version}</Title>

            <Title level={3}>Select Version Notes</Title>

            <Select
            defaultValue={version}
            style={{ width: 120 }}
            onChange={changeVersionNotes}
            options={getVersionSelectOptions()}/>
            {versionNotes}
        </div>

    )
}