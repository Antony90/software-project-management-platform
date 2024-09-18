import {APIEndpoint} from "../../API/APIEndpoint";
import {Project} from "../../Models/DatabaseObjects/Project";
import {DatabaseObjectService} from "./DatabaseObjectService";
import {Session} from "../SessionServices/Session";

/**
 * Deals with Projects
 */
export class ProjectService extends DatabaseObjectService<Project>{

    constructor(){
        super(APIEndpoint.PROJECT, Project.fromResponse, Project.fromObject, "PROJECT")
    }

    override async create(obj: Project) {
        try{
            let p = await super.create(obj);
            Session.userService.currentUser.addProject(p)
            return p
        }
        catch(e){
            throw e
        }


    }


    override async get(id: string, refresh:boolean=false, fromCache: boolean = true): Promise<Project> {
        if(refresh)
            return super.get(id + "?refresh=true", false);
        else
            return super.get(id, fromCache);
    }







}