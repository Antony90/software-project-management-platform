interface mUser<IDType, ProjectType, OrgType>{
    _id: IDType;
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    skillSet: string[];
    projects: ProjectType[];
    organisation?: OrgType;
}

export default mUser;