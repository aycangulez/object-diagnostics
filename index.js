// @ts-check

/**
 * Creates a new diagnostics object
 * @param {{addDiagnostics?: Boolean}} options
 * @returns {Object}
 */
function ObjectDiagnostics(options = {}) {
    const proxiedObjs = new WeakSet();
    const that = this;

    /**
     * Decides whether diagnostic calls should be added
     * @returns Boolean
     */
    const shouldAddDiagnostics = () => {
        const conditions = [
            () => process && process.env.NODE_ENV !== 'production',
            () => import.meta.url.match('://localhost'),
        ];
        return !!conditions.find((cond) => cond());
    };

    /**
     * Returns a proxied version of the input object with added diagnostics calls
     * @param {Object} objToProxy
     * @returns {Object}
     */
    this.add = function (objToProxy) {
        if (options.addDiagnostics === false || !shouldAddDiagnostics()) {
            return objToProxy;
        }
        // Credit for recursive proxy handling: https://stackoverflow.com/a/40164194
        for (let i in objToProxy) {
            let subObj = objToProxy[i];
            if (subObj !== null && typeof subObj === 'object' && !proxiedObjs.has(subObj)) {
                objToProxy[i] = this.add(subObj);
            }
        }

        const proxiedObj = new Proxy(objToProxy, {
            construct(target, args) {
                const returnValue = Reflect.construct(target, args);
                returnValue.diagnostics();
                return returnValue;
            },
            defineProperty(target, prop, descriptor) {
                target.diagnostics();
                const returnValue = Reflect.defineProperty(target, prop, descriptor);
                target.diagnostics();
                return returnValue;
            },
            deleteProperty(target, prop) {
                target.diagnostics();
                const returnValue = Reflect.deleteProperty(target, prop);
                target.diagnostics();
                return returnValue;
            },
            get: function (target, prop, receiver) {
                target.diagnostics();
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
                return returnValue;
            },
            set: function (target, prop, value) {
                target.diagnostics();
                // Proxy nested objects
                if (value !== null && typeof value === 'object' && !proxiedObjs.has(value)) {
                    value = that.add(value);
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

export default ObjectDiagnostics;
