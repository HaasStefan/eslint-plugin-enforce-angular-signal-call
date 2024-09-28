# `enforce-angular-signal-call`

An eslint plugin which enforces that Angular signals are called with the getter.

## Rules 

<!-- begin auto-generated rules list -->

| Name                                                                     | Description                                             |
| :----------------------------------------------------------------------- | :------------------------------------------------------ |
| [enforce-angular-signal-call](docs/rules/enforce-angular-signal-call.md) | Enforce that Angular signals are called with the getter |

<!-- end auto-generated rules list -->


## Example

```ts

const mySignal = signal(false);

console.log(mySignal); // ⚠️

console.log(mySignal()); // ✅

if (mySignal) { // ⚠️
  console.log('mySignal is truthy');
}

if (mySignal()) { // ✅
  console.log('mySignal() is truthy');
}
```


## Installation

```npm install --save-dev eslint-plugin-angular-signal-call```

## Usage

Add `angular-signal-call` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json
{
    "plugins": [
        "enforce-angular-signal-call"
    ]
}
```

Then configure the rules you want to use under the rules section.

```json
{
    "rules": {
        "enforce-angular-signal-call/enforce-angular-signal-call": "warn"
    }
}
```
