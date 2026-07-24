{
  "provider": "Roamic (Roamic eSIM API)",
  "docsUrl": "https://docs.roamic.com/",
  "partnersUrl": "https://partners.roamic.com/",
  "resellerUrl": "https://reseller.roamic.com/",
  "supportEmail": "partner.support@roamic.com",
  "resellerEmail": "reseller@roamic.com",
  "companyEntity": "Bytetravel S.A. (Spain)",
  "coverage": "190+ countries, Tier-1 carrier interconnects",
  "pricingCurrency": "EUR",
  "wholesalePricing": "US from €0.40/GB, Europe from €0.30/GB, Turkey from €0.25/GB, Japan from €0.30/GB, Thailand from €0.35/GB",
  "authentication": {
    "method": "Email/password login then Bearer token",
    "tokenEndpoint": "POST https://api.roamic.com/auth/login",
    "contentType": "application/json",
    "requestBody": {
      "email": "string",
      "password": "string"
    },
    "tokenUsage": "Authorization: Bearer <token>",
    "tokenStorage": "Postman collection stores token in variable 'authorization-secret'. After login, reuse for all requests.",
    "loginErrorResponse": {
      "success": false,
      "message": "Unauthorized"
    },
    "loginSuccessResponse": "Docs only show error case. Based on Postman collection pattern, success likely returns { success: true, data: { token: '...' } }. Contact support for confirmed schema.",
    "notes": "Email/password auth (NOT OAuth2 client_credentials). No separate client_id/secret flow.",
    "tokenRefresh": "Not documented. Likely requires re-calling /auth/login."
  },
  "baseUrls": {
    "production": "https://api.roamic.com",
    "sandbox": "Mentioned on marketing pages but no separate sandbox URL documented. Contact partner.support@roamic.com for sandbox credentials."
  },
  "endpoints": {
    "login": {
      "method": "POST",
      "path": "/auth/login",
      "fullUrl": "https://api.roamic.com/auth/login",
      "auth": "None (is the auth endpoint)",
      "headers": [
        "Content-Type: application/json"
      ],
      "requestBody": {
        "email": "string (required)",
        "password": "string (required)"
      },
      "statusCode": "200 success, 500 unauthorized"
    },
    "listRegions": {
      "method": "GET",
      "path": "/v1/regions",
      "fullUrl": "https://api.roamic.com/v1/regions",
      "auth": "Bearer token",
      "headers": [
        "Accept: application/json"
      ],
      "queryParams": [
        "length (integer, default 200)",
        "page (integer)",
        "search[value] (string, search by name)",
        "filter[featured] (integer, 1=featured)"
      ],
      "response": {
        "success": true,
        "data": [
          {
            "type": "regions",
            "id": 1,
            "attributes": {
              "id": 1,
              "publicName": "Andorra",
              "publicKeyword": "AD",
              "currencyKeyword": "USD",
              "status": "enabled",
              "type": "country",
              "createdAt": "2024-11-15T11:48:53.000000Z",
              "updatedAt": "2025-07-09T07:36:59.000000Z",
              "configuration": [],
              "featured": 1
            }
          }
        ],
        "meta": {
          "count": 145,
          "offset": 1,
          "limit": 200,
          "total": 145
        },
        "links": {
          "first": "url",
          "last": "url",
          "prev": "null|url",
          "next": "null|url"
        }
      }
    },
    "listCatalog": {
      "method": "GET",
      "path": "/v1/catalogs",
      "fullUrl": "https://api.roamic.com/v1/catalogs",
      "auth": "Bearer token",
      "headers": [
        "Accept: application/json"
      ],
      "queryParams": [
        "length (integer, default 20)",
        "page (integer)",
        "filter[regionKeyword] (string, ISO code e.g. ES)",
        "filter[durationAmount] (integer, e.g. 14)",
        "filter[dataAmount] (integer, in MB, e.g. 100)"
      ],
      "response": {
        "success": true,
        "data": [
          {
            "type": "catalogs",
            "id": 629,
            "attributes": {
              "id": 629,
              "productSku": "HK_01GB",
              "productName": "[HK] 100 MB / 7 days",
              "productDescription": "eSim 100 MB / 7 days for Hong Kong",
              "price": "0.10000",
              "currencyKeyword": "EUR",
              "unlimited": 0,
              "dataAmount": 100,
              "dataType": "MB",
              "durationAmount": 7,
              "durationType": "DAY",
              "regionKeyword": "HK",
              "unusedValidDays": 180,
              "status": "enabled",
              "details": []
            }
          }
        ],
        "meta": {
          "count": 20,
          "offset": 2,
          "limit": 20,
          "total": 63
        },
        "links": {
          "first": "url",
          "last": "url",
          "prev": "url|null",
          "next": "url|null"
        }
      }
    },
    "orderEsim": {
      "method": "POST",
      "path": "/v1/manage/esim/order",
      "fullUrl": "https://api.roamic.com/v1/manage/esim/order",
      "auth": "Bearer token",
      "headers": [
        "Accept: application/json",
        "Content-Type: application/json"
      ],
      "requestBody": {
        "productSku": "string (required, e.g. US_1GB)",
        "transactionId": "string (required, your unique reference)"
      },
      "response": {
        "success": true,
        "data": {
          "orderId": "fc29bfa3-8da5-4883-8e1b-35634aebffb6",
          "transactionId": "yourUniqueTransactionId"
        },
        "message": "Order received"
      },
      "notes": "Async operation. Poll /v1/manage/esim/query for eSIM details after ordering."
    },
    "topupEsim": {
      "method": "POST",
      "path": "/v1/manage/esim/topup",
      "fullUrl": "https://api.roamic.com/v1/manage/esim/topup",
      "auth": "Bearer token",
      "headers": [
        "Accept: application/json",
        "Content-Type: application/json"
      ],
      "requestBody": {
        "orderId": "string (required, existing order UUID)",
        "productSku": "string (required, plan SKU)",
        "transactionId": "string (required, your unique reference)"
      },
      "response": {
        "success": true,
        "data": {
          "orderId": "new-uuid",
          "transactionId": "yourUniqueTransactionId"
        },
        "message": "Topup order received"
      },
      "notes": "Creates new orderId linked to original eSIM profile."
    },
    "cancelEsim": {
      "method": "POST",
      "path": "/v1/manage/esim/cancel",
      "fullUrl": "https://api.roamic.com/v1/manage/esim/cancel",
      "auth": "Bearer token",
      "headers": [
        "Accept: application/json",
        "Content-Type: application/json"
      ],
      "requestBody": {
        "orderId": "string (required, order UUID to cancel)"
      },
      "response": {
        "success": true,
        "data": {
          "orderId": "8d4d272f-4f1e-47e1-8b00-1e254aa08612"
        },
        "message": "Cancel order received"
      }
    },
    "queryOrder": {
      "method": "GET",
      "path": "/v1/manage/esim/query",
      "fullUrl": "https://api.roamic.com/v1/manage/esim/query",
      "auth": "Bearer token",
      "headers": [
        "Accept: application/json"
      ],
      "queryParams": [
        "filter[orderId] (string, the order UUID)"
      ],
      "response": {
        "success": true,
        "data": {
          "esim": {
            "orderId": "df152d3e-5ccb-4a84-a806-4ea114cf7834",
            "transactionId": "",
            "imsi": "232104070077567",
            "iccid": "8943108170000775671",
            "activationCode": "LPA:1$rsp-eu.simlessly.com$43DE23C67EE747BCAD6B63E8B67B261F",
            "qrCodeUrl": "https://p.qrsim.net/0fa4f29eb25b4d6c84ff4b8422a1da54.png",
            "esimStatus": "GOT_RESOURCE",
            "apn": "roamic.com",
            "activateDatetime": null,
            "expiredDatetime": "2026-05-29T18:34:17+0000"
          }
        },
        "message": "Done"
      },
      "criticalFields": {
        "iccid": "Used as identifier for usage queries - store after provisioning",
        "activationCode": "LPA string for manual eSIM installation",
        "qrCodeUrl": "URL to QR code PNG - for eSIM scanning",
        "esimStatus": "Status (GOT_RESOURCE = ready)"
      },
      "notes": "This is the most important endpoint for adapter implementation. Poll until esimStatus='GOT_RESOURCE'."
    },
    "getUsage": {
      "method": "GET",
      "path": "/v1/manage/esim/usage/{iccid}",
      "fullUrl": "https://api.roamic.com/v1/manage/esim/usage/{iccid}",
      "auth": "Bearer token",
      "headers": [
        "Accept: application/json"
      ],
      "pathParams": [
        "iccid (string, from query response)"
      ],
      "response": {
        "success": true,
        "data": {
          "dataType": "MB",
          "usage": 1230,
          "maxUsage": 4096,
          "unlimited": 0,
          "remainingDays": 2,
          "status": "active"
        },
        "message": "Done"
      }
    }
  },
  "twoStepProvisioning": {
    "step1": "POST /v1/manage/esim/order with productSku + transactionId → returns orderId immediately",
    "step2": "Poll GET /v1/manage/esim/query?filter[orderId]=... → wait for esimStatus='GOT_RESOURCE' to get QR code, ICCID, activation code",
    "pollingRecommendation": "Poll every 5 seconds for up to 60 seconds"
  },
  "rateLimits": "NOT DOCUMENTED. No rate limit headers observed in examples. Implement exponential backoff (1s→2s→4s→8s, max 30s) as a precaution.",
  "webhooks": "MARKETED BUT NOT DOCUMENTED. Partners.roamic.com mentions 'webhooks for real-time status' but no webhook payload/events/HMAC docs exist publicly.",
  "errorHandling": "Basic envelope: { success: boolean, message: string }. Only documented error is 500 on failed login. No error code catalog.",
  "idempotency": "NOT DOCUMENTED. transactionId field in order/topup may serve as client-side idempotency key. Use UUID v4.",
  "sdk": "NO OFFICIAL SDK. Postman collection auto-generates code snippets in 30+ languages at docs.roamic.com.",
  "postmanCollectionUrl": "https://www.postman.com/roamic/roamic-esim-api/overview (requires sign-in)",
  "integrationWorkflow": [
    "1. POST /auth/login → get Bearer token",
    "2. GET /v1/catalogs?filter[regionKeyword]=XX → find productSku",
    "3. POST /v1/manage/esim/order → get orderId",
    "4. Poll GET /v1/manage/esim/query?filter[orderId]=... → wait for GOT_RESOURCE",
    "5. Extract qrCodeUrl, activationCode, iccid from response",
    "6. GET /v1/manage/esim/usage/{iccid} → monitor data usage",
    "7. POST /v1/manage/esim/topup → add data (optional)",
    "8. POST /v1/manage/esim/cancel → cancel (optional)"
  ],
  "gapsRequiringContact": [
    "Login success response schema",
    "Sandbox base URL and credentials",
    "Webhook events, payload, HMAC signing, endpoint registration",
    "Rate limits and retry guidance",
    "Token expiry duration",
    "Full eSIM status lifecycle (all esimStatus values)",
    "Cancellation eligibility rules",
    "Error code catalog"
  ],
  "adapterImplementationNotes": {
    "listCatalog": "Use GET /v1/catalogs with region/duration/dataAmount filters. Handle pagination via meta.links.next.",
    "getPackage": "No single-package endpoint exists. Filter catalog by productSku or fetch all and find by SKU.",
    "provision": "POST /v1/manage/esim/order, then poll /v1/manage/esim/query until GOT_RESOURCE.",
    "getEsimStatus": "GET /v1/manage/esim/query?filter[orderId]=... returns esimStatus field.",
    "getUsage": "GET /v1/manage/esim/usage/{iccid} returns usage/maxUsage/remainingDays/status.",
    "cancel": "POST /v1/manage/esim/cancel with orderId."
  }
}