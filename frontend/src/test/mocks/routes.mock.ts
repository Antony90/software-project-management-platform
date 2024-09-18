import {LOGIN, LOGOUT, REGISTER} from "../routes/auth.routes.mock";
import {
    ORGANISATION,
    ORGANISATION_CREATE,
    ORGANISATION_ID,
    ORGANISATION_JOIN,
    ORGANISTION_LEAVE
} from "../routes/org.routes.mock";
import {PROJECT_CREATE, PROJECT_GET} from "../routes/project.routes.mock";
import {USER_DELETE, USER_GET, USER_GET_ID, USER_POPULATE, USER_SKILLS} from "../routes/user.routes.mock";

export class routes_mock{

    static routes_mock = [REGISTER,
        LOGIN,
        LOGOUT,
        ORGANISATION,
        ORGANISATION_ID,
        ORGANISATION_CREATE,
        ORGANISATION_JOIN,
        ORGANISTION_LEAVE,
        PROJECT_CREATE,
        PROJECT_GET,
        USER_GET,
        USER_GET_ID,
        USER_POPULATE,
        USER_DELETE,
        USER_SKILLS]


    static matches(urlRef : string, url : string){
        let splitUrlRef = urlRef.split("/")
        let splitUrl = url.split("/")

        let matches = true

        for(let i = 0; i < splitUrlRef.length; i++){
            if(!splitUrlRef[i].startsWith(":")){
                matches = matches && (splitUrlRef[i] == splitUrl[i])
            }
        }
        return matches
    }
    static getRoute(url : string, method:string){
        return routes_mock.routes_mock.find((r)=>{
            return this.matches(r.url, url) && r.method == method
        })
    }
}


