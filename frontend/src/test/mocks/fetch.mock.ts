import {routes_mock} from "./routes.mock";
import {ResponseMock} from "./response.mock";
import {req_method} from "./req_method";
import {cleanURL} from "./route.mock";


export class RESPONSE_CODES {
    static OK = {status: 200, statusText: "OK"}
    static NOT_FOUND = {status: 404, statusText: "Not Found"}

    static BAD_REQUEST = {status: 400, statusText: "Bad Request"}

    static UNAUTHORISED = {status: 401, statusText: "Unauthorized"}
}


export async function fetch_mock(_url : string, init : any) : Promise<Response> {


    let url = cleanURL(_url.replace(process.env.REACT_APP_BACKEND_URL, ""))

    let route = routes_mock.getRoute(url, init.method == null ? req_method.GET : init.method)
    if (route == null) return new ResponseMock({message : "API Endpoint Not Found"}, RESPONSE_CODES.NOT_FOUND)

    let body = {}
    try{
       body = init.body == null ? null : JSON.parse(init.body)
    }
    catch(e){

    }

    return Promise.resolve(route.getResponse(body, route.getUrlParams(url)))

}