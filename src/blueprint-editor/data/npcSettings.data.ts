export const npcSettingsData = {
  "$schema": "npc-config.v1.json",
  "version": 1,
  "speed": 0.2,
  "defaultRoleId": "role-guest",
  "roles": [
    {
      "id": "role-guest",
      "label": "Guest",
      "color": "#3b82f6",
      "focusTags": [],
      "restrictedTags": [],
      "taskIds": [],
      "focusChance": 80
    },
    {
      "id": "role-35fe1cf9ca",
      "label": "go tag1",
      "color": "#8E9DCE",
      "focusTags": [
        "tag1"
      ],
      "restrictedTags": [],
      "taskIds": [],
      "focusChance": 100,
      "spawnRule": {
        "targetTags": [],
        "count": 0
      }
    },
    {
      "id": "role-b9ba582cec",
      "label": "go tag2",
      "color": "#349528",
      "focusTags": [
        "tag2"
      ],
      "restrictedTags": [],
      "taskIds": [],
      "focusChance": 100,
      "spawnRule": {
        "targetTags": [],
        "count": 0
      }
    },
    {
      "id": "role-d6a47712fa",
      "label": "go tag3",
      "color": "#B9BD98",
      "focusTags": [
        "tag3"
      ],
      "restrictedTags": [],
      "taskIds": [],
      "focusChance": 100,
      "spawnRule": {
        "targetTags": [],
        "count": 0
      }
    },
    {
      "id": "role-56fb018b2c",
      "label": "go tag4",
      "color": "#FA9AFB",
      "focusTags": [
        "tag4"
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
      "count": 10
    },
    {
      "roleId": "role-35fe1cf9ca",
      "count": 6
    },
    {
      "roleId": "role-b9ba582cec",
      "count": 9
    },
    {
      "roleId": "role-d6a47712fa",
      "count": 6
    },
    {
      "roleId": "role-56fb018b2c",
      "count": 4
    }
  ]
}
