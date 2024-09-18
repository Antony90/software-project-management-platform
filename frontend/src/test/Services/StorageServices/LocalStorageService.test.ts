import {describe, expect} from '@jest/globals';
import {LocalStorageService} from "../../../Services/StorageServices/LocalStorageService";

describe('LocalStorageService', ()=> {


    beforeEach(()=>{
        LocalStorageService.clear()
    })

    describe('Correct put and get', ()=> {

        it('Should put a key to local storage without error', ()=>{
            expect(()=>LocalStorageService.set("Key1", "Value1")).not.toThrowError()
        });

        it('Should fetch the correct value from local storage', ()=>{
            LocalStorageService.set("Key1", "Value1")
            expect(LocalStorageService.get("Key1")).toEqual("Value1")
        });

        it('Should return null if no key exists', ()=>{
            expect(LocalStorageService.get("Key2")).toEqual(null)
        });
    });

    describe('Correct delete', ()=> {

        it('Should delete a key from the storage correctly', ()=>{
            LocalStorageService.set("Key1", "Value1")
            LocalStorageService.delete("Key1")
            expect(LocalStorageService.get("Key1")).toEqual(null)
        });

        it('Should clear the storage correctly', ()=>{
            LocalStorageService.set("Key1", "Value1")
            LocalStorageService.clear()
            expect(LocalStorageService.get("Key1")).toEqual(null)
        });
    });
});
