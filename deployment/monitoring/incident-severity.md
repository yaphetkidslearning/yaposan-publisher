# Incident Severity and Rollback Rules

## Critical
Public app unavailable, API liveness failure, data-loss risk, authentication bypass, payment corruption, or widespread export failure. Begin rollback immediately and preserve logs.

## High
Readiness failure, sustained 5xx errors above 2%, export queue older than 10 minutes, release mismatch, or Stripe webhook processing failure. Stop further changes and resolve within one hour.

## Medium
Degraded performance, isolated provider failure with fallback, non-critical email delay, or elevated client errors. Investigate during the same operating day.

## Rollback gate
Rollback to the last verified Render deployment when a critical condition lasts more than five minutes or when data integrity cannot be confirmed. DNS rollback is required only when the provider endpoint itself is unreachable or incorrectly routed.
