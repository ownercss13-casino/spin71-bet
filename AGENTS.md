# Agent Instructions & Guidelines

These instructions are automatically loaded for all coding agents working on this project. They protect core features from being modified, broken, or deleted without explicit user consent.

## ⚠️ CRITICAL PRESERVATION RULE

The core features of this betting platform are fully functioning and verified. Under NO circumstances should any of the following files/functionalities be edited, restructured, renamed, or deleted unless the user explicitly asks for it:

1. **Aviator Game Component (`/src/components/AviatorGame/AviatorGame.tsx`)**
   - High-performance UI, animations, canvas parsing, double-bet stations, and real-time SSE stream integration.
   - History Ribbon: The premium, highly visual responsive history bar across the top of the game widget must remain exactly as designed (with proper shrink-to-fit flex layout so it doesn't get pushed out of sight).
   - High-reliability cash-out mechanisms, auto-bet settings, and dual panel states.

2. **Backend Server & Real-Time Engine (`/server.ts`)**
   - Live SSE `/api/aviator/stream` connection.
   - Dynamic round interval timing and automatic state processing.
   - Telegram predictions integration and Aviator custom overrides/hacks.

3. **Admin Panel Control Center (`/src/views/AdminPanelView.tsx`)**
   - The Aviator Predictor Override (এভিয়েটর সিগন্যাল হ্যাক কন্ট্রোলার) to toggle force signal multipliers, set presets, and update metadata.

## Core Rules for System Updates
- Maintain active state integrations securely.
- Always perform incremental updates with extreme care.
- Do NOT perform complete rewrites of functioning modules.
- Ensure type-correct integrations without breaking real-time Firebase updates and state logic.
