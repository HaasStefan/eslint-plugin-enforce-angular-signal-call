# Enforce that Angular signals are called with the getter (`yourplugin/enforce-angular-signal-call`)

<!-- end auto-generated rule header -->

This rule enforces that Angular signals are called with the getter.

## Valid

```ts
const x = this.mySignal();
```

```ts
const x = computed(() => this.mySignal());
```

## Invalid

```ts
const x = this.mySignal;
```

```ts
const x = computed(() => this.mySignal);
```
