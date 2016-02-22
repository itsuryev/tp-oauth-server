export default class Result<T> {
    constructor(public error: string, public value: T) {

    }

    static createError<T>(message: string): Result<T> {
        return new Result(message, null);
    }

    static createValue<T>(value: T): Result<T> {
        return new Result(null, value);
    }
}
