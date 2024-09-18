import {describe, expect} from "@jest/globals";
import {Utils} from "../../../Services/Utils/Utils";

describe('Utils', ()=> {

    describe('Correct Pluralisation', ()=> {

        it('Should return the singular form with 1', ()=> {
            expect(Utils.pluralise(1, "day", "days")).toEqual("day")
        });

        it('Should return the plural form with >1', ()=> {
            expect(Utils.pluralise(2, "day", "days")).toEqual("days")
        });

        it('Should return the plural form with 0', ()=> {
            expect(Utils.pluralise(0, "day", "days")).toEqual("days")
        });
    });

    describe('Correct changes identification', ()=>{
        it('Should identify removals', ()=>{
            expect(Utils.hasChanges([1,2,3], [1,2])).toBeTruthy()
        })

        it('Should identify additions', ()=>{
            expect(Utils.hasChanges([1,2,3], [1,2,3,4])).toBeTruthy()
        })

        it('Should identify when there are no changes', ()=>{
            expect(Utils.hasChanges([1,2,3], [1,2,3])).toBeFalsy()
        })
        it('Should disregard order', ()=>{
            expect(Utils.hasChanges([1,2,3], [1,3,2])).toBeFalsy()
        })
    })


    describe('Correct addition/removal identification', ()=>{
        it('Should identify removals', ()=>{
            expect(Utils.findRemovals([1,2,3], [1,2])).toEqual([3])
        })
        it('Should identify additions', ()=>{
            expect(Utils.findAdditions([1,2,3], [1,2,3,4])).toEqual([4])
        })
    })

    describe('Correct element removal', ()=>{
        it('Should remove normal elements', ()=>{
            let arr = [1,2,3]
            expect(Utils.removeElements(arr, [2,3])).toBeTruthy()
            expect(arr).toEqual([1])
        })
    })
});