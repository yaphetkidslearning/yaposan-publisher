# Desktop Auto-Update Guide

Yaposan desktop builds use Electron packaging and update infrastructure. Public production updates must be code-signed; macOS packages should also be notarized where required.

Build locally with the appropriate desktop command from `package.json`, verify the generated artifact, sign it with the platform-specific credentials, and publish only through the configured release channel.

Never place signing credentials in the repository.
