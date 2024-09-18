import React, {useEffect, useState} from "react";
import {Button, Col, List, message, Popconfirm, Row, Skeleton, Spin, Tooltip, Typography} from "antd";
import {useCurrentOrganisation, useCurrentOrganisationDevelopers} from "../../Models/DatabaseObjects/Organisation";
import {AvatarGenerator} from "../Utils/AvatarGenerator";
import skills from "common/build-models/Skills"
import {Chart, ReactGoogleChartEvent} from "react-google-charts";
import {OrganisationService} from "../../Services/DatabaseObjectServices/OrganisationService";
import {CopyToClipBoard} from "../Utils/CopyToClipBoard";
import {GithubService} from "../../Services/Utils/GithubService";
import {Session, useCurrentUser} from "../../Services/SessionServices/Session";
import {URLParam, URLService} from "../../Services/NavigationServices/URLService";
import {useForceUpdate} from "../Utils/UpdateComponent";
import {GithubOutlined} from "@ant-design/icons"


const {Title, Text} = Typography

export function OrganisationView(){


    const [loading, setLoading] = useState(false)

    const [githubLoading, setGithubLoading] = useState(false)

    const organisation = useCurrentOrganisation()

    const organisationMembers = useCurrentOrganisationDevelopers(setLoading)

    const refresh = useForceUpdate()

    const currentUser = useCurrentUser()

    const [skillData, setSkillData] = useState([])
    const [totalSkills, setTotalSkills] = useState(0)

    const [selectedSkill, setSelectedSkill] = useState<string>(null)

    useEffect(()=>{
        if(organisation != null) {
            if (GithubService.getInstallID() != null) {
                GithubService.setInstallID()
                    .then(() => {
                        message.success("Github Connection Succeeded")
                        organisation.githubInstallationID = GithubService.getInstallID();
                        (new URLService()).removeUrlParams(URLParam.GITHUB_CODE);
                        (new URLService()).removeUrlParams(URLParam.GITHUB_SETUP_ACTION);
                        (new URLService()).removeUrlParams(URLParam.GITHUB_INSTALLATION_REDIRECT)
                        Session.organisationService.cache(organisation)
                        refresh()
                    })
                    .catch(() => message.error("Github Connection Failed"))
            }
        }
    }, [organisation])


    useEffect(()=>{
        if(organisationMembers != null) {
            setSkillData(getSkillData())
            let s = 0
            organisationMembers.forEach((m)=>{
                s += m.skillSet.length
            })
            setTotalSkills(s)
        }
    }, organisationMembers)

    const getSkillData = ()=>{
        let data : [string, number][] = []
        let skillsIndices : any = {}
        for(let i = 0; i < skills.length; i++){
            data.push([skills[i], 0])
            skillsIndices[skills[i]] = i
        }
        organisationMembers.forEach((member)=>{
            member.skillSet.forEach((skill)=>{
                data[skillsIndices[skill]][1]++
            })
        })
        return [["Skill", "Developers with skill"], ...data]
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
                    setSelectedSkill(skillData[row+1][0])
                }
                else{
                    setSelectedSkill(null)
                }
            },
        },
    ];

    const [chart, setChart] = useState(null)

    useEffect(()=>{
        if(skillData!=null){
            setChart(<Chart
                chartType="PieChart"
                data={skillData}
                options={{backgroundColor:"transparent", legend:{position:"bottom"}}}
                width={"400px"}
                height={"400px"}
                chartEvents={chartEvents}
            />)
        }
    }, [skillData])

    const connectGithub = ()=>{
        GithubService.redirectForInstall()
    }
    const disconnectGithub = ()=>{
        setGithubLoading(true)
        GithubService.setInstallID(null, true)
            .then(()=>{
                organisation.githubInstallationID = null
                Session.organisationService.cache(organisation)
                refresh()
                message.success("Disconnected Github Successfully")
            })
            .catch(()=>{
                message.error("Github could not be disconnected")
            })
            .finally(()=>setGithubLoading(false))
    }


    if(currentUser == null || organisation == null || organisationMembers == null || chart == null) return <Spin spinning></Spin>
    else
    {
        return (

                    <Skeleton active loading={loading} paragraph={{rows:10}}>
                        <Row justify={"center"} align={"middle"} style={{justifyContent:"center", gap:16}}>
                            <Title style={{fontWeight:"bolder", margin:0}}>{organisation.name}</Title>
                            {organisation.admin.getID() == currentUser.getID() &&
                            <div style={{position:"relative", top:3}}>
                            <Spin spinning={githubLoading}>

                            {organisation.githubInstallationID == null &&
                                <Popconfirm
                                    title="Connect your organisation to GitHub"
                                    description="You will now be redirected to GitHub to install the risk evaluator plugin"
                                    onConfirm={connectGithub}
                                    okText="Continue"

                                >
                                    <Button type="primary" icon={<GithubOutlined />}>Connect To Github</Button>
                                </Popconfirm>

                            }
                            {organisation.githubInstallationID != null &&
                                <Popconfirm
                                    title="Disconnect your organisation from GitHub"
                                    description={"This will permanently disconnect GitHub repository access from you organisation, including all your projects."}
                                    onConfirm={disconnectGithub}
                                    okText="Continue"
                                >
                                <Button icon={<GithubOutlined />} danger>Disconnect From Github</Button>
                                </Popconfirm>
                            }

                            </Spin>
                            </div>
                            }
                        </Row>
                        <Row justify={"center"} gutter={[64, 0]} style={{marginLeft:0, marginRight:0}}>
                            <Col>
                                <List
                                    header={<Title level={3}>{selectedSkill==null? "All Members" : `Members with skill '${selectedSkill}'`}</Title>}
                                    pagination={{ position:"bottom", pageSize:5, style:{display:"flex", justifyContent:"center"}}}

                                    dataSource={organisationMembers.filter((m)=>{
                                        if(selectedSkill == null) return true
                                        return m.skillSet.indexOf(selectedSkill) != -1
                                    })}
                                    style={{width:"max-content"}}
                                    renderItem={(user) => (
                                        <List.Item style={{display:"flex", width:"max-content", gap:24, flexDirection:"row"}}>

                                            <Tooltip title={`${user.getSkillsList()}`} placement={"right"}>
                                                <div style={{display:"flex", alignItems:"center", gap:8}}>
                                                    {AvatarGenerator.forUser(user)}
                                                    <Text>{user.getFullName()} ({user.email})</Text>
                                                </div>
                                            </Tooltip>
                                        </List.Item>
                                    )}
                                />
                            </Col>
                            {totalSkills != 0 &&
                            <Col>
                                <div className="piechart" style={{display:"flex", flexDirection:"column", width:"100%"}}>
                                    <Title level={3} style={{position:"relative", margin:0, top:25}}>Skill Coverage</Title>
                                    {chart}
                                </div>
                            </Col>
                            }

                        </Row>
                        <Row gutter={[4, 4]} justify="space-around" style={{marginLeft:0, marginRight:0, width:"100%"}}>
                            <Col>
                                <div style={{display:"flex", flexDirection:"column"}}>
                                    <Title level={3}>Join Link</Title>
                                    <Text>
                                        <CopyToClipBoard>{OrganisationService.joinURLFromID(organisation.getID())}</CopyToClipBoard>
                                    </Text>
                                </div>
                            </Col>
                        </Row>


                    </Skeleton>
            )
    }
}