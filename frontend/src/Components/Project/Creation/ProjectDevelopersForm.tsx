import {Space, Transfer, Typography} from "antd";
import React from "react";

const {Title} = Typography

export interface DeveloperData {
    key : string
    title : string
    chosen: boolean;
}


export function ProjectDevelopersForm({data, selected, setSelected}: {data : DeveloperData[], selected:string[], setSelected : React.Dispatch<React.SetStateAction<string[]>>}){
    

    const developerSearch = (inputValue: string, option: DeveloperData) => option.title.indexOf(inputValue) > -1;


    const handleChange = (newSelected: string[]) => {
        setSelected(newSelected);
    }

    return (
        <Space direction="vertical" align="center">
        <Title>Add some developers</Title>
        <Title level={2}>Your project needs some collaborators to get things started</Title>
            <Transfer
                titles={["Available", "Added"]}
            dataSource={data}
            showSearch
            filterOption={developerSearch}
            targetKeys={selected}
            onChange={handleChange}
            render={(item : DeveloperData) => item.title}
            />
        </Space>
    )
}