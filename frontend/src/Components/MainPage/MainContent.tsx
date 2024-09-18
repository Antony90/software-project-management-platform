import {Form, Layout, message, Modal, Spin, Typography} from "antd";
import {Content, Header} from "antd/es/layout/layout";
import React, {useEffect, useState} from "react";
import {contentStyle, headerStyle} from "../Styles/MainContent.css";
import {Outlet, useLocation, useNavigate} from "react-router-dom";
import {NavRoute} from "../../Services/NavigationServices/NavRoutes";
import {useCurrentUser} from "../../Services/SessionServices/Session";
import {TitleBar} from "./TitleBar";
import {FormValidationService} from "../../Services/Utils/FormValidationService";
import {MultiTagSelect} from "../Utils/MultiTagSelect";
import possibleSkills from "common/build-models/Skills";
import {UserSaver} from "../../Models/DatabaseObjectSavers/UserSaver";

const {Title} = Typography

const mainPageStyle: React.CSSProperties = {
	textAlign: 'center',
	justifyContent:'center',
	alignItems:'center',
	height:"100%",
	width:"100%",
	color: '#fff',
	display:'flex'
};

export function MainContent(){


	const currentUser = useCurrentUser()

	const [loading, setLoading] = useState(false)
	const [form] = Form.useForm()
	const navigate = useNavigate()

	const location = useLocation()

	const [skillsModalOpen, setSkillsModalOpen] = useState(false)


	useEffect(()=>{
		if(location.pathname.endsWith(NavRoute.MAIN) || location.pathname.endsWith(NavRoute.MAIN + "/")){
			navigate(NavRoute.DASHBOARD)
		}
	}, [])

	useEffect(()=>{
		if(currentUser!= null){
			if(currentUser.skillSet.length == 0){
				setSkillsModalOpen(true)
			}
		}
	}, [currentUser])



	const saveSkills = (values : any)=>{
		setLoading(true)
		new UserSaver(currentUser).saveSkills(values.skillSet)
			.then(()=>{
				message.success("Skills updated")
				setSkillsModalOpen(false)
			})
			.catch(()=>{
				message.error("Skill update failed")
			})
			.finally(()=>setLoading(false))

	}




	if(currentUser == null){
		return <></>
	}
	else
    return(
		<div style={mainPageStyle}>
        <Layout style={{height:"100vh"}}>
        <Layout>
          <Header style={headerStyle}><TitleBar/></Header>
          <Content style={contentStyle}>
              <Outlet/>

			  <Modal
				  title="Enter Skill-Set"
				  open={skillsModalOpen}
				  cancelText="Maybe later"
				  okText="Save skills"
				  onCancel={()=>setSkillsModalOpen(false)}
				  onOk={()=>form.submit()}
				  width={"50vw"}
				  style={{width:"50vw", height: "50vh", position: "absolute", left: "25vw", top: "5vh"}}>
			  		<Spin spinning={loading}>
					  <div>
						  <Form form={form} onFinish={saveSkills}>
						  <Title level={3}>Looks like you haven't filled us in on your skill-set just yet, please add your areas of expertise below</Title>
							  <Form.Item
									name="skillSet"
									rules={[FormValidationService.CANNOT_BE_BLANK]}>
								  <MultiTagSelect placeholder="My Skills"
												  data={possibleSkills}
												  labelify={(s)=>{return{label:s, value:s}}}  />
							  </Form.Item>
						  </Form>
					  </div>
		  		</Spin>
			  </Modal>
          </Content>
        </Layout>
      </Layout>
	  </div>
    )
}