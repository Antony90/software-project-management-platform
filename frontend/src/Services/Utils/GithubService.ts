import {URLParam, URLService} from "../NavigationServices/URLService";
import {APIRequest} from "../../API/APIRequest";
import {APIEndpoint, HTTPRequestMethod} from "../../API/APIEndpoint";
import {useEffect, useState} from "react";
import {message} from "antd";
import {SessionStorageService} from "../StorageServices/SessionStorageService";
import {useCurrentOrganisation} from "../../Models/DatabaseObjects/Organisation";

export class GithubService{

    static APP_URL_PRODUCTION = "https://github.com/apps/project-risk-calculator"


    static getAppUrl(){
        if(window.location.href.indexOf("dobrevaskevington.tplinkdns.com:40000") != -1) return this.APP_URL_PRODUCTION
        else{
            message.info("Github connections are only available when using the production version (dobrevaskevington.tplinkdns.com:40000)")
            return null
        }
    }

    static redirectForInstall(){
        let appURL = GithubService.getAppUrl()
        if(appURL != null) window.location.href = `${appURL}/installations/new`
    }

    static getInstallID(){
        return (new URLService).getUrlParam(URLParam.GITHUB_INSTALLATION_REDIRECT)
    }

    static async setInstallID(installID : string = this.getInstallID(), overrideNull : boolean = false){
        if(overrideNull || installID != null) {
            return new APIRequest<any, any>(APIEndpoint.GITHUB).execute(HTTPRequestMethod.CREATE, {installationID:installID})
        }
        return Promise.reject()
    }

    static REPO_CACHE_KEY = "REPOS"

    static async getAvailableRepos() : Promise<{name:string, owner:string, branches:{name:string, sha:string}[]}[]>{
        let cached = SessionStorageService.get(this.REPO_CACHE_KEY)
        if(cached != null) return JSON.parse(cached)
        let repos = await new APIRequest<any, any>(APIEndpoint.GITHUB).execute(HTTPRequestMethod.GET, null, (s)=>s)
        SessionStorageService.put(this.REPO_CACHE_KEY, JSON.stringify(repos))
        return repos
    }

}

export function useAvailableRepos(setLoading : (b:boolean)=>void){
    const [repos, setRepos] = useState<{name:string, owner:string, branches:{name:string, sha:string}[]}[]>(null)

    const org = useCurrentOrganisation(setLoading)

    useEffect(()=>{
        if(org != null && org.githubInstallationID != null) {
            setLoading(true)
            GithubService.getAvailableRepos()
                .then((r) => {
                    setRepos(r)
                })
                .catch(() => {
                    message.error("Github Repository Fetch Failed")
                })
                .finally(() => setLoading(false))
        }
    }, [org])
    return repos
}