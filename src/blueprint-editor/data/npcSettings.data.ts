export const npcSettingsData = {
  "$schema": "npc-config.v1.json",
  "version": 1,
  "speed": 0.2,
  "defaultRoleId": "role-guest",
  "roles": [
    {
      "id": "role-guest",
      "label": "Guest",
      "color": "#3794ff",
      "focusTags": [
        "portal",
        "lounge",
        "dining",
        "pool",
        "spa",
        "gym",
        "wellness",
        "guest-room"
      ],
      "restrictedTags": [],
      "taskIds": [
        "t-checkin",
        "t-drink",
        "t-swim",
        "t-massage",
        "t-workout",
        "t-rest",
        "t-lounge"
      ],
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
      "taskIds": [
        "t-checkin"
      ],
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
      "taskIds": [
        "t-drink"
      ],
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
      "taskIds": [
        "t-workout"
      ],
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
      "taskIds": [
        "t-massage"
      ],
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
      "taskIds": [
        "t-clean"
      ],
      "focusChance": 100,
      "spawnRule": {
        "targetTags": [
          "housekeeping"
        ],
        "count": 4
      }
    }
  ],
  "tasks": [
    {
      "id": "t-checkin",
      "label": "Check-in",
      "tags": [
        "front-desk"
      ]
    },
    {
      "id": "t-drink",
      "label": "Order drink",
      "tags": [
        "bar"
      ]
    },
    {
      "id": "t-swim",
      "label": "Swim",
      "tags": [
        "pool"
      ]
    },
    {
      "id": "t-massage",
      "label": "Massage",
      "tags": [
        "spa"
      ]
    },
    {
      "id": "t-workout",
      "label": "Workout",
      "tags": [
        "gym"
      ]
    },
    {
      "id": "t-rest",
      "label": "Rest",
      "tags": [
        "guest-room"
      ]
    },
    {
      "id": "t-lounge",
      "label": "Lounge",
      "tags": [
        "lounge"
      ]
    },
    {
      "id": "t-clean",
      "label": "Clean room",
      "tags": [
        "housekeeping",
        "guest-room"
      ]
    }
  ],
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
  ]
}
