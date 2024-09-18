import 'isomorphic-fetch'

export class ResponseMock extends Response{


    constructor(returnObj : any, returnStatus:{status:number, statusText:string}) {
        super(JSON.stringify(returnObj), returnStatus);
    }


}