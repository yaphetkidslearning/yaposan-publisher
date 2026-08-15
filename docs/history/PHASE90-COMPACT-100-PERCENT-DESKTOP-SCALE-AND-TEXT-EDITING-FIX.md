# Phase 90 — Compact 100% Desktop Scale and Text Editing Fix

## Desktop scale

At normal 100% browser zoom, desktop screens now render at the same compact density previously seen around 80% browser zoom. The scale is applied only on web viewports 1024px and wider. Tablet and mobile layouts remain at their native responsive scale.

## Template text editing

Backspace no longer deletes a selected text object. When a text object is selected, Backspace enters inline editing so the user can remove or replace template text. The Delete key still removes the selected object. Double-click continues to enter text editing as before.

## Keyboard behavior

- Backspace on selected text: edit text
- Delete on selected object: delete object
- Backspace on non-text selection: delete object
- Backspace inside an input or text editor: delete characters normally
