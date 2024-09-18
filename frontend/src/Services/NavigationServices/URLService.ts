/**
 * Deals with URLs
 */
export class URLService{

    private urlSearchParams : URLSearchParams
    private location : Location

    /**
     * Make a new URL service with the current url
     */
    constructor(){
        this.location = window.location
        this.urlSearchParams = new URLSearchParams(this.location.search)
    }

    /**
     * Get a parameter from the url
     * @param param The parameter to get
     * @returns The value of the parameter
     */
    public getUrlParam(param : URLParam) : string{
        return this.urlSearchParams.get(param)
    }


    /**
     * Remove a param from the url
     * @param param The parameter to remove
     */
    public removeUrlParams(param : URLParam){
        this.urlSearchParams.delete(param)
        window.history.replaceState({}, document.title, "/?" + this.urlSearchParams.toString());
    }

    /**
     * Get the current URL without parameters
     * @returns The url in the search bar without parameters
     */
    public getCurrentBaseUrl(){
        return this.location.origin
    }

}

/**
 * URL Parameters
 */
export enum URLParam{
    JOIN_ORGANISATION = "join_an_organisation",
    REFRESH_REASON = "refresh",

    GITHUB_INSTALLATION_REDIRECT = "installation_id",

    GITHUB_SETUP_ACTION = "setup_action",
    GITHUB_CODE = "code"
}