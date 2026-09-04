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
        "living"
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
        "cooking"
      ],
      "restrictedTags": [],
      "taskIds": [],
      "focusChance": 100,
      "spawnRule": {
        "targetTags": [],
        "count": 0
      }
    }
  ],
  "tasks": [],
  "pool": [
    {
      "roleId": "role-guest",
      "count": 16,
      "floorIds": [
        "floor-6be566f0cf"
      ]
    },
    {
      "roleId": "role-6dfde6eef0",
      "count": 3
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
