{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "startServerCommand": "npm run build && npm run start",
      "url": ["http://localhost:3000"],
      "settings": {
        "preset": "desktop",
        "chromeFlags": "--no-sandbox --headless"
      }
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["warn", { "minScore": 0.85 }],
        "categories:accessibility": ["warn", { "minScore": 0.9 }],
        "largest-contentful-paint": ["warn", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["warn", { "maxNumericValue": 0.1 }],
        "interaction-to-next-paint": ["warn", { "maxNumericValue": 200 }],
        "total-blocking-time": ["warn", { "maxNumericValue": 200 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
