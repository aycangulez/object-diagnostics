**Object Diagnostics** is a JavaScript library that automatically calls a diagnostics method on an object after any operation that could potentially change its state.

## Installation

```bash
npm install --save object-diagnostics
```

## Usage

```js
import { ObjectDiagnostics, assert } from 'ObjectDiagnostics';

const objectWithDiagnostics = new ObjectDiagnostics().addTo(myObj);
```

Using JavaScript proxies, **Object Diagnostics** intercepts all object method calls and property accesses, including modifications and deletions. It expects a public method named `diagnostics` to be defined on the object, which contains checks to validate the object's internal state. After each intercepted operation, this method is automatically invoked.

**Object Diagnostics** disables itself if NODE_ENV is available and set to 'production'. The library also includes an `assert` function that is similarly disabled in production.
