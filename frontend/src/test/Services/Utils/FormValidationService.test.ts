import {describe, expect} from "@jest/globals";
import {FormValidationService} from "../../../Services/Utils/FormValidationService";

describe('FormValidationService', ()=> {

    describe('Correct Number Validation', ()=> {

        it('Should allow a whole number to be input', async ()=> {
            await expect(FormValidationService.isNumberValidator("10"))
                .resolves.toEqual(10)
        });

        it('Should not allow letters to be input', async ()=> {
            await expect(FormValidationService.isNumberValidator("abc123"))
                .rejects.toEqual(undefined)
        });

        it('Should not allow special characters to be input', async ()=> {
            await expect(FormValidationService.isNumberValidator("!£$123"))
                .rejects.toEqual(undefined)
        });
    });

    describe('Correct Cost Validation', ()=> {

        it('Should allow a whole number to be input', async ()=> {
            await expect(FormValidationService.isCostValidator(null, "10"))
                .resolves.toEqual(10)
        });

        it('Should allow a decimal number to be input', async ()=> {
            await expect(FormValidationService.isCostValidator(null, "10.01"))
                .resolves.toEqual(10.01)
        });

        it('Should not allow more than 2 decimal places to be input', async ()=> {
            await expect(FormValidationService.isCostValidator(null, "10.011"))
                .rejects.toEqual(undefined)
        });
        it('Should not allow letters to be input', async ()=> {
            await expect(FormValidationService.isCostValidator(null, "abc123"))
                .rejects.toEqual(undefined)
        });

        it('Should not allow special characters to be input', async ()=> {
            await expect(FormValidationService.isCostValidator(null, "!£$123"))
                .rejects.toEqual(undefined)
        });
    });


    describe('Correct Name Validation', ()=> {

        it('Should allow a correct name to be input', async ()=> {
            await expect(FormValidationService.nameValidator(null, "John"))
                .resolves.toEqual(undefined)
        });


        it('Should allow hyphenated names to be input', async ()=> {
            await expect(FormValidationService.nameValidator(null, "smith-jones"))
                .resolves.toEqual(undefined)
        });

        it('Should allow apostrophed names to be input', async ()=> {
            await expect(FormValidationService.nameValidator(null, "O'Sullivan"))
                .resolves.toEqual(undefined)
        });

        it('Should not allow numbers to be input', async ()=> {
            await expect(FormValidationService.nameValidator(null, "abc123"))
                .rejects.toEqual(undefined)
        });

        it('Should not allow special characters to be input', async ()=> {
            await expect(FormValidationService.nameValidator(null, "abc!£$"))
                .rejects.toEqual(undefined)
        });

    });

    describe('Correct Password Format Validation', ()=> {

        it('Should allow a password longer than 5 characters', async ()=> {
            await expect(FormValidationService.passwordFormatValidator(null, "Password1"))
                .resolves.toEqual(undefined)
        });

        it('Should reject a password shorter than 5 characters', async ()=> {
            await expect(FormValidationService.passwordFormatValidator(null, "Pas1"))
                .rejects.toEqual(undefined)
        });
    });

    describe('Correct Password Repeat Validation', ()=> {

        it('Should allow two equal passwords', async ()=> {
            await expect(FormValidationService.passwordRepeatValidator(null, "Password1", "Password1"))
                .resolves.toEqual(undefined)
        });

        it('Should reject two unequal passwords', async ()=> {
            await expect(FormValidationService.passwordRepeatValidator(null, "Password1", "Password2"))
                .rejects.toEqual(undefined)
        });
    });

    describe('Correct Email Validation', ()=> {
        var illegalEmails = [
            "@mail.com",
            "name@.com",
            "name.com",
            "namedomain.com",
            "name@domain.",
            "name@domain",
            "A@b@c@example.com",
            "just\"not\"right@example.com",
            "i_like_underscore@but_its_not_allowed_in_this_part.example.com",
        ]

        var legalEmails = [
            "Aa!Bb#CDEFGHIJKLMNOPQRSTUVWXYZ@abcdefghijklmnopqrstuvwxyz.com",
            "c%e&f'g*h+ni-j/k=l?m^n_o`p{q|r}s~tuvwxyz@domain.com",
            "\".John.Doe\"@example.com",
            "\"Jo hn.Doe.\"@example.com",
            "\"John..Doe\"@example.com",
            "\"john\\\\doe\"@example.com",
            "\"john\\\"doe\"@example.com",
            "\" \"@example.org",
            "\"very.(),:;<>[]\\\".VERY.\\\"very@\\\\ \\\"very\\\".unusual\"@strange.example.com",
            "j.d+123@r.com",
            "user.name+tag+sorting@example.com",
            "test/test@test.com",
            "very.common@example.com",
            "other.email-with-hyphen@example.com",
            "jsmith@[192.168.2.1]",
        ]

        it('Should allow legal emails', async ()=> {
            for(let legalEmail of legalEmails){
                await expect(FormValidationService.emailValidator(null, legalEmail))
                    .resolves.toEqual(undefined)
            }

        });

        it('Should reject illegal emails', async ()=> {
            for(let illegalEmail of illegalEmails){
                await expect(FormValidationService.emailValidator(null, illegalEmail))
                    .rejects.toEqual(undefined)
            }
        });
    });
});