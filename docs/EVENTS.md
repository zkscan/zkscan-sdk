# Client Events

The `ZKScanClient` can emit lightweight events via the `onEvent`
callback configured in `ZKScanConfig`.

## Event Shape

```ts
interface ZKScanClientEvent {
  type:
    | 'proof:created'
    | 'proof:verified'
    | 'request:sent'
    | 'request:retry'
    | 'request:failed';
  timestamp: number;
  details?: Record<string, any>;
}
```

## Usage

```ts
const client = new ZKScanClient({
  apiUrl: 'https://zkscan.app/api',
  apiKey: 'YOUR_KEY',
  onEvent(event) {
    console.log('[zkScan]', event.type, event.details);
  }
});
```

This is useful for logging, metrics, or building your own dashboards
on top of the SDK.
