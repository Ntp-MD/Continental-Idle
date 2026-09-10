export const npcSettingsData = {
  "speed": 0.2,
  "defaultRoleId": "role-guest",
  "roles": [
    {
      "id": "role-guest",
      "label": "Guest",
      "color": "#3794ff",
      "focusTags": [
        "portal",
        "hygiene",
        "living",
        "lounge",
        "front-desk",
        "soc-chatty"
      ],
      "restrictedTags": [],
      "taskIds": [],
      "focusChance": 70
    },
    {
      "id": "role-6dfde6eef0",
      "label": "Chef",
      "color": "#0020c2",
      "focusTags": [
        "hygiene",
        "cooking",
        "soc-loner"
      ],
      "restrictedTags": [],
      "taskIds": [
        "task-kitchen-table",
        "task-kitchen-sink",
        "task-kitchen-stove"
      ],
      "focusChance": 100,
      "spawnRule": {
        "targetTags": [],
        "count": 0
      }
    },
    {
      "id": "role-bartender",
      "label": "Bartender",
      "color": "#c084fc",
      "focusTags": [
        "lounge"
      ],
      "restrictedTags": [],
      "taskIds": [
        "task-tend-bar"
      ],
      "focusChance": 100
    },
    {
      "id": "role-receptionist",
      "label": "Receptionist",
      "color": "#f59e0b",
      "focusTags": [
        "front-desk"
      ],
      "restrictedTags": [],
      "taskIds": [
        "task-reception"
      ],
      "focusChance": 100
    }
  ],
  "tasks": [
    {
      "id": "task-tend-bar",
      "label": "Tend bar",
      "tags": [
        "lounge"
      ],
      "post": {
        "assetId": "bar-counter",
        "post": "bar-back"
      }
    },
    {
      "id": "task-reception",
      "label": "Reception station",
      "tags": [
        "front-desk"
      ],
      "post": {
        "assetId": "reception-desk",
        "post": "reception-station"
      }
    },
    {
      "id": "task-kitchen-table",
      "label": "Kitchen station",
      "tags": [
        "cooking"
      ],
      "post": {
        "assetId": "kitchen-table-1",
        "post": "kitchen-station"
      }
    },
    {
      "id": "task-kitchen-sink",
      "label": "Kitchen station",
      "tags": [
        "cooking"
      ],
      "post": {
        "assetId": "kitchen-sink",
        "post": "kitchen-station"
      }
    },
    {
      "id": "task-kitchen-stove",
      "label": "Kitchen station",
      "tags": [
        "cooking"
      ],
      "post": {
        "assetId": "table-stove",
        "post": "kitchen-station"
      }
    }
  ],
  "pool": [
    {
      "roleId": "role-guest",
      "count": 45,
      "floorIds": [
        "floor-f6bc12edb3"
      ]
    },
    {
      "roleId": "role-6dfde6eef0",
      "count": 5
    },
    {
      "roleId": "role-bartender",
      "count": 5,
      "floorIds": [
        "floor-f6bc12edb3"
      ]
    },
    {
      "roleId": "role-receptionist",
      "count": 5,
      "floorIds": [
        "floor-f6bc12edb3"
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
