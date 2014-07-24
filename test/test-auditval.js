var auditval = require("../auditval.js"),
    expect = require("expect.js");

describe("AuditedValue", function() {
    it("should be constructed with 'audited'", function() {
        expect(auditval.AuditedValue.isPrototypeOf(auditval.audited(4))).to.be.ok();
    });

    it("should be deserialized with 'unaudited'", function() {
        expect(auditval.AuditedValue.isPrototypeOf(auditval.unaudited(5, []))).to.be.ok();
    });

    it("should reject non-numeric values", function() {
        expect(auditval.audited).withArgs("asd").to.throwError();
    });

    it("should evaluate to the value when evaluated as a primitive", function() {
        expect(auditval.audited(42) - 40).to.be(2);
    });

    describe("#adjust", function() {
        var value = auditval.audited(23);
        value.adjust("found the answer", new Date(), 42);
        value.adjust("assume control", new Date(), 2112);

        it("should adjust the evaluated value", function() {
            expect(value + 0).to.be(23 + 42 + 2112);
        });

        it("should be tracked in the audit log", function() {
            var audit = value.audit();
            
            expect(audit).to.have.length(3);
            expect(audit[0].balance).to.be(23);
            expect(audit[1].balance).to.be(23 + 42);
            expect(audit[2].balance).to.be(23 + 42 + 2112);
        });

        it("should return the adjusted value", function() {
            expect(value.adjust("string reference", new Date(), -13)).to.be(23+42+2112-13);
        });
    });

    describe("#audit", function() {
        it("should succeed for new audited value", function() {
            var value = auditval.audited(34);
            expect(value.audit.bind(value)).to.be.ok();            
        });

        it("should succeed for audited value after arbitrary adjustments (within IEEE reason)", function() {
            var value = auditval.audited(34);
            value.adjust("blah", new Date(), 1.23);
            value.adjust("blah", new Date(), 3451.23);
            value.adjust("blah", new Date(), -1234234.23);
            value.adjust("blah", new Date(), 1.23);
            value.adjust("blah", new Date(), 1.2243523);
            value.adjust("blah", new Date(), -1231.23);
            value.adjust("blah", new Date(), 2243543.23);
            value.adjust("blah", new Date(), 12.23);
            value.adjust("blah", new Date(), 0.23);
            expect(value.audit.bind(value)).to.be.ok();
        });

        it("should fail for unaudited value which was created with bad log history", function() {
            var value = auditval.unaudited(10, []);     // empty/missing log history
            expect(value.audit.bind(value)).to.throwError(auditval.AuditError);
        });

        it("should succeed for unaudited value which was created with good log history", function() {
            var value = auditval.unaudited(10, [
                {ref:"foo", date: new Date(), value: 4},
                {ref:"foo", date: new Date(), value: 6}
            ]);
            expect(value.audit.bind(value)).to.be.ok();
        });
    });
});