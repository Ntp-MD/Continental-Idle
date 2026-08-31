export const npcSettingsData = {
  "speed": 0.2,
  "defaultRoleId": "role-guest",
  "roles": [
    {
      "id": "role-guest",
      "label": "Guest",
      "color": "#3794ff",
      "focusTags": [
        "portal"
      ],
      "restrictedTags": [],
      "taskIds": [],
      "focusChance": 70
    },
    {
      "id": "role-receptionist",
      "label": "Receptionist",
      "color": "#dcdcaa",
      "focusTags": [
        "front-desk"
      ],
      "restrictedTags": [],
      "taskIds": [],
      "focusChance": 100,
      "spawnRule": {
        "targetTags": [
          "front-desk"
        ],
        "count": 2
      }
    },
    {
      "id": "role-bartender",
      "label": "Bartender",
      "color": "#ce9178",
      "focusTags": [
        "bar"
      ],
      "restrictedTags": [],
      "taskIds": [],
      "focusChance": 100,
      "spawnRule": {
        "targetTags": [
          "bar"
        ],
        "count": 2
      }
    },
    {
      "id": "role-trainer",
      "label": "Trainer",
      "color": "#4fc1ff",
      "focusTags": [
        "gym"
      ],
      "restrictedTags": [],
      "taskIds": [],
      "focusChance": 100,
      "spawnRule": {
        "targetTags": [
          "gym"
        ],
        "count": 2
      }
    },
    {
      "id": "role-therapist",
      "label": "Therapist",
      "color": "#c586c0",
      "focusTags": [
        "spa",
        "pool"
      ],
      "restrictedTags": [],
      "taskIds": [],
      "focusChance": 100,
      "spawnRule": {
        "targetTags": [
          "spa"
        ],
        "count": 3
      }
    },
    {
      "id": "role-housekeeper",
      "label": "Housekeeper",
      "color": "#89d185",
      "focusTags": [
        "housekeeping",
        "guest-room"
      ],
      "restrictedTags": [],
      "taskIds": [],
      "focusChance": 100,
      "spawnRule": {
        "targetTags": [
          "housekeeping"
        ],
        "count": 4
      }
    }
  ],
  "tasks": [],
  "pool": [
    {
      "roleId": "role-guest",
      "count": 16
    },
    {
      "roleId": "role-receptionist",
      "count": 2,
      "floorIds": [
        "G"
      ]
    },
    {
      "roleId": "role-bartender",
      "count": 2,
      "floorIds": [
        "G",
        "2"
      ]
    },
    {
      "roleId": "role-trainer",
      "count": 2,
      "floorIds": [
        "3"
      ]
    },
    {
      "roleId": "role-therapist",
      "count": 3,
      "floorIds": [
        "4",
        "5"
      ]
    },
    {
      "roleId": "role-housekeeper",
      "count": 4,
      "floorIds": [
        "6",
        "7",
        "8",
        "9",
        "10"
      ]
    }
  ],
  "crossFloorCooldownSeconds": 30,
  "progressWatchdogTicks": 120,
  "maxRepathAttempts": 4,
  "repathCooldownSeconds": 2,
  "repathCooldownExponent": 1.5,
  "pathBudgetMinPerTick": 2,
  "pathBudgetAgentsPerCall": 100,
  "chooseTargetMinPerTick": 8,
  "chooseTargetAgentsPerSlot": 20,
  "wanderMemorySize": 32,
  "wanderSmallMapThreshold": 8,
  "triggerRatePeriodSeconds": 60,
  "frameSimBudgetMs": 6,
  "maxSimulationSteps": 8
}
