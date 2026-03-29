# API Documentation

## Overview
This API provides access to the Spin71 Betting Platform, allowing users to interact with various endpoints for placing bets, checking balances, retrieving game data, and more.

## Base URL
`https://api.spin71bet.com/v1`

## Authentication
All requests require an API key for authentication. Include your API key in the header as follows:
```
Authorization: Bearer YOUR_API_KEY
```

## Endpoints

### 1. **Get User Balance**
- **Endpoint:** `/user/balance`
- **Method:** `GET`
- **Description:** Retrieves the current balance of the user.
- **Example Request:**
```
GET /user/balance HTTP/1.1
Host: api.spin71bet.com
Authorization: Bearer YOUR_API_KEY
```
- **Example Response:**
```json
{
    "balance": "100.50"
}
```

### 2. **Place a Bet**
- **Endpoint:** `/bets`
- **Method:** `POST`
- **Description:** Places a bet on a specified game.
- **Request Body:**
```json
{
    "game_id": "12345",
    "amount": "10",
    "bet_type": "straight"
}
```
- **Example Request:**
```
POST /bets HTTP/1.1
Host: api.spin71bet.com
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
    "game_id": "12345",
    "amount": "10",
    "bet_type": "straight"
}
```
- **Example Response:**
```json
{
    "status": "success",
    "message": "Bet placed successfully!",
    "bet_id": "67890"
}
```

### 3. **Get Game Data**
- **Endpoint:** `/games`
- **Method:** `GET`
- **Description:** Retrieves a list of available games.
- **Example Request:**
```
GET /games HTTP/1.1
Host: api.spin71bet.com
Authorization: Bearer YOUR_API_KEY
```
- **Example Response:**
```json
[
    {
        "game_id": "12345",
        "name": "Blackjack",
        "status": "active"
    },
    {
        "game_id": "67890",
        "name": "Roulette",
        "status": "active"
    }
]
```

### 4. **Get Bet History**
- **Endpoint:** `/bets/history`
- **Method:** `GET`
- **Description:** Retrieves the history of bets placed by the user.
- **Example Request:**
```
GET /bets/history HTTP/1.1
Host: api.spin71bet.com
Authorization: Bearer YOUR_API_KEY
```
- **Example Response:**
```json
[
    {
        "bet_id": "67890",
        "game_id": "12345",
        "amount": "10",
        "status": "won",
        "timestamp": "2026-03-29T16:26:40Z"
    }
]
```

## Error Codes
- **400 Bad Request:** Validation error.
- **401 Unauthorized:** Invalid or missing API key.
- **404 Not Found:** Resource not found.
- **500 Internal Server Error:** An error occurred on the server.

## Conclusion
Use these endpoints to interact with the Spin71 Betting Platform effectively. Ensure to handle errors and always authenticate your requests properly.