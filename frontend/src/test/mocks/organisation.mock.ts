


export const USER_ALREADY_IN_ORG_ID = 101

export const USER_ALREADY_IN_ORG_NAME = "Test Org Already In"
export const organisation_mock : any = {
    id : "100",
    name:"Test Org",
    admin : "1",
    numMembers:1,
    members:["1"]
}

export const organisation_to_create_mock : any = {
    id:"101",
    name:"Test Org 2",
    admin:["1"],
    numMembers:1,
    members:["1"]
}

export const organisation_to_create_user_exists_mock : any = {
    id:"102",
    name:USER_ALREADY_IN_ORG_NAME,
    numMembers:1,
    members:["1"]
}