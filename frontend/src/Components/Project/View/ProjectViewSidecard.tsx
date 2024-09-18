import {Card, DatePicker, Form, message, Select, Spin, Typography} from "antd";
import {DeveloperSelect} from "../../Utils/DeveloperSelect";
import {FormattingService} from "../../../Services/Utils/FormattingService";
import React, {useEffect, useState} from "react";
import {Project} from "../../../Models/DatabaseObjects/Project";
import dayjs from "dayjs";
import {FormValidationService} from "../../../Services/Utils/FormValidationService";
import {ForeignKeyReference} from "../../../Models/DatabaseObjects/ForeignKeyReference";
import {useCurrentOrganisation, useCurrentOrganisationDevelopers} from "../../../Models/DatabaseObjects/Organisation";
import {useCurrentUser} from "../../../Services/SessionServices/Session";
import {RequestFailureException} from "../../../API/RequestFailureException";
import {ProjectSaver} from "../../../Models/DatabaseObjectSavers/ProjectSaver";
import {useAvailableRepos} from "../../../Services/Utils/GithubService";
import GithubDetails from "common/build-models/GithubDetails";
import {useForceUpdate} from "../../Utils/UpdateComponent";
import {Credentials} from "../../../Models/Credentials";

const {Text, Paragraph} = Typography
const {RangePicker} = DatePicker


export function ProjectViewSidecard({project, projectSaver} : {project:Project, projectSaver : ProjectSaver}){



    const [loading, setLoading] = useState(false)

    const organisation = useCurrentOrganisation()

    const organisationDevelopers = useCurrentOrganisationDevelopers(setLoading)

    const [reposLoading, setReposLoading] = useState(false)
    const repos = useAvailableRepos(setReposLoading)

    const [timeframe, setTimeFrame] = useState<[dayjs.Dayjs, dayjs.Dayjs]>(null)
    const [budget, setBudget] = useState<number>(null)

    const user = useCurrentUser()
    const [form] = Form.useForm()

    const refresh = useForceUpdate()


    useEffect(()=> {
        if (project != null){
            setBudget(project.budget)
            setTimeFrame(project.getTimeFrame())
        }
    }, [project])


    const getSelectedDevs = ()=>{
        return ForeignKeyReference.toStringArray(project.developers)
    }


    const setSelectedDevs = (devsString : string[])=>{
        projectSaver.saveDevelopers(devsString, user)
            .then(()=>{
                message.success("Saved developers successfully")
            })
            .catch((e:RequestFailureException)=>{
                if(e == null) message.info("Cannot remove yourself from a project")
                else message.error("Failed to save developers")
                form.setFieldValue("developers", project.developers.map(d=>d.getID()))
            })

    }

    const onBudgetChange = (newBudget : string) =>{
        FormValidationService.isCostValidator(null, newBudget)
            .then((budgetFloat)=>{
                if(budgetFloat != project.budget) {
                    projectSaver.saveBudget(budgetFloat)
                        .then(()=>{
                            setBudget(project.budget)
                            message.success("Saved budget successfully")
                        })
                        .catch(()=>{
                            setBudget(project.budget)
                            message.error("Failed to save budget")
                        })
                }
                else{
                    setBudget(project.budget)
                }
            }, ()=>{
                setBudget(project.budget)
                message.error("Invalid number format")
            })
    }

    const onBudgetCancel = ()=>{
        setBudget(project.budget)
    }





    const onTimeFrameChange = (newTimeFrame : [dayjs.Dayjs, dayjs.Dayjs])=>{
        projectSaver.saveTimeFrame([newTimeFrame[0].toDate(), newTimeFrame[1].toDate()])
            .then(()=>{
                setTimeFrame(project.getTimeFrame())
                message.success("Saved timeframe successfully")
            })
            .catch(()=>{
                setTimeFrame(project.getTimeFrame())
                message.error("Failed to save timeframe")
            })
    }





    const completionDate = new Date(project.startDate.getTime() + project.projectedCompletion * 1000*24*3600);
    const completionDateStr = FormattingService.dateFormatter(completionDate)


    const onChangeRepo = (repoName : string)=>{
        let newRepo = repos.find((r)=>r.name == repoName)
        let currentGithubInfo = {} as GithubDetails
        if(project.githubDetails != null) JSON.parse(JSON.stringify(project.githubDetails))
        currentGithubInfo.repoName = newRepo.name
        currentGithubInfo.repoOwner = newRepo.owner
        currentGithubInfo.installationID = organisation.githubInstallationID

        if(newRepo.branches.find((b)=>b.name == "main")) currentGithubInfo.branchName = "main"
        else if(newRepo.branches.find((b)=>b.name == "master")) currentGithubInfo.branchName = "master"
        else if(newRepo.branches.find((b)=>b.name == "develop")) currentGithubInfo.branchName = "develop"
        else currentGithubInfo.branchName = newRepo.branches[0].name
        projectSaver.setGithubInfo(currentGithubInfo)
            .then(()=>{
                refresh()
                message.success("Repository Updated Correctly")
            })
            .catch(()=>{
                refresh()
                message.error("Repository Update Failed")
            })
    }

    const onChangeRepoBranch = (newBranch : string)=>{
        let currentGithubInfo = JSON.parse(JSON.stringify(project.githubDetails))
        currentGithubInfo.branchName = newBranch
        projectSaver.setGithubInfo(currentGithubInfo)
            .then(()=>{
                refresh()
                message.success("Branch Updated Correctly")
            })
            .catch(()=>{
                refresh()
                message.error("Branch Update Failed")
            })
    }

    if(user == null) return <div style={{  width:"25%", height : "100%", position:"absolute", right:15}} ><Spin spinning/></div>
    return (
        <Card style={{  width:"25%", height : "100%", overflow:"auto", position:"absolute", right:15}} >
            <div style={{display:"flex", flexDirection:"column", justifyContent:"left"}}>
                <Spin spinning={loading}/>
                <div style={{display:"flex", gap:"8px", flexDirection:"column", alignItems:"start" }}>
                    <Form
                        form={form}
                    onValuesChange={(values)=>setSelectedDevs(values.developers)}
                    initialValues={{developers:getSelectedDevs()}}
                    style={{width:"100%"}}
                    layout="vertical">
                        <Form.Item label={"Developers:"} name="developers">
                            <DeveloperSelect
                                disabled={!project.isProjectManager(user)}
                                possibleDevelopers={organisationDevelopers}
                                placeholder={"Project Developers"}/>
                        </Form.Item>
                    </Form>
                </div>

                <div style={{display:"flex", gap:"8px", flexDirection:"column", alignItems:"start", paddingBottom: '10px' }}>
                    <Text>Budget: </Text>
                    <Paragraph
                        editable={project.isProjectManager(user)?{
                            text:FormattingService.asCost(budget),
                            tooltip: 'Edit budget',
                            onChange: onBudgetChange,
                            onCancel:onBudgetCancel,
                            triggerType: ["icon", "text"]} : false}>
                        £{FormattingService.asCost(budget)}
                    </Paragraph>
                </div>

                <div style={{display:"flex", gap:"8px", flexDirection:"column", alignItems:"start", paddingBottom: '10px' }}>
                    <Text style={{margin:"0px"}}>Timeframe: </Text>
                    <RangePicker
                        disabled={!project.isProjectManager(user)}
                        onChange={onTimeFrameChange}
                        value={timeframe}
                    />
                </div>



                {repos == null && <div style={{marginTop:10}}><Spin spinning={reposLoading}/></div>}
                {repos != null &&
                <div  key={Credentials.UUID()}  style={{display:"flex", flexDirection:"column", gap:16, marginTop:8, alignItems:"flex-start"}}>
                    <Text underline>Github Connections:</Text>
                    <div style={{display:"flex", gap:10, alignItems:"center"}}>
                        <Text style={{width:100}}>Repository:</Text>
                        <Select
                            disabled={!project.isProjectManager(user)}
                            style={{width:200}}
                            showSearch
                            placeholder="Select a repository"
                            defaultValue={project.githubDetails?.repoName}
                            optionFilterProp="children"
                            onChange={onChangeRepo}
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }

                            options={repos.map((r)=>{return{label:r.name, value:r.name}})}
                        />
                    </div>



                    {project.githubDetails != null && project.githubDetails.repoName != null &&
                        <div style={{display:"flex", gap:10, alignItems:"center"}}>
                            <Text style={{width:100}}>Branch:</Text>
                            <Select
                                disabled={!project.isProjectManager(user)}
                                showSearch
                                style={{width:200}}
                                defaultValue={project.githubDetails?.branchName}
                                placeholder="Select a branch"
                                optionFilterProp="children"
                                onChange={onChangeRepoBranch}
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }

                                options={repos.find((r)=>project.githubDetails.repoName==r.name).branches.map((b)=>{return{label:b.name, value:b.name}})}/>
                        </div>
                    }

                </div>
                }

                {project.projectedCompletion && <div style={{display:"flex", gap:"8px", flexDirection:"column", alignItems:"start", marginTop:'20px' }}>
                    <Text style={{margin:"0px"}}>Projected Completion Date: </Text>
                    <Text strong>{completionDateStr}</Text>
                </div>}



            </div>




        </Card>
    )
}