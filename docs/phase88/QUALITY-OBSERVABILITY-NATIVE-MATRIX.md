# Quality, Observability, and Native Release Matrix

## CI gate

`npm ci`, typecheck, unit tests, integration tests with temporary PostgreSQL/Redis/object storage, web export build, dependency scan, and secret scan.

## Browser/device matrix

Chrome, Edge, Firefox, Safari; Windows, macOS, iPhone/iPad, Android; slow network and offline/reconnect scenarios.

## Production alerts

Web/API availability, database/Redis failures, queue backlog, error rate, latency, Stripe webhooks, storage capacity, AI spending, and backup failure.

## Native release evidence

Windows code signing, macOS signing/notarization, Linux package tests, iOS App Store archive/signing, Android Play signing, crash reporting, update/rollback tests, and store privacy declarations.
