/**
 * @class AuditError
 */
function AuditError(message) {
    this.name = "AuditError";
    this.message = message || "audit failed; value cannot be accounted for";
}

AuditError.prototype = new Error();
AuditError.prototype.constructor = AuditError;

/**
 * Prototype for an audited value.
 */
var AuditedValue = {
    value: 0,
    adjusts: [],

    /**
     * When evaluated as a primitive, return the value.
     * @return {number}
     */
    valueOf: function() {
        return this.value();
    },

    /**
     * Verify audit reference.
     * @return {boolean}
     */
    verifyRef: function(ref) {
        return ref && typeof ref === "string";
    }
};

/**
 * Private constructor.
 */
function create(value, adjusts) {
    // validate initial value
    if (typeof value !== "number")
        throw new Error("invalid argument; expected number");

    var auditedValue = Object.create(AuditedValue);
    
    /**
     * Return the current value.
     * @return {number}
     */
    auditedValue.value = function() {
        return value;
    };

    /**
     * Make an adjustment to the value.  Return the value after the adjustment.
     * @param {*} ref
     * @param {Date} [when]
     * @param {number} adjustment
     * @return {number}
     */
    auditedValue.adjust = function(ref, when, adjustment) {
        if (arguments.length < 3)
            adjustment = when, when = new Date();

        if (!this.verifyRef(ref))
            throw new AuditError("bad reference");

        if (typeof adjustment !== "number")
            throw new Error("invalid argument; expected number");

        adjusts.push({ref: ref, date: new Date(when.getTime()), value: adjustment});
        value += adjustment;
        return value;
    };

    /**
     * Return audit trail.
     * @return {array}
     */
    auditedValue.audit = function() {
        var audit = [],
            adjustment,
            balance = 0;
        for (var i in adjusts) {
            adjustment = adjusts[i];
            audit.push({
                entry: parseInt(i) + 1,
                ref: adjustment.ref,
                forward: balance,
                adjustment: adjustment.value,
                balance: balance + adjustment.value,
                date: adjustment.date
            });
            balance += adjustment.value;
        }

        if (balance != value) throw new AuditError();
        return audit;
    };

    return auditedValue;
}

/**
 * Create an audited value.
 * @param {number} [value]
 */
function audited(value) {
    var val = create(0, []);
    if (arguments.length > 0)
        val.adjust("initial value", new Date(), value);
    return val;
}

/**
 * Create an audited value with an unaudited adjustment history.
 * @param {number} value
 * @param {array} adjusts
 */
function unaudited(value, adjusts) {
    return create(value, adjusts);
}

/**
 * Export classes and factories.
 */
module.exports = {
    AuditError: AuditError,
    AuditedValue: AuditedValue,
    audited: audited,
    unaudited: unaudited
};
