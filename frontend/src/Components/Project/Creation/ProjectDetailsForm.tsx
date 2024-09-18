import {DatePicker, Form, FormInstance, Input, Select, Space, Typography} from "antd";
import React from "react";
import TextArea from "antd/es/input/TextArea";
import {Project} from "../../../Models/DatabaseObjects/Project";
import {FormValidationService} from "../../../Services/Utils/FormValidationService";


const {Title} = Typography

const { RangePicker } = DatePicker;

const {Option} = Select


export enum CreateProjectDetailsPageFormItems{
    NAME = "title",
    DESCRIPTION = "description",
    BUDGET = "budget",
    DATES = "dates",
    SKILLS = "skills"
}

export function PopulateProjectDetailsForm(formModel : FormInstance<any>, project : Project){
    formModel.setFieldValue(CreateProjectDetailsPageFormItems.NAME, project.name)
    formModel.setFieldValue(CreateProjectDetailsPageFormItems.DESCRIPTION, "")
    formModel.setFieldValue(CreateProjectDetailsPageFormItems.BUDGET, project.budget)
    formModel.setFieldValue(CreateProjectDetailsPageFormItems.DATES, null)
}

export function ProjectDetailsForm({formModel} : {formModel:FormInstance<any>}){


    const currencies = (
        <Select defaultValue="GBP" style={{ width: 60 }}>
          <Option value="USD">$</Option>
          <Option value="EUR">€</Option>
          <Option value="GBP">£</Option>
        </Select>
      );

    return(
    <Space direction="vertical">
    <Title>Time to create your project</Title>
    <Title level={2}>We just need a few details to get you started</Title>
    <Form
    form={formModel}
    name="basic"
    layout="vertical">
        
        <Form.Item
        label="Project Title"
        name={CreateProjectDetailsPageFormItems.NAME}
        rules={[FormValidationService.CANNOT_BE_BLANK]}>
            <Input placeholder="Title"/>
        </Form.Item>

        <Form.Item
        label="Project Description"
        name={CreateProjectDetailsPageFormItems.DESCRIPTION}>
            <TextArea rows={4} placeholder={"A brief summary of your project here"} />
        </Form.Item>

        <Form.Item
        label="Timeframe"
        name={CreateProjectDetailsPageFormItems.DATES}
        rules={[FormValidationService.CANNOT_BE_BLANK]}>
            <RangePicker />
        </Form.Item>

        <Form.Item
        label="Project Budget"
        name={CreateProjectDetailsPageFormItems.BUDGET}
        rules={[FormValidationService.CANNOT_BE_BLANK, FormValidationService.COST_FORMAT]}>
            <Input addonBefore={currencies} placeholder="Estimated Project Budget"/>
        </Form.Item>

    </Form>
    </Space>
    )
}