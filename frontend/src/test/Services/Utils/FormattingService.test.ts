import {describe, expect} from "@jest/globals";
import {FormattingService} from "../../../Services/Utils/FormattingService";

describe('FormattingService', ()=> {

    describe('Correct Cost Formatting', ()=> {

        it('Should return a number with no decimal when passed a whole number', ()=> {
            expect(FormattingService.asCost(10)).toBe("10")
        });

        it('Should return a number with two decimal points when passed a number with just one', ()=> {
            expect(FormattingService.asCost(10.1)).toBe("10.10")
        });
        it('Should return a number with two decimal points when passed a number with two', ()=> {
            expect(FormattingService.asCost(10.21)).toBe("10.21")
        });
        it('Should round a number with more than two decimal points', ()=> {
            expect(FormattingService.asCost(10.123)).toBe("10.12")
        });


    });
});