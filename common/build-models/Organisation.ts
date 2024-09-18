export interface mOrganisation<IDType, UserType> {
    _id: IDType
    name: string
    admin: UserType
    members: UserType[]

    githubInstallationID : string
}

export default mOrganisation;