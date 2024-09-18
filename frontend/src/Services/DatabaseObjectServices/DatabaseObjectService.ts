import {APIEndpoint, HTTPRequestMethod} from "../../API/APIEndpoint"
import {APIRequest} from "../../API/APIRequest"
import {DatabaseObject} from "../../Models/DatabaseObjects/DatabaseObject"
import {ForeignKeyReference} from "../../Models/DatabaseObjects/ForeignKeyReference";
import {SessionStorageService} from "../StorageServices/SessionStorageService";

export abstract class DatabaseObjectService<T extends DatabaseObject<T>>{


    public readonly RE_FETCH_TIME = 1000 * 60 * 10

    private autoUpdaterScheduler : NodeJS.Timer = null




    //Start the auto cache updater
    private startCacheUpdater(){
        const updater = async ()=>{
            for (let key of this.getCached()) {
                try {
                    let obj = await this.get(key, false)
                    await this.cache(obj)
                }
                catch(e){}
            }
        }
        this.autoUpdaterScheduler = setInterval(updater, this.RE_FETCH_TIME)
    }

    //Stop the auto cache updater
    private stopCacheUpdater(){
        if(this.autoUpdaterScheduler != null){
            clearInterval(this.autoUpdaterScheduler)
            this.autoUpdaterScheduler = null
        }        
    }

    /**
     * Construct a new session observer
     * @param endpoint The APIEndpoint to make requests to
     * @param responseDeserialiser A function which converts a json string into type T
     * @param cacheDeserialiser Deserialiser to use for getting this object from the cache
     * @param typeName The type of this db object service
     */
    protected constructor(private endpoint : APIEndpoint, private responseDeserialiser : (s:string)=>T, private cacheDeserialiser : (s:string)=>T, private typeName : string){
    }

    /**
     * Gets an object
     * @param id Id of the object to get
     * @param fromCache If the object should be obtained from the cache if it is available there
     * @returns The object, or null in case of error
     */
    public async get(id : string, fromCache=true) : Promise<T>{
        
        let cached = await this.getFromCache(id)
        if(cached == null || !fromCache){
            try{
                let ret = await new APIRequest<T, T>(this.endpoint, id).execute(HTTPRequestMethod.GET, null, this.responseDeserialiser)
                this.cache(ret)
                return ret
            }
            catch(e){
                throw e
            }
        }
        else{
            
        }
        return cached
    }

    /**
     * Inject items into this observer's cache
     * @param items The items to inject
     */
    public inject(items : T[]){
        items.forEach((item : T) =>
            this.cache(item)
        )
    }

    /**
     * Create an object
     * @param obj The object to create
     * @returns The object created
     */
    public async create(obj : T) : Promise<T>{
        
        try{
            let ret = await new APIRequest<T, T>(this.endpoint).execute(HTTPRequestMethod.CREATE, obj, this.responseDeserialiser)
            await this.cache(ret)
            return ret
        }catch(e){
            throw e
        }
    }


    /**
     * Updates an object
     * @returns The object updated
     * @param newObj The new object
     * @param updateEndpoint The endpoint to send the update to
     * @param value The value of the new field
     * @param method The method to use for the update
     * @param withID If the update should use the id of the object to formulate the URL
     */
    public async update(newObj : T, updateEndpoint : string, value : any, method : HTTPRequestMethod.UPDATE_PATCH | HTTPRequestMethod.UPDATE_POST, withID:boolean = true) : Promise<T>{

        let id
        if(withID) id = newObj.getID()
        else id = ""

        
        try {
            await new APIRequest<any, any>(this.endpoint, id)
                .execute(method, value, null, {endpoint:updateEndpoint})
            await this.cache(newObj)
            return newObj
        }catch(e){
            throw e
        }
    }

    /**
     * Get multiple objects
     * @param objs A list of the objects to fetch
     * @param fromCache If the get should first check the cache
     */
    public async getMultiple(objs : T[] | ForeignKeyReference<T>[], fromCache : boolean = true) : Promise<T[]>{

        let ids : string[] = []
        objs.forEach((o :T | ForeignKeyReference<T>)=>{ids.push(o.getID())})
        
        let cached: T[] = []
        let uncached : string[] = []
        if(fromCache) {
            for(let id of ids){
                let fullObj = await this.getFromCache(id)
                if (fullObj == null) uncached.push(id)
                else cached.push(fullObj)
            }
            if (cached.length == objs.length) return cached
        }
        else uncached = ids

        let arrayDeserialiser = (obj : any)=>{
            let arr : any[] = obj[Object.keys(obj)[0]]
            let objects : T[] = []
            arr.forEach((j : any)=>{
                if(j != null) objects.push(this.responseDeserialiser(j))
            })
            return objects
        }

        try{
            let ret : T[] = await new APIRequest<any, any>(this.endpoint).execute(HTTPRequestMethod.GET_MULTIPLE, {ids:uncached}, arrayDeserialiser)
            for(let i = 0; i < ret.length; i++){
                await this.cache(ret[i])
            }
            return [...ret, ...cached]
        }
        catch(e){
            throw e
        }
    }


    /**
     * Deletes an object
     * @param obj The object to delete
     * @param withID If the delete should use the object ID to formulate the URL
     * @param method The method to use for delete
     * @returns The object deleted
     */
    public async delete(obj : T, withID : boolean = true, method : HTTPRequestMethod.DELETE | HTTPRequestMethod.DELETE_POST) : Promise<T>{
        
        let executeID = ""
        if(withID) executeID = obj.getID()
        try{
            let ret = await new APIRequest<T, T>(this.endpoint, executeID).execute(method, obj, this.responseDeserialiser)
            this.uncache(obj)
            return ret
        }catch(e){
            throw e
        }
    }

    /**
     * Start a session
     */
    public startSession(){
        this.startCacheUpdater()
    }

    /**
     * End a session
     */
    public endSession(){
        this.stopCacheUpdater()
    }

    /**
     * Change the id into a storage key
     * @param id The id to keyify
     */
    public keyify(id : string){
        return this.typeName + "-" + id
    }

    /**
     * Change a storage key into an id
     * @param key The key to idify
     */
    public idify(key : string){
        return key.substring(this.keyify("").length)
    }

    /**
     * Cache an object
     * @param obj The object to cache
     */
    public async cache(obj : T){
        
        SessionStorageService.put(this.keyify(obj.getID()), JSON.stringify(obj))
    }

    /**
     * Get an item from the cache
     * @param id The id of the item to retrieve
     */
    public async getFromCache(id : string){
        try {
            
            let cached = SessionStorageService.get(this.keyify(id))
            if (cached == null) return null
            
            return this.cacheDeserialiser(JSON.parse(cached))
        }
        catch(e){
            
            throw e
        }
    }

    /**
     * Decache an object
     * @param obj The object to decache
     * @returns obj
     */
    public async uncache(obj : T){
        SessionStorageService.delete(this.keyify(obj.getID()))
        return obj
    }

    /**
     * Get a list of all the objects stored in cache
     */
    public getCached(){
        return SessionStorageService.getAllStartingWith(this.keyify("")).map((key)=>this.idify(key))
    }


}