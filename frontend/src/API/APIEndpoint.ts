/**
 * HTTP Request Method to use for a certain endpoint
 */
export enum HTTPRequestMethod{
    CREATE = "CREATE",
    UPDATE_POST = "UPDATE_POST",
    
    GET = "GET",
    DELETE_POST = "DELETE_POST",
    DEFAULT = "DEFAULT",

    GET_MULTIPLE = "GET_MULTIPLE",

    UPDATE_PATCH = "UPDATE_PATCH",

    DELETE = "DELETE"


}

const HTTPRequestMethodToRequestType = new Map<HTTPRequestMethod, string>(
    [
        [HTTPRequestMethod.CREATE, "POST"],
        [HTTPRequestMethod.GET, "GET"],
        [HTTPRequestMethod.UPDATE_POST, "POST"],
        [HTTPRequestMethod.DELETE_POST, "POST"],
        [HTTPRequestMethod.GET_MULTIPLE, "POST"],
        [HTTPRequestMethod.UPDATE_PATCH, "PATCH"],
        [HTTPRequestMethod.DELETE, "DELETE"]
    ]
)



export class APIEndpoint {

    create?: string //Create endpoint
    update?: string//Update endpoint
    get?: string //Get endpoint
    delete?: string //Delete endpoint

    getMultiple?: string //Get multiple endpoint


    /**
     * Create APIEndpoint
     * @param get The URL to use for getting objects from this endpoint
     * @param create The URL to use for creating objects on this endpoint
     * @param update The URL to use for updating objects on this endpoint
     * @param del The URL to use for deleting objects on this endpoint
     * @param getMultiple The URL to use for getting an array of objects on this endpoint
     */
    constructor(get?: string, create?: string, update?: string, del?: string, getMultiple?: string) {
        this.delete = del
        this.create = create
        this.update = update
        this.get = get
        this.getMultiple = getMultiple
    }

    /**
     * Convert an HTTP method to an endpoint
     * @param method The HTTP method
     * @param args Arguments for the endpoint
     * @param id ID of the object to send
     * @returns A string representing the url for the endpoint
     */
    private httpMethodToEndpoint(method: HTTPRequestMethod, args: any, id: string): string {
        switch (method) {
            case HTTPRequestMethod.CREATE:
                return this.create + id
            case HTTPRequestMethod.UPDATE_POST:
            case HTTPRequestMethod.UPDATE_PATCH: {
                let addText = ""
                if (args != null && args.endpoint != null) addText = args.endpoint
                return this.update + id + addText
            }
            case HTTPRequestMethod.GET:
                return this.get + id
            case HTTPRequestMethod.DELETE_POST:
                return this.delete + id
            case HTTPRequestMethod.GET_MULTIPLE:
                return this.getMultiple + id
            case HTTPRequestMethod.DELETE:
                return this.delete
        }
    }


    /**
     * Get the default HTTP request method for this endpoint
     */
    private getDefaultHTTPRequestMethod(): HTTPRequestMethod {
        if (this.get != null) return HTTPRequestMethod.GET
        if (this.create != null) return HTTPRequestMethod.CREATE
        if (this.update != null) {
            return HTTPRequestMethod.UPDATE_POST
        }
        if (this.delete != null) {
            return HTTPRequestMethod.DELETE_POST
        }
        if (this.getMultiple != null) return HTTPRequestMethod.GET_MULTIPLE
        throw new Error("All endpoints are null")
    }

    /**
     * Get the associated method for this endpoint
     * @param method The method to check
     * @returns The method, or the default method if method is HTTPRequestMethod.DEFAULT
     */
    private getMethod(method: HTTPRequestMethod): HTTPRequestMethod {
        if (method == HTTPRequestMethod.DEFAULT) {
            return this.getDefaultHTTPRequestMethod()
        }
        return method
    }

    /**
     * Get the full URL for this request
     * @param baseURL The base url
     * @param method The HTTP Request Method to use
     * @param args Arguments for the endpoint
     * @param id ID of the object to send
     * @returns An url to make a request to
     */
    private getURL(baseURL: string, method: HTTPRequestMethod, args: any, id: string): string {
        return baseURL + this.httpMethodToEndpoint(method, args, id)
    }

    /**
     * Send a fetch request to this endpoint
     * @param baseURL The base URL of the server
     * @param method The HTTPRequestMethod to use to send the data
     * @param id The id of the object to get, or ""
     * @param data The data (if any) to send
     * @param args Arguments for the endpoint
     * @returns A response from the fetch request
     */
    public async send(baseURL: string, method: HTTPRequestMethod, id: string, data: string, args: any = null): Promise<Response> {
        let mMethod = this.getMethod(method)
        
        let url = this.getURL(baseURL, mMethod, args, id)
        
        if (mMethod == HTTPRequestMethod.GET) {
            return fetch(url, {
                credentials: 'include'
            })
        } else {
            
            return fetch(url, {
                credentials: 'include',
                method: HTTPRequestMethodToRequestType.get(mMethod),
                headers: {
                    'Content-Type': 'application/json',
                },
                body: data
            })
        }
    }


    static USER = new APIEndpoint("/user/", "/auth/register/", "/user", "/user/", "/user/populate/")
    static AUTHORISATION = new APIEndpoint("/user/", "/auth/login/", null, "/auth/logout/")
    static PROJECT = new APIEndpoint("/project/", "/project/", "/project/", "/project/delete/", "/project/populate/")
    static ORGANISATION = new APIEndpoint("/org/", "/org/create")
    static JOIN_ORG = new APIEndpoint(null, "/org/join/", null, "/org/leave/")
    static JOIN_KICK = new APIEndpoint(null, null, null, "/org/remove/")
    static TASK = new APIEndpoint("/task/", "/task/create/", "/task/update/", "/task/delete/")

    static GITHUB = new APIEndpoint("/org/github/repos", "/org/github/connect/")
}