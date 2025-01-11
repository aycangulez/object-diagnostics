// @ts-check

const isDev = (() => {
    const nodeEnv = typeof process !== 'undefined' ? process.env.NODE_ENV : '';
    const conditions = [() => nodeEnv !== 'production', () => import.meta.url.match('://localhost')];
    return !!conditions.find((cond) => cond());
})();

/**
 * Throws an exception if the condition is false and the environment is not production
 * @param {boolean} cond
 * @param {string} msg
 */
function assert(cond, msg = '') {
    if (isDev && !cond) {
        throw new Error(msg);
    }
}

/**
 * Creates a new diagnostics object
 * @returns {Object}
 */
function ObjectDiagnostics() {
    const proxiedObjs = new WeakSet();
    const that = this;

    /**
     * Returns true if a value is an object and hasn't already been proxied
     * @param {*} value
     * @returns boolean
     */
    const isNewObject = (value) => value !== null && typeof value === 'object' && !proxiedObjs.has(value);

    /**
     * Returns a proxied version of the input object with added diagnostics calls
     * @param {Object} objToProxy
     * @returns {Object}
     */
    this.addTo = function (objToProxy) {
        if (!isDev) {
            return objToProxy;
        }
        // Credit for recursive proxy handling: https://stackoverflow.com/a/40164194
        for (let i in objToProxy) {
            if (isNewObject(objToProxy[i])) {
                objToProxy[i] = this.addTo(objToProxy[i]);
            }
        }

        const proxiedObj = new Proxy(objToProxy, {
            construct(target, args) {
                const returnValue = Reflect.construct(target, args);
                returnValue.diagnostics();
                return returnValue;
            },
            defineProperty(target, prop, descriptor) {
                const returnValue = Reflect.defineProperty(target, prop, descriptor);
                target.diagnostics();
                return returnValue;
            },
            deleteProperty(target, prop) {
                const returnValue = Reflect.deleteProperty(target, prop);
                target.diagnostics();
                return returnValue;
            },
            get: function (target, prop, receiver) {
                const returnValue = Reflect.get(target, prop, receiver);
                if (typeof returnValue === 'function') {
                    // Credit: https://stackoverflow.com/a/56874340
                    return new Proxy(returnValue, {
                        apply: function (targetFunction, thisArg, argumentsList) {
                            const functionReturnValue = Reflect.apply(targetFunction, thisArg, argumentsList);
                            target.diagnostics();
                            return functionReturnValue;
                        },
                    });
                }
                target.diagnostics();
                return returnValue;
            },
            set: function (target, prop, value) {
                // Proxy nested objects
                if (isNewObject(value)) {
                    value = that.addTo(value);
                }
                const returnValue = Reflect.set(target, prop, value);
                target.diagnostics();
                return returnValue;
            },
        });
        proxiedObjs.add(proxiedObj);

        return proxiedObj;
    };

    return this;
}

export { assert, ObjectDiagnostics };
