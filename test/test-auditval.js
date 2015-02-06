var auditval = require("../auditval.js"),
    expect = require("expect.js");

describe("AuditedValue", function() {
    it("should be constructed with 'audited'", function() {
        expect(auditval.AuditedValue.isPrototypeOf(auditval.audited()))
            .to.be.ok();
        expect(auditval.AuditedValue.isPrototypeOf(auditval.audited(4)))
            .to.be.ok();
    });

    it("should be deserialized with 'unaudited'", function() {
        expect(auditval.AuditedValue.isPrototypeOf(auditval.unaudited(5, [])))
            .to.be.ok();
    });

    it("should reject non-numeric values", function() {
        expect(auditval.audited).withArgs("asd").to.throwError();
    });

    it("should evaluate to value when used as a primitive", function() {
        expect(auditval.audited(42) - 40).to.be(2);
    });

    describe(".adjust(*, Date, number)", function() {
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
            expect(value.adjust("string reference", new Date(), -13))
                .to.be(23+42+2112-13);
        });
    });

    describe(".adjust(*, number)", function() {
        var value = auditval.audited();
        value.adjust("increasing by 1,000", 1000);
        
        it("should use the current date if none is provided", function() {
            var audit = value.audit();
            
            expect(audit).to.have.length(1);
            expect(audit[0].date).to.be.a(Date);
        });
    });

    describe(".audit()", function() {
        it("should succeed for new audited value", function() {
            var value = auditval.audited(34);
            expect(value.audit.bind(value)).to.be.ok();            
        });

        it("should succeed after adjustments within IEEE reason", function() {
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

        it("should fail when unaudited has bad log history", function() {
            var value = auditval.unaudited(10, []);
            expect(value.audit.bind(value)).to.throwError(auditval.AuditError);
        });

        it("should succeed when unaudited has good log history", function() {
            var value = auditval.unaudited(10, [
                {ref:"foo", date: new Date(), value: 4},
                {ref:"foo", date: new Date(), value: 6}
            ]);
            expect(value.audit.bind(value)).to.be.ok();
        });
    });

    describe("#verifyRef(*)", function() {
        it("should test for non-empty string by default", function() {
            expect(auditval.AuditedValue.verifyRef("asdf")).to.be(true);
            expect(auditval.AuditedValue.verifyRef("")).to.be(false);
            expect(auditval.AuditedValue.verifyRef(13)).to.be(false);
            expect(auditval.AuditedValue.verifyRef({})).to.be(false);
            expect(auditval.AuditedValue.verifyRef(null)).to.be(false);
        });

        it("should trigger Errors when making adjustments", function() {
            var value = auditval.audited(),
                adjust = value.adjust.bind(value);

            expect(adjust).withArgs(null, 3).to.throwError();
            expect(adjust).withArgs("", 3).to.throwError();
            expect(adjust).withArgs("foo", 3).to.not.throwError();
        });

        it("should be possible to swap verifyRef behavior", function() {
            var origVerifyRef = auditval.AuditedValue.verifyRef,
                value = auditval.audited(),
                adjust = value.adjust.bind(value);
            
            auditval.AuditedValue.verifyRef = function(ref) {
                return typeof ref === "number";
            };

            expect(adjust).withArgs("foo", 4).to.throwError();
            expect(adjust).withArgs(23, 4).to.not.throwError();

            auditval.AuditedValue.verifyRef = origVerifyRef;
        });
    });
});
