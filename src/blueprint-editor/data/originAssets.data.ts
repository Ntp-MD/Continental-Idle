export const originAssetsData = [
  {
    "id": "builtin-sofa-1",
    "name": "Sofa",
    "w": 2,
    "h": 1,
    "origin": "svg-import",
    "category": "Special",
    "walkable": true,
    "defaultBgColor": "#fff",
    "defaultLabelColor": "#444",
    "svg": "<rect x=\"2\" y=\"1\" width=\"46\" height=\"4\" rx=\"1.2\" fill=\"none\" stroke=\"var(--border-dim)\" stroke-width=\"0.4\"/><rect x=\"2\" y=\"5\" width=\"6\" height=\"18\" rx=\"1.5\" fill=\"none\" stroke=\"var(--border-dim)\" stroke-width=\"0.4\"/><rect x=\"42\" y=\"5\" width=\"6\" height=\"18\" rx=\"1.5\" fill=\"none\" stroke=\"var(--border-dim)\" stroke-width=\"0.4\"/><rect x=\"9\" y=\"5\" width=\"15.5\" height=\"18\" rx=\"1\" fill=\"none\" stroke=\"var(--border-dim)\" stroke-width=\"0.35\"/><rect x=\"25.5\" y=\"5\" width=\"15.5\" height=\"18\" rx=\"1\" fill=\"none\" stroke=\"var(--border-dim)\" stroke-width=\"0.35\"/>",
    "svgViewBox": {
      "w": 50,
      "h": 25
    },
    "walkableGrid": [
      [
        true,
        true
      ]
    ],
    "tileStates": [
      [
        "walkable",
        "walkable"
      ]
    ],
    "tileEdges": [
      [
        {
          "top": false,
          "right": false,
          "bottom": false,
          "left": false
        },
        {
          "top": false,
          "right": false,
          "bottom": false,
          "left": false
        }
      ]
    ],
    "interactSpots": [
      {
        "x": 13,
        "y": 13
      },
      {
        "x": 38,
        "y": 13
      }
    ],
    "interact": {
      "durationMin": 1,
      "durationMax": 3
    }
  },
  {
    "id": "builtin-bed-1",
    "name": "Bed",
    "w": 1,
    "h": 2,
    "origin": "svg-import",
    "category": "Special",
    "walkable": true,
    "defaultBgColor": "#fff",
    "defaultLabelColor": "#444",
    "svg": "<rect x=\"1\" y=\"4\" width=\"23\" height=\"44\" rx=\"2\" fill=\"none\" stroke=\"var(--border-dim)\" stroke-width=\"0.4\"/><rect x=\"1\" y=\"1\" width=\"23\" height=\"3\" rx=\"1\" fill=\"none\" stroke=\"var(--border-dim)\" stroke-width=\"0.4\"/><rect x=\"3.5\" y=\"5.5\" width=\"18\" height=\"8\" rx=\"2\" fill=\"none\" stroke=\"var(--border-dim)\" stroke-width=\"0.35\"/><line x1=\"1\" y1=\"30\" x2=\"24\" y2=\"30\" stroke=\"var(--border-dim)\" stroke-width=\"0.3\"/><line x1=\"12.5\" y1=\"30\" x2=\"12.5\" y2=\"47\" stroke=\"var(--border-dim)\" stroke-width=\"0.25\"/>",
    "svgViewBox": {
      "w": 25,
      "h": 50
    },
    "walkableGrid": [
      [
        true
      ],
      [
        true
      ]
    ],
    "tileStates": [
      [
        "walkable"
      ],
      [
        "walkable"
      ]
    ],
    "tileEdges": [
      [
        {
          "top": true,
          "right": true,
          "left": true
        }
      ],
      [
        {
          "right": true,
          "bottom": true,
          "left": true
        }
      ]
    ]
  },
  {
    "id": "builtin-elevator-1",
    "name": "Elevator",
    "w": 3,
    "h": 3,
    "origin": "svg-import",
    "category": "Special",
    "walkable": false,
    "defaultBgColor": "#fff",
    "defaultLabelColor": "#444",
    "svg": "<defs><marker id=\"arrow\" viewBox=\"0 0 10 10\" refX=\"8\" refY=\"5\" markerWidth=\"5\" markerHeight=\"5\" orient=\"auto-start-reverse\"><path d=\"M2 1L8 5L2 9\" fill=\"none\" stroke=\"var(--border-dim)\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></marker></defs><rect x=\"1\" y=\"1\" width=\"73\" height=\"73\" rx=\"2\" fill=\"none\" stroke=\"var(--border-dim)\" stroke-width=\"0.5\"/><rect x=\"5\" y=\"5\" width=\"65\" height=\"60\" rx=\"2\" fill=\"none\" stroke=\"var(--border-dim)\" stroke-width=\"0.3\"/><line x1=\"1\" y1=\"68\" x2=\"74\" y2=\"68\" stroke=\"var(--border-dim)\" stroke-width=\"0.4\"/><rect x=\"6\" y=\"69\" width=\"30.5\" height=\"5\" rx=\"0.5\" fill=\"none\" stroke=\"var(--border-dim)\" stroke-width=\"0.35\"/><rect x=\"38.5\" y=\"69\" width=\"30.5\" height=\"5\" rx=\"0.5\" fill=\"none\" stroke=\"var(--border-dim)\" stroke-width=\"0.35\"/><line x1=\"34\" y1=\"71.5\" x2=\"26\" y2=\"71.5\" stroke=\"var(--border-dim)\" stroke-width=\"0.4\" marker-end=\"url(#arrow)\"/><line x1=\"41\" y1=\"71.5\" x2=\"49\" y2=\"71.5\" stroke=\"var(--border-dim)\" stroke-width=\"0.4\" marker-end=\"url(#arrow)\"/><rect x=\"30\" y=\"8\" width=\"15\" height=\"7\" rx=\"1\" fill=\"none\" stroke=\"var(--border-dim)\" stroke-width=\"0.3\"/><circle cx=\"8\" cy=\"71.5\" r=\"1.3\" fill=\"none\" stroke=\"var(--border-dim)\" stroke-width=\"0.3\"/>",
    "svgViewBox": {
      "w": 75,
      "h": 75
    },
    "walkableGrid": [
      [
        true,
        true,
        true
      ],
      [
        true,
        true,
        true
      ],
      [
        true,
        true,
        true
      ]
    ],
    "tileStates": [
      [
        "entrance",
        "walkable",
        "walkable"
      ],
      [
        "walkable",
        "walkable",
        "walkable"
      ],
      [
        "walkable",
        "walkable",
        "walkable"
      ]
    ],
    "tileEdges": [
      [
        {
          "top": false,
          "left": false
        },
        {
          "top": true
        },
        {
          "top": true,
          "right": true
        }
      ],
      [
        {
          "left": true
        },
        {},
        {
          "right": true
        }
      ],
      [
        {
          "bottom": true,
          "left": true
        },
        {
          "bottom": true
        },
        {
          "right": true,
          "bottom": true
        }
      ]
    ],
    "interactSpots": [
      {
        "x": 12.5,
        "y": 12.5
      },
      {
        "x": 37.5,
        "y": 12.5
      },
      {
        "x": 62.5,
        "y": 12.5
      },
      {
        "x": 12.5,
        "y": 37.5
      },
      {
        "x": 37.5,
        "y": 37.5
      },
      {
        "x": 62.5,
        "y": 37.5
      },
      {
        "x": 12.5,
        "y": 62.5
      },
      {
        "x": 37.5,
        "y": 62.5
      },
      {
        "x": 62.5,
        "y": 62.5
      }
    ],
    "interact": {
      "capacity": 9,
      "durationMin": 1,
      "durationMax": 3
    }
  },
  {
    "id": "builtin-table-set-1",
    "name": "Table Set",
    "w": 3,
    "h": 3,
    "origin": "flattened",
    "category": "Flattened",
    "walkable": true,
    "defaultBgColor": "transparent",
    "defaultLabelColor": "#444",
    "svg": "<rect x=\"20\" y=\"20\" width=\"35\" height=\"35\" rx=\"2\" fill=\"none\" stroke=\"var(--border-dim)\" stroke-width=\"0.5\"/><rect x=\"22\" y=\"22\" width=\"31\" height=\"31\" rx=\"1\" fill=\"none\" stroke=\"var(--border-dim)\" stroke-width=\"0.3\"/><rect x=\"3\" y=\"28\" width=\"12\" height=\"18\" rx=\"1.5\" fill=\"none\" stroke=\"var(--border-dim)\" stroke-width=\"0.4\"/><rect x=\"60\" y=\"28\" width=\"12\" height=\"18\" rx=\"1.5\" fill=\"none\" stroke=\"var(--border-dim)\" stroke-width=\"0.4\"/><rect x=\"28\" y=\"3\" width=\"18\" height=\"12\" rx=\"1.5\" fill=\"none\" stroke=\"var(--border-dim)\" stroke-width=\"0.4\"/><rect x=\"28\" y=\"60\" width=\"18\" height=\"12\" rx=\"1.5\" fill=\"none\" stroke=\"var(--border-dim)\" stroke-width=\"0.4\"/><line x1=\"37.5\" y1=\"22\" x2=\"37.5\" y2=\"53\" stroke=\"var(--border-dim)\" stroke-width=\"0.25\"/><line x1=\"22\" y1=\"37.5\" x2=\"53\" y2=\"37.5\" stroke=\"var(--border-dim)\" stroke-width=\"0.25\"/>",
    "svgViewBox": {
      "w": 75,
      "h": 75
    },
    "walkableGrid": [
      [
        true,
        true,
        true
      ],
      [
        true,
        true,
        true
      ],
      [
        true,
        true,
        true
      ]
    ],
    "tileStates": [
      [
        "walkable",
        "walkable",
        "walkable"
      ],
      [
        "walkable",
        "walkable",
        "walkable"
      ],
      [
        "walkable",
        "walkable",
        "walkable"
      ]
    ],
    "tileEdges": [
      [
        {
          "top": true,
          "left": true
        },
        {
          "top": true
        },
        {
          "top": true,
          "right": true
        }
      ],
      [
        {
          "left": true
        },
        {},
        {
          "right": true
        }
      ],
      [
        {
          "bottom": true,
          "left": true
        },
        {
          "bottom": true
        },
        {
          "right": true,
          "bottom": true
        }
      ]
    ]
  },
  {
    "id": "custom-6d4a5f3f5e",
    "name": "tag1",
    "w": 10,
    "h": 8,
    "origin": "drawn",
    "walkable": false,
    "defaultLabel": "TAG1",
    "tags": [
      "tag1"
    ],
    "walkableGrid": [
      [
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true
      ],
      [
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true
      ],
      [
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true
      ],
      [
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true
      ],
      [
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true
      ],
      [
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true
      ],
      [
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true
      ],
      [
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true
      ]
    ],
    "tileStates": [
      [
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable"
      ],
      [
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable"
      ],
      [
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable"
      ],
      [
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable"
      ],
      [
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable"
      ],
      [
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable"
      ],
      [
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable"
      ],
      [
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "entrance",
        "entrance",
        "walkable",
        "walkable",
        "walkable",
        "walkable"
      ]
    ],
    "tileEdges": [
      [
        {
          "top": true,
          "left": true
        },
        {
          "top": true
        },
        {
          "top": true
        },
        {
          "top": true
        },
        {
          "top": true
        },
        {
          "top": true
        },
        {
          "top": true
        },
        {
          "top": true
        },
        {
          "top": true
        },
        {
          "top": true,
          "right": true
        }
      ],
      [
        {
          "left": true
        },
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {
          "right": true
        }
      ],
      [
        {
          "left": true
        },
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {
          "right": true
        }
      ],
      [
        {
          "left": true
        },
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {
          "right": true
        }
      ],
      [
        {
          "left": true
        },
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {
          "right": true
        }
      ],
      [
        {
          "left": true
        },
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {
          "right": true
        }
      ],
      [
        {
          "left": true
        },
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {
          "right": true
        }
      ],
      [
        {
          "bottom": true,
          "left": true
        },
        {
          "bottom": true
        },
        {
          "bottom": true
        },
        {
          "bottom": true
        },
        {
          "bottom": false
        },
        {
          "bottom": false
        },
        {
          "bottom": true
        },
        {
          "bottom": true
        },
        {
          "bottom": true
        },
        {
          "bottom": true,
          "right": true
        }
      ]
    ],
    "interactSpots": [
      {
        "x": 13,
        "y": 13
      },
      {
        "x": 38,
        "y": 13
      },
      {
        "x": 63,
        "y": 13
      },
      {
        "x": 88,
        "y": 13
      },
      {
        "x": 113,
        "y": 13
      },
      {
        "x": 138,
        "y": 13
      },
      {
        "x": 163,
        "y": 13
      },
      {
        "x": 188,
        "y": 13
      },
      {
        "x": 213,
        "y": 13
      },
      {
        "x": 238,
        "y": 13
      },
      {
        "x": 13,
        "y": 38
      },
      {
        "x": 38,
        "y": 38
      },
      {
        "x": 63,
        "y": 38
      },
      {
        "x": 88,
        "y": 38
      },
      {
        "x": 113,
        "y": 38
      },
      {
        "x": 138,
        "y": 38
      },
      {
        "x": 163,
        "y": 38
      },
      {
        "x": 188,
        "y": 38
      },
      {
        "x": 213,
        "y": 38
      },
      {
        "x": 238,
        "y": 38
      },
      {
        "x": 13,
        "y": 63
      },
      {
        "x": 38,
        "y": 63
      },
      {
        "x": 63,
        "y": 63
      },
      {
        "x": 88,
        "y": 63
      },
      {
        "x": 113,
        "y": 63
      },
      {
        "x": 138,
        "y": 63
      },
      {
        "x": 163,
        "y": 63
      },
      {
        "x": 188,
        "y": 63
      },
      {
        "x": 213,
        "y": 63
      },
      {
        "x": 238,
        "y": 63
      },
      {
        "x": 13,
        "y": 88
      },
      {
        "x": 38,
        "y": 88
      },
      {
        "x": 63,
        "y": 88
      },
      {
        "x": 88,
        "y": 88
      },
      {
        "x": 113,
        "y": 88
      },
      {
        "x": 138,
        "y": 88
      },
      {
        "x": 163,
        "y": 88
      },
      {
        "x": 188,
        "y": 88
      },
      {
        "x": 213,
        "y": 88
      },
      {
        "x": 238,
        "y": 88
      },
      {
        "x": 13,
        "y": 113
      },
      {
        "x": 38,
        "y": 113
      },
      {
        "x": 63,
        "y": 113
      },
      {
        "x": 88,
        "y": 113
      },
      {
        "x": 113,
        "y": 113
      },
      {
        "x": 138,
        "y": 113
      },
      {
        "x": 163,
        "y": 113
      },
      {
        "x": 188,
        "y": 113
      },
      {
        "x": 213,
        "y": 113
      },
      {
        "x": 238,
        "y": 113
      },
      {
        "x": 13,
        "y": 138
      },
      {
        "x": 38,
        "y": 138
      },
      {
        "x": 63,
        "y": 138
      },
      {
        "x": 88,
        "y": 138
      },
      {
        "x": 113,
        "y": 138
      },
      {
        "x": 138,
        "y": 138
      },
      {
        "x": 163,
        "y": 138
      },
      {
        "x": 188,
        "y": 138
      },
      {
        "x": 213,
        "y": 138
      },
      {
        "x": 238,
        "y": 138
      },
      {
        "x": 13,
        "y": 163
      },
      {
        "x": 38,
        "y": 163
      },
      {
        "x": 63,
        "y": 163
      },
      {
        "x": 88,
        "y": 163
      },
      {
        "x": 113,
        "y": 163
      },
      {
        "x": 138,
        "y": 163
      },
      {
        "x": 163,
        "y": 163
      },
      {
        "x": 188,
        "y": 163
      },
      {
        "x": 213,
        "y": 163
      },
      {
        "x": 238,
        "y": 163
      },
      {
        "x": 13,
        "y": 188
      },
      {
        "x": 38,
        "y": 188
      },
      {
        "x": 63,
        "y": 188
      },
      {
        "x": 88,
        "y": 188
      },
      {
        "x": 163,
        "y": 188
      },
      {
        "x": 188,
        "y": 188
      },
      {
        "x": 213,
        "y": 188
      },
      {
        "x": 238,
        "y": 188
      }
    ],
    "interact": {
      "capacity": 1,
      "durationMin": 1,
      "durationMax": 3
    }
  },
  {
    "id": "custom-ab5e7745f7",
    "name": "tag2",
    "w": 6,
    "h": 5,
    "origin": "drawn",
    "walkable": false,
    "defaultLabel": "TAG2",
    "tags": [
      "tag2"
    ],
    "walkableGrid": [
      [
        true,
        true,
        true,
        true,
        true,
        true
      ],
      [
        true,
        true,
        true,
        true,
        true,
        true
      ],
      [
        true,
        true,
        true,
        true,
        true,
        true
      ],
      [
        true,
        true,
        true,
        true,
        true,
        true
      ],
      [
        true,
        true,
        true,
        true,
        true,
        true
      ]
    ],
    "tileStates": [
      [
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable"
      ],
      [
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable"
      ],
      [
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable"
      ],
      [
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable"
      ],
      [
        "walkable",
        "walkable",
        "entrance",
        "entrance",
        "walkable",
        "walkable"
      ]
    ],
    "tileEdges": [
      [
        {
          "top": true,
          "left": true
        },
        {
          "top": true
        },
        {
          "top": true
        },
        {
          "top": true
        },
        {
          "top": true
        },
        {
          "top": true,
          "right": true
        }
      ],
      [
        {
          "left": true
        },
        {},
        {},
        {},
        {},
        {
          "right": true
        }
      ],
      [
        {
          "left": true
        },
        {},
        {},
        {},
        {},
        {
          "right": true
        }
      ],
      [
        {
          "left": true
        },
        {},
        {},
        {},
        {},
        {
          "right": true
        }
      ],
      [
        {
          "bottom": true,
          "left": true
        },
        {
          "bottom": true
        },
        {
          "bottom": false
        },
        {
          "bottom": false
        },
        {
          "bottom": true
        },
        {
          "bottom": true,
          "right": true
        }
      ]
    ],
    "interactSpots": [
      {
        "x": 13,
        "y": 13
      },
      {
        "x": 38,
        "y": 13
      },
      {
        "x": 63,
        "y": 13
      },
      {
        "x": 88,
        "y": 13
      },
      {
        "x": 113,
        "y": 13
      },
      {
        "x": 138,
        "y": 13
      },
      {
        "x": 13,
        "y": 38
      },
      {
        "x": 38,
        "y": 38
      },
      {
        "x": 63,
        "y": 38
      },
      {
        "x": 88,
        "y": 38
      },
      {
        "x": 113,
        "y": 38
      },
      {
        "x": 138,
        "y": 38
      },
      {
        "x": 13,
        "y": 63
      },
      {
        "x": 38,
        "y": 63
      },
      {
        "x": 63,
        "y": 63
      },
      {
        "x": 88,
        "y": 63
      },
      {
        "x": 113,
        "y": 63
      },
      {
        "x": 138,
        "y": 63
      },
      {
        "x": 13,
        "y": 88
      },
      {
        "x": 38,
        "y": 88
      },
      {
        "x": 63,
        "y": 88
      },
      {
        "x": 88,
        "y": 88
      },
      {
        "x": 113,
        "y": 88
      },
      {
        "x": 138,
        "y": 88
      },
      {
        "x": 13,
        "y": 113
      },
      {
        "x": 38,
        "y": 113
      },
      {
        "x": 113,
        "y": 113
      },
      {
        "x": 138,
        "y": 113
      }
    ],
    "interact": {
      "capacity": 1,
      "durationMin": 1,
      "durationMax": 3
    }
  },
  {
    "id": "custom-d0a6afd411",
    "name": "tag3",
    "w": 11,
    "h": 6,
    "origin": "drawn",
    "walkable": false,
    "defaultLabel": "TAG3",
    "tags": [
      "tag3"
    ],
    "walkableGrid": [
      [
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true
      ],
      [
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true
      ],
      [
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true
      ],
      [
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true
      ],
      [
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true
      ],
      [
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true
      ]
    ],
    "tileStates": [
      [
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable"
      ],
      [
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable"
      ],
      [
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable"
      ],
      [
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable"
      ],
      [
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable"
      ],
      [
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "entrance",
        "entrance",
        "entrance",
        "walkable",
        "walkable",
        "walkable",
        "walkable"
      ]
    ],
    "tileEdges": [
      [
        {
          "top": true,
          "left": true
        },
        {
          "top": true
        },
        {
          "top": true
        },
        {
          "top": true
        },
        {
          "top": true
        },
        {
          "top": true
        },
        {
          "top": true
        },
        {
          "top": true
        },
        {
          "top": true
        },
        {
          "top": true
        },
        {
          "top": true,
          "right": true
        }
      ],
      [
        {
          "left": true
        },
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {
          "right": true
        }
      ],
      [
        {
          "left": true
        },
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {
          "right": true
        }
      ],
      [
        {
          "left": true
        },
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {
          "right": true
        }
      ],
      [
        {
          "left": true
        },
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {
          "right": true
        }
      ],
      [
        {
          "bottom": true,
          "left": true
        },
        {
          "bottom": true
        },
        {
          "bottom": true
        },
        {
          "bottom": true
        },
        {
          "bottom": false
        },
        {
          "bottom": false
        },
        {
          "bottom": false
        },
        {
          "bottom": true
        },
        {
          "bottom": true
        },
        {
          "bottom": true
        },
        {
          "bottom": true,
          "right": true
        }
      ]
    ],
    "interactSpots": [
      {
        "x": 13,
        "y": 13
      },
      {
        "x": 38,
        "y": 13
      },
      {
        "x": 63,
        "y": 13
      },
      {
        "x": 88,
        "y": 13
      },
      {
        "x": 113,
        "y": 13
      },
      {
        "x": 138,
        "y": 13
      },
      {
        "x": 163,
        "y": 13
      },
      {
        "x": 188,
        "y": 13
      },
      {
        "x": 213,
        "y": 13
      },
      {
        "x": 238,
        "y": 13
      },
      {
        "x": 263,
        "y": 13
      },
      {
        "x": 13,
        "y": 38
      },
      {
        "x": 38,
        "y": 38
      },
      {
        "x": 63,
        "y": 38
      },
      {
        "x": 88,
        "y": 38
      },
      {
        "x": 113,
        "y": 38
      },
      {
        "x": 138,
        "y": 38
      },
      {
        "x": 163,
        "y": 38
      },
      {
        "x": 188,
        "y": 38
      },
      {
        "x": 213,
        "y": 38
      },
      {
        "x": 238,
        "y": 38
      },
      {
        "x": 263,
        "y": 38
      },
      {
        "x": 13,
        "y": 63
      },
      {
        "x": 38,
        "y": 63
      },
      {
        "x": 63,
        "y": 63
      },
      {
        "x": 88,
        "y": 63
      },
      {
        "x": 113,
        "y": 63
      },
      {
        "x": 138,
        "y": 63
      },
      {
        "x": 163,
        "y": 63
      },
      {
        "x": 188,
        "y": 63
      },
      {
        "x": 213,
        "y": 63
      },
      {
        "x": 238,
        "y": 63
      },
      {
        "x": 263,
        "y": 63
      },
      {
        "x": 13,
        "y": 88
      },
      {
        "x": 38,
        "y": 88
      },
      {
        "x": 63,
        "y": 88
      },
      {
        "x": 88,
        "y": 88
      },
      {
        "x": 113,
        "y": 88
      },
      {
        "x": 138,
        "y": 88
      },
      {
        "x": 163,
        "y": 88
      },
      {
        "x": 188,
        "y": 88
      },
      {
        "x": 213,
        "y": 88
      },
      {
        "x": 238,
        "y": 88
      },
      {
        "x": 263,
        "y": 88
      },
      {
        "x": 13,
        "y": 113
      },
      {
        "x": 38,
        "y": 113
      },
      {
        "x": 63,
        "y": 113
      },
      {
        "x": 88,
        "y": 113
      },
      {
        "x": 113,
        "y": 113
      },
      {
        "x": 138,
        "y": 113
      },
      {
        "x": 163,
        "y": 113
      },
      {
        "x": 188,
        "y": 113
      },
      {
        "x": 213,
        "y": 113
      },
      {
        "x": 238,
        "y": 113
      },
      {
        "x": 263,
        "y": 113
      },
      {
        "x": 13,
        "y": 138
      },
      {
        "x": 38,
        "y": 138
      },
      {
        "x": 63,
        "y": 138
      },
      {
        "x": 88,
        "y": 138
      },
      {
        "x": 188,
        "y": 138
      },
      {
        "x": 213,
        "y": 138
      },
      {
        "x": 238,
        "y": 138
      },
      {
        "x": 263,
        "y": 138
      }
    ],
    "interact": {
      "capacity": 1,
      "durationMin": 1,
      "durationMax": 3
    }
  },
  {
    "id": "custom-bc2c22e260",
    "name": "tag4",
    "w": 8,
    "h": 8,
    "origin": "drawn",
    "walkable": false,
    "defaultLabel": "TAG4",
    "tags": [
      "tag4"
    ],
    "walkableGrid": [
      [
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true
      ],
      [
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true
      ],
      [
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true
      ],
      [
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true
      ],
      [
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true
      ],
      [
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true
      ],
      [
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true
      ],
      [
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true
      ]
    ],
    "tileStates": [
      [
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable"
      ],
      [
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable"
      ],
      [
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable"
      ],
      [
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable"
      ],
      [
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable"
      ],
      [
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable"
      ],
      [
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable",
        "walkable"
      ],
      [
        "walkable",
        "walkable",
        "walkable",
        "entrance",
        "entrance",
        "walkable",
        "walkable",
        "walkable"
      ]
    ],
    "tileEdges": [
      [
        {
          "top": true,
          "left": true
        },
        {
          "top": true
        },
        {
          "top": true
        },
        {
          "top": true
        },
        {
          "top": true
        },
        {
          "top": true
        },
        {
          "top": true
        },
        {
          "top": true,
          "right": true
        }
      ],
      [
        {
          "left": true
        },
        {},
        {},
        {},
        {},
        {},
        {},
        {
          "right": true
        }
      ],
      [
        {
          "left": true
        },
        {},
        {},
        {},
        {},
        {},
        {},
        {
          "right": true
        }
      ],
      [
        {
          "left": true
        },
        {},
        {},
        {},
        {},
        {},
        {},
        {
          "right": true
        }
      ],
      [
        {
          "left": true
        },
        {},
        {},
        {},
        {},
        {},
        {},
        {
          "right": true
        }
      ],
      [
        {
          "left": true
        },
        {},
        {},
        {},
        {},
        {},
        {},
        {
          "right": true
        }
      ],
      [
        {
          "left": true
        },
        {},
        {},
        {},
        {},
        {},
        {},
        {
          "right": true
        }
      ],
      [
        {
          "bottom": true,
          "left": true
        },
        {
          "bottom": true
        },
        {
          "bottom": true
        },
        {
          "bottom": false
        },
        {
          "bottom": false
        },
        {
          "bottom": true
        },
        {
          "bottom": true
        },
        {
          "bottom": true,
          "right": true
        }
      ]
    ],
    "interactSpots": [
      {
        "x": 13,
        "y": 13
      },
      {
        "x": 38,
        "y": 13
      },
      {
        "x": 63,
        "y": 13
      },
      {
        "x": 88,
        "y": 13
      },
      {
        "x": 113,
        "y": 13
      },
      {
        "x": 138,
        "y": 13
      },
      {
        "x": 163,
        "y": 13
      },
      {
        "x": 188,
        "y": 13
      },
      {
        "x": 13,
        "y": 38
      },
      {
        "x": 38,
        "y": 38
      },
      {
        "x": 63,
        "y": 38
      },
      {
        "x": 88,
        "y": 38
      },
      {
        "x": 113,
        "y": 38
      },
      {
        "x": 138,
        "y": 38
      },
      {
        "x": 163,
        "y": 38
      },
      {
        "x": 188,
        "y": 38
      },
      {
        "x": 13,
        "y": 63
      },
      {
        "x": 38,
        "y": 63
      },
      {
        "x": 63,
        "y": 63
      },
      {
        "x": 88,
        "y": 63
      },
      {
        "x": 113,
        "y": 63
      },
      {
        "x": 138,
        "y": 63
      },
      {
        "x": 163,
        "y": 63
      },
      {
        "x": 188,
        "y": 63
      },
      {
        "x": 13,
        "y": 88
      },
      {
        "x": 38,
        "y": 88
      },
      {
        "x": 63,
        "y": 88
      },
      {
        "x": 88,
        "y": 88
      },
      {
        "x": 113,
        "y": 88
      },
      {
        "x": 138,
        "y": 88
      },
      {
        "x": 163,
        "y": 88
      },
      {
        "x": 188,
        "y": 88
      },
      {
        "x": 13,
        "y": 113
      },
      {
        "x": 38,
        "y": 113
      },
      {
        "x": 63,
        "y": 113
      },
      {
        "x": 88,
        "y": 113
      },
      {
        "x": 113,
        "y": 113
      },
      {
        "x": 138,
        "y": 113
      },
      {
        "x": 163,
        "y": 113
      },
      {
        "x": 188,
        "y": 113
      },
      {
        "x": 13,
        "y": 138
      },
      {
        "x": 38,
        "y": 138
      },
      {
        "x": 63,
        "y": 138
      },
      {
        "x": 88,
        "y": 138
      },
      {
        "x": 113,
        "y": 138
      },
      {
        "x": 138,
        "y": 138
      },
      {
        "x": 163,
        "y": 138
      },
      {
        "x": 188,
        "y": 138
      },
      {
        "x": 13,
        "y": 163
      },
      {
        "x": 38,
        "y": 163
      },
      {
        "x": 63,
        "y": 163
      },
      {
        "x": 88,
        "y": 163
      },
      {
        "x": 113,
        "y": 163
      },
      {
        "x": 138,
        "y": 163
      },
      {
        "x": 163,
        "y": 163
      },
      {
        "x": 188,
        "y": 163
      },
      {
        "x": 13,
        "y": 188
      },
      {
        "x": 38,
        "y": 188
      },
      {
        "x": 63,
        "y": 188
      },
      {
        "x": 138,
        "y": 188
      },
      {
        "x": 163,
        "y": 188
      },
      {
        "x": 188,
        "y": 188
      }
    ],
    "interact": {
      "capacity": 1,
      "durationMin": 1,
      "durationMax": 3
    }
  }
]
