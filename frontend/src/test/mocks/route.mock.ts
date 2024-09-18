

export function cleanURL(url:string){
    let ret = url
    if(!url.endsWith("/")) ret += "/"
    if(!url.startsWith("/")) ret = "/" + ret
    return ret
}
export class route_mock{

    public url : string
    constructor(url : string, public method:string, public getResponse : (dataIn:any, urlParams:any)=>Response) {
        this.url = cleanURL(url)
    }




    public getUrlParams(url:string) : any{
        let params : any = {}
        let splitUrlRef = this.url.split("/")
        let splitUrl = url.split("/")
        
        for(let i = 0; i < splitUrlRef.length; i++){
            if(splitUrlRef[i].startsWith(":")){
                params[splitUrlRef[i].substring(1)] = splitUrl[i]
            }
        }
        return params
    }


}