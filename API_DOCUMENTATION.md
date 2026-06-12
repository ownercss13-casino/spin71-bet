# Spin71 Bet API Documentation

This document describes the RESTful API and Real-Time Event interfaces designed and implemented for the **Spin71 Bet** gaming and management platform. 

The application architecture features a client-side Single Page Application (SPA) powered by React & Vite that communicates with a full-stack Node.js server powered by Express.

---

## 🔒 Authentication & Authorization

All secure endpoints utilize **JSON Web Tokens (JWT)** generated via **Firebase Authentication**.

### Authorization Header
Secure endpoints require the inclusion of a Bearer token in the request header:
```http
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

### Roles and Tiers
1. **Public**: No authentication token is required. See public game parameters, status, or leaderboard summaries.
2. **User**: Standard user access. Requires a valid Firebase Auth ID Token. Allows actions like account queries, deposit confirmations, withdrawals, and game inputs.
3. **Admin**: Premium administrative access. Requires standard Firebase tokens belonging to users designated as administrators in Firestore (`role: 'admin'` or `isAdmin: true`) or explicitly matched via superuser configs (e.g., `owner.css13@gmail.com` or `cutelegend7045@gmail.com`). Included bypass systems allow API automation keys (e.g., `RETOOL_API_KEY`) for secure integrations.

---

## 🚀 API Endpoint Reference

### 1. Public & Configuration Endpoints

#### • Server Health Check
* **Endpoint:** `GET /api/health`
* **Access:** Public
* **Description:** Quick service probe used for latency tracking and container live checks.
* **Response (200 OK):**
  ```json
  {
    "status": "ok"
  }
  ```

#### • Dynamic Quote
* **Endpoint:** `GET /api/quote`
* **Access:** Public (Rate-limited)
* **Description:** Retrieves real-time dynamic motivation or game quote data.
* **Response (200 OK):**
  ```json
  {
    "quote": "Success is not final, failure is not fatal.",
    "author": "Churchill"
  }
  ```

#### • Leaderboard Summary
* **Endpoint:** `GET /api/leaderboard`
* **Access:** Public
* **Description:** Lists top-performing players and high-stake wins.
* **Response (200 OK):**
  ```json
  [
    {
      "uid": "user_abc123",
      "username": "RocketRider",
      "winAmount": 1420.50,
      "multiplier": 12.5
    }
  ]
  ```

---

### 2. User & Game Action Endpoints (Requires User Auth Token)

#### • Fetch Profile Info
* **Endpoint:** `GET /api/user/profile`
* **Access:** User (Token Required)
* **Description:** Returns profile metadata, accounting logs, current balances, and dynamic loyalty rank.
* **Response (200 OK):**
  ```json
  {
    "uid": "user_abc123",
    "email": "user@example.com",
    "username": "RocketRider",
    "balance": 2450.00,
    "role": "user"
  }
  ```

#### • Confirm Deposit
* **Endpoint:** `POST /api/user/deposit/confirm`
* **Access:** User (Token Required)
* **Payload:**
  ```json
  {
    "amount": 500,
    "gateway": "bKash",
    "transactionId": "TRX_982741"
  }
  ```
* **Description:** Registers a deposit request with payment transaction metadata to be reviewed.
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Deposit confirmation submitted for review.",
    "txId": "doc_xyz456"
  }
  ```

#### • Request Withdrawal
* **Endpoint:** `POST /api/user/withdraw/request`
* **Access:** User (Token Required)
* **Payload:**
  ```json
  {
    "amount": 750,
    "gateway": "Nagad",
    "walletNumber": "01700000000"
  }
  ```
* **Description:** Securely initiates a withdrawal. Checks dynamic balance requirements inside high-reliability transactions.
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Withdrawal request placed successfully.",
    "txId": "doc_xyz789"
  }
  ```

#### • Aviator Game Action
* **Endpoint:** `POST /api/game/aviator/action`
* **Access:** User (Token Required)
* **Payload:**
  ```json
  {
    "action": "bet" | "cashout",
    "betId": "bet_1",
    "amount": 100,
    "cashoutMultiplier": 1.45
  }
  ```
* **Description:** Places a live bet or requests immediate cashout during active rounds. Runs within sequential state controllers to prevent double-spending.
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "balance": 2350.00,
    "betId": "bet_1"
  }
  ```

---

### 3. Server-Sent Events (SSE) Real-Time Streams

For low-overhead instant updates, the platform serves dedicated live event streams. Clients open permanent connections using the standard browser `EventSource` API.

#### • Aviator Real-Time Game Stream
* **Endpoint:** `GET /api/aviator/stream`
* **Access:** Public (Connect via `EventSource`)
* **Events Emitted:**
  * `tick`: Emits real-time fractional multipliers (`{ "multiplier": 1.25, "active": true }`).
  * `crash`: Fired when the dynamic multiplier crashes with next-round timer parameters.
  * `history`: Retransmits dynamic historical outcomes.

---

### 4. Admin Management Endpoints (Requires Admin Role)

#### • Fetch All Users (Retool Integration Segment)
* **Endpoint:** `GET /api/admin/users`
* **Access:** Admin Only
* **Description:** Fetches all users registered on the platform with pagination capability.
* **Response (200 OK):**
  ```json
  [
    {
      "uid": "user_abc123",
      "username": "RocketRider",
      "email": "user@example.com",
      "balance": 2450.00,
      "role": "user"
    }
  ]
  ```

#### • Adjust User Balance
* **Endpoint:** `POST /api/admin/users/:userId/balance`
* **Access:** Admin Only
* **Payload:**
  ```json
  {
    "amount": 1000,
    "type": "add" | "subtract"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "newBalance": 3450.00
  }
  ```

#### • Configure Provider Settings
* **Endpoint:** `POST /api/admin/settings`
* **Access:** Admin Only
* **Payload:**
  ```json
  {
    "telegramBotToken": "BOT_TOKEN",
    "telegramChatId": "CHAT_ID",
    "aviatorMinMultiplier": 1.05
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Global configuration updated."
  }
  ```

---

## 🛠️ Error Codes and Format

All error responses utilize a consistent, human-readable structure:

```json
{
  "error": "Error description statement"
}
```

### Standard Status Identifiers:
* **`401 Unauthorized`**: Authentication token is missing, expired, or invalid.
* **`403 Forbidden`**: Authorization clearance is insufficient (e.g. standard user accessing admin space).
* **`404 Not Found`**: Request endpoint or query target cannot be found.
* **`429 Too Many Requests`**: Client rate limit exceeded.
* **`500 Internal Server Error`**: Generic database error, network crash, or unhandled server exception.
