auditval
========
The auditval module provides functions for creating auditable numeric types.

Usage
-----
Use the auditval.audited function to created an audited value from a numeric
type.

```js
// start with an initial value of 0
var auditval = require("auditval"),
   value = auditval.audited(0);

// make some adjustments
value.adjust("increasing value", new Date(), 3);
value.adjust("decreasing value", new Date(), -2);

// verify value
assert(value + 5 == 6);

// retrieve a log of all of the value adjustments
var audit_log = value.audit();
```
