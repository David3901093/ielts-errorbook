# Diagnostic Logs

This folder is where you should save the diagnostic log files exported
from the app when testing on real devices (e.g. HarmonyOS).

## How to capture a log

1. Open the site on the device/browser you want to test.
2. Reproduce the issue (e.g. tap the 🔊 pronunciation button on a word).
3. Tap the 📋 button in the top-right header.
   → This downloads a file named `ielb-diag-YYYY-MM-DDTHH-MM-SS.txt`.
4. Save/move that file into this `log/` folder and share it with the developer.

## What the log contains

- **Environment**: full User-Agent, whether speechSynthesis exists, number of
  TTS voices (and their names), whether HarmonyOS is detected, viewport size,
  Audio/MP3 support — this pinpoints WHY pronunciation fails on the device.
- **Every audio attempt**: which method was tried (dictionary API audio vs TTS),
  whether it succeeded, and the exact failure reason (error code, timeout,
  rejected play() promise, etc.).
- **Navigation & user actions** for context.

The log is also mirrored to the browser console (for live debugging) and
persisted in localStorage between page reloads.
