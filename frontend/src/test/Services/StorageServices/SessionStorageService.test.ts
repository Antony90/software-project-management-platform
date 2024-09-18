import {describe, expect} from '@jest/globals';
import {SessionStorageService} from "../../../Services/StorageServices/SessionStorageService";

describe('SessionStorageService', ()=> {


    beforeEach(()=>{
        SessionStorageService.clear()
    })


    describe('Correct put', ()=> {

        it('Should put a key to session storage without error', ()=>{
            expect(()=>SessionStorageService.put("Key1", "Value1")).not.toThrowError()
        });

    });

    describe('Correct get', ()=>{
        it('Should fetch the correct value from local storage', ()=>{
            SessionStorageService.put("Key1", "Value1")
            expect(SessionStorageService.get("Key1")).toEqual("Value1")
        });

        it('Should return null if no key exists', ()=>{
            expect(SessionStorageService.get("Key2")).toEqual(null)
        });

        it('Should get all the keys correctly', ()=>{
            SessionStorageService.put("Key3", "Value3")
            SessionStorageService.put("Key4", "Value4")
            expect(SessionStorageService.getAllKeys()).toEqual(["Key3", "Key4"])
        })
        it('Should get all the keys starting with a specific value correctly', ()=>{
            SessionStorageService.put("Key5", "Value5")
            SessionStorageService.put("NewKey5", "NewValue5")
            expect(SessionStorageService.getAllStartingWith("New")).toEqual(["NewKey5"])
        })
    })

    describe('Correct delete', ()=> {

        it('Should delete a key from the storage correctly', ()=>{
            SessionStorageService.put("Key1", "Value1")
            SessionStorageService.delete("Key1")
            expect(SessionStorageService.get("Key1")).toEqual(null)
        });

        it('Should clear the storage correctly', ()=>{
            SessionStorageService.put("Key1", "Value1")
            SessionStorageService.clear()
            expect(SessionStorageService.get("Key1")).toEqual(null)
        });
    });
});
