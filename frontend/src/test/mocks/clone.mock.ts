export function clone(obj : any){
    return JSON.parse(JSON.stringify(obj))
}

export function cloneWithout(obj : any, ...fields:string[]){
    let c = clone(obj)
    fields.forEach((f)=>delete c[f])
    return c
}

export function cloneNoFKR(obj : any){
    let c = clone(obj)
    Object.keys(c).forEach((k)=>{
        try{
            c[k].getID()
            c[k] = c[k].getID()
        }
        catch(e){

        }
    })
    return c
}

export function toMatchDatabaseObjects(objActual : any[], objExpected : any[]){
    let message = ""
    let pass = true
    try{
        expect(objActual.length).toEqual(objExpected.length)
        for(let i = 0; i < objExpected.length; i++){
            expect(cloneNoFKR(objActual[i])).toMatchObject(objExpected[i])
        }
    }
    catch(e){
        message = e.message
        pass = false
    }
    return {
        message:()=>message,
        pass
    }
}
export function toMatchDatabaseObject(objActual : any, objExpected : any){
    let message = ""
    let pass = true
    try{
        expect(cloneNoFKR(objActual)).toMatchObject(objExpected)
    }
    catch(e){
        message = e.message
        pass = false
    }
    return {
        message:()=>message,
        pass
    }
}
