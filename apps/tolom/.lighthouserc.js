{
  ("ci");
  :
  ("collect")
  :
  ("numberOfRuns")
  : 3,
      "settings":
  ("preset")
  : "recommended",
        "onlyCategories": ["performance", "accessibility", "best-practices"]
  ,
    "assert":
  ("assertions")
  :
  ("categories:performance")
  : ["warn",
  ("minScore")
  : 0.8
  ],
        "categories:accessibility": ["warn",
  ("minScore")
  : 0.9
  ],
        "categories:best-practices": ["warn",
  ("minScore")
  : 0.9
  ],
        "lighthouse-plugin-crux:cumulative-layout-shift": ["error",
  ("minScore")
  : 0.1
  ],
        "lighthouse-plugin-crux:interaction-to-next-paint": ["error",
  ("minScore")
  : 200
  ],
        "lighthouse-plugin-crux:largest-contentful-paint": ["error",
  ("minScore")
  : 2500
  ]
  ,
    "upload":
  ("target")
  : "temporary-public-storage"
}
