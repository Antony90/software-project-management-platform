declare module 'expect' {
    interface AsymmetricMatchers {
        toMatchDatabaseObject(objExpected : any): void;
    }
    interface Matchers<R> {
        toMatchDatabaseObject(objExpected : any): R;
    }

    interface AsymmetricMatchers {
        toMatchDatabaseObjects(objExpected : any[]): void;
    }
    interface Matchers<R> {
        toMatchDatabaseObjects(objExpected : any[]): R;
    }
}
export {}