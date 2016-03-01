import * as Promise from 'bluebird';

export default class PromiseUtils {
    /**
     * Returns a promise that always resolves, either with the result of the given promise or with the error.
     * @returns {Promise<U | Error>}
     */
    static wrapSafe<T, U>(promise: Promise<T>, getResult: ((value: T) => U)): Promise<U | Error> {
        return new Promise<U | Error>(resolve => {
            promise
                .then(res => resolve(getResult(res)))
                .catch(err => resolve(err));
        });
    }
}
