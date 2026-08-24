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
    "svg": "<rect x=\"2\" y=\"1\" width=\"46\" height=\"4\" rx=\"1.2\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.4\"/><rect x=\"2\" y=\"5\" width=\"6\" height=\"18\" rx=\"1.5\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.4\"/><rect x=\"42\" y=\"5\" width=\"6\" height=\"18\" rx=\"1.5\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.4\"/><rect x=\"9\" y=\"5\" width=\"15.5\" height=\"18\" rx=\"1\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.35\"/><rect x=\"25.5\" y=\"5\" width=\"15.5\" height=\"18\" rx=\"1\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.35\"/>",
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
    "svg": "<rect x=\"1\" y=\"4\" width=\"23\" height=\"44\" rx=\"2\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.4\"/><rect x=\"1\" y=\"1\" width=\"23\" height=\"3\" rx=\"1\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.4\"/><rect x=\"3.5\" y=\"5.5\" width=\"18\" height=\"8\" rx=\"2\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.35\"/><line x1=\"1\" y1=\"30\" x2=\"24\" y2=\"30\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.3\"/><line x1=\"12.5\" y1=\"30\" x2=\"12.5\" y2=\"47\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.25\"/>",
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
    "defaultBgColor": "transparent",
    "defaultLabelColor": "#444",
    "tags": [
      "portal"
    ],
    "svg": "<defs><marker id=\"arrow\" viewBox=\"0 0 10 10\" refX=\"8\" refY=\"5\" markerWidth=\"5\" markerHeight=\"5\" orient=\"auto-start-reverse\"><path d=\"M2 1L8 5L2 9\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></marker></defs><rect x=\"1\" y=\"1\" width=\"73\" height=\"73\" rx=\"2\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.5\"/><rect x=\"5\" y=\"5\" width=\"65\" height=\"60\" rx=\"2\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.3\"/><line x1=\"1\" y1=\"68\" x2=\"74\" y2=\"68\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.4\"/><rect x=\"6\" y=\"69\" width=\"30.5\" height=\"5\" rx=\"0.5\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.35\"/><rect x=\"38.5\" y=\"69\" width=\"30.5\" height=\"5\" rx=\"0.5\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.35\"/><line x1=\"34\" y1=\"71.5\" x2=\"26\" y2=\"71.5\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.4\" marker-end=\"url(#arrow)\"/><line x1=\"41\" y1=\"71.5\" x2=\"49\" y2=\"71.5\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.4\" marker-end=\"url(#arrow)\"/><rect x=\"30\" y=\"8\" width=\"15\" height=\"7\" rx=\"1\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.3\"/><circle cx=\"8\" cy=\"71.5\" r=\"1.3\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.3\"/>",
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
        "entrance",
        "entrance",
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
          "bottom": false,
          "left": false
        },
        {
          "bottom": false
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
    },
    "queue": {
      "maxMembers": 3,
      "admissionDepth": 4
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
    "defaultBgColor": "#ffffff",
    "defaultLabelColor": "#444",
    "svg": "<rect x=\"20\" y=\"20\" width=\"35\" height=\"35\" rx=\"2\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.5\"/><rect x=\"22\" y=\"22\" width=\"31\" height=\"31\" rx=\"1\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.3\"/><rect x=\"3\" y=\"28\" width=\"12\" height=\"18\" rx=\"1.5\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.4\"/><rect x=\"60\" y=\"28\" width=\"12\" height=\"18\" rx=\"1.5\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.4\"/><rect x=\"28\" y=\"3\" width=\"18\" height=\"12\" rx=\"1.5\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.4\"/><rect x=\"28\" y=\"60\" width=\"18\" height=\"12\" rx=\"1.5\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.4\"/><line x1=\"37.5\" y1=\"22\" x2=\"37.5\" y2=\"53\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.25\"/><line x1=\"22\" y1=\"37.5\" x2=\"53\" y2=\"37.5\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.25\"/>",
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
    "id": "builtin-bathroom-1",
    "name": "Bathroom",
    "w": 3,
    "h": 3,
    "origin": "svg-import",
    "category": "Special",
    "walkable": false,
    "defaultBgColor": "#fff",
    "defaultLabelColor": "#444",
    "defaultLabel": "WC",
    "tags": [
      "bathroom"
    ],
    "svg": "<rect x=\"1\" y=\"1\" width=\"73\" height=\"73\" rx=\"2\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.5\"/><rect x=\"6\" y=\"6\" width=\"63\" height=\"63\" rx=\"1\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.3\"/><line x1=\"28\" y1=\"70\" x2=\"47\" y2=\"70\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.45\"/><rect x=\"51\" y=\"9\" width=\"17\" height=\"7\" rx=\"1\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.35\"/><ellipse cx=\"59.5\" cy=\"24\" rx=\"7\" ry=\"8\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.4\"/><circle cx=\"15\" cy=\"17\" r=\"6\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.4\"/><line x1=\"13\" y1=\"11\" x2=\"17\" y2=\"11\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.3\"/><rect x=\"50\" y=\"49\" width=\"17\" height=\"17\" rx=\"1\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.35\"/><line x1=\"50\" y1=\"66\" x2=\"67\" y2=\"49\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.25\"/><line x1=\"8\" y1=\"40\" x2=\"30\" y2=\"40\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.3\"/><line x1=\"8\" y1=\"46\" x2=\"30\" y2=\"46\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.3\"/>",
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
        "entrance",
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
          "bottom": false
        },
        {
          "bottom": true,
          "right": true
        }
      ]
    ],
    "interactSpots": [
      {
        "x": 62.5,
        "y": 37.5
      }
    ],
    "interact": {
      "capacity": 1,
      "durationMin": 3,
      "durationMax": 6
    },
    "queue": {
      "maxMembers": 2,
      "admissionDepth": 4
    }
  },
  {
    "id": "builtin-bedroom-1",
    "name": "Bedroom",
    "w": 6,
    "h": 6,
    "origin": "svg-import",
    "category": "Special",
    "walkable": false,
    "defaultBgColor": "#fff",
    "defaultLabelColor": "#444",
    "defaultLabel": "BEDROOM",
    "tags": [
      "bedroom"
    ],
    "svg": "<rect x=\"1\" y=\"1\" width=\"148\" height=\"148\" rx=\"2\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.5\"/><rect x=\"6\" y=\"6\" width=\"138\" height=\"138\" rx=\"1\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.3\"/><line x1=\"100\" y1=\"6\" x2=\"100\" y2=\"70\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.45\"/><line x1=\"100\" y1=\"75\" x2=\"105\" y2=\"75\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.45\"/><line x1=\"119\" y1=\"75\" x2=\"144\" y2=\"75\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.45\"/><line x1=\"52\" y1=\"143\" x2=\"73\" y2=\"143\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.45\"/><rect x=\"10\" y=\"9\" width=\"48\" height=\"10\" rx=\"1\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.4\"/><rect x=\"10\" y=\"21\" width=\"48\" height=\"44\" rx=\"2\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.4\"/><rect x=\"15\" y=\"24\" width=\"18\" height=\"9\" rx=\"2\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.3\"/><rect x=\"37\" y=\"24\" width=\"18\" height=\"9\" rx=\"2\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.3\"/><line x1=\"10\" y1=\"38\" x2=\"58\" y2=\"38\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.25\"/><line x1=\"10\" y1=\"44\" x2=\"58\" y2=\"44\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.2\"/><rect x=\"64\" y=\"9\" width=\"15\" height=\"15\" rx=\"1\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.35\"/><circle cx=\"71.5\" cy=\"16.5\" r=\"3\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.3\"/><ellipse cx=\"72\" cy=\"98\" rx=\"26\" ry=\"15\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.25\"/><rect x=\"129\" y=\"96\" width=\"11\" height=\"42\" rx=\"1\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.35\"/><line x1=\"129\" y1=\"117\" x2=\"140\" y2=\"117\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.25\"/><rect x=\"127\" y=\"8\" width=\"17\" height=\"7\" rx=\"1\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.35\"/><ellipse cx=\"135.5\" cy=\"23\" rx=\"6.5\" ry=\"7.5\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.4\"/><circle cx=\"109\" cy=\"16\" r=\"5.5\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.4\"/><line x1=\"106\" y1=\"10\" x2=\"112\" y2=\"10\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.3\"/><rect x=\"103\" y=\"42\" width=\"39\" height=\"29\" rx=\"1\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.35\"/><line x1=\"103\" y1=\"71\" x2=\"142\" y2=\"42\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.25\"/>",
    "svgViewBox": {
      "w": 150,
      "h": 150
    },
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
        "walkable",
        "walkable",
        "walkable",
        "walkable"
      ],
      [
        "walkable",
        "walkable",
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
          "top": true,
          "right": true
        },
        {
          "top": true,
          "left": true
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
        {
          "right": true
        },
        {
          "left": true
        },
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
        {
          "right": true
        },
        {
          "left": true
        },
        {
          "right": true,
          "bottom": true
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
          "bottom": true,
          "left": true
        },
        {
          "bottom": true
        },
        {},
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
    ]
  },
  {
    "id": "builtin-chair-1",
    "name": "Chair",
    "w": 1,
    "h": 1,
    "origin": "svg-import",
    "category": "Furniture",
    "walkable": false,
    "defaultBgColor": "#fff",
    "defaultLabelColor": "#444",
    "defaultLabel": "Chair",
    "svg": "<rect x=\"4\" y=\"2\" width=\"17\" height=\"5\" rx=\"1.5\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.4\"/><rect x=\"5\" y=\"9\" width=\"15\" height=\"13\" rx=\"2\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.4\"/><line x1=\"7\" y1=\"20\" x2=\"7\" y2=\"23\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.3\"/><line x1=\"18\" y1=\"20\" x2=\"18\" y2=\"23\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.3\"/>",
    "svgViewBox": {
      "w": 25,
      "h": 25
    },
    "walkableGrid": [
      [
        false
      ]
    ]
  },
  {
    "id": "builtin-table-2x1",
    "name": "Table 2x1",
    "w": 2,
    "h": 1,
    "origin": "svg-import",
    "category": "Furniture",
    "walkable": false,
    "defaultBgColor": "#fff",
    "defaultLabelColor": "#444",
    "defaultLabel": "Table",
    "svg": "<rect x=\"3\" y=\"4\" width=\"44\" height=\"17\" rx=\"3\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.45\"/><line x1=\"9\" y1=\"12.5\" x2=\"41\" y2=\"12.5\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.25\"/>",
    "svgViewBox": {
      "w": 50,
      "h": 25
    },
    "walkableGrid": [
      [
        false,
        false
      ]
    ]
  },
  {
    "id": "builtin-table-2x2",
    "name": "Table 2x2",
    "w": 2,
    "h": 2,
    "origin": "svg-import",
    "category": "Furniture",
    "walkable": false,
    "defaultBgColor": "#fff",
    "defaultLabelColor": "#444",
    "defaultLabel": "Table",
    "svg": "<rect x=\"3\" y=\"3\" width=\"44\" height=\"44\" rx=\"3\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.45\"/><line x1=\"8\" y1=\"25\" x2=\"42\" y2=\"25\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.25\"/><line x1=\"25\" y1=\"8\" x2=\"25\" y2=\"42\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.25\"/><circle cx=\"25\" cy=\"25\" r=\"5\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.35\"/>",
    "svgViewBox": {
      "w": 50,
      "h": 50
    },
    "walkableGrid": [
      [
        false,
        false
      ],
      [
        false,
        false
      ]
    ]
  },
  {
    "id": "builtin-reception-bar-1",
    "name": "Reception Bar",
    "w": 7,
    "h": 1,
    "origin": "svg-import",
    "category": "Furniture",
    "walkable": false,
    "defaultBgColor": "#fff",
    "defaultLabelColor": "#444",
    "defaultLabel": "RECEPTION",
    "tags": [
      "reception"
    ],
    "svg": "<rect x=\"2\" y=\"5\" width=\"171\" height=\"15\" rx=\"2\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.5\"/><line x1=\"2\" y1=\"22\" x2=\"173\" y2=\"22\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.25\"/><line x1=\"27\" y1=\"5\" x2=\"27\" y2=\"20\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.2\"/><line x1=\"52\" y1=\"5\" x2=\"52\" y2=\"20\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.2\"/><line x1=\"77\" y1=\"5\" x2=\"77\" y2=\"20\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.2\"/><line x1=\"102\" y1=\"5\" x2=\"102\" y2=\"20\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.2\"/><line x1=\"127\" y1=\"5\" x2=\"127\" y2=\"20\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.2\"/><circle cx=\"162\" cy=\"12.5\" r=\"3\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.35\"/><circle cx=\"162\" cy=\"12.5\" r=\"1\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.3\"/>",
    "svgViewBox": {
      "w": 175,
      "h": 25
    },
    "walkableGrid": [
      [
        false,
        false,
        false,
        false,
        false,
        false,
        false
      ]
    ]
  },
  {
    "id": "builtin-vending-1",
    "name": "Vending Machine",
    "w": 1,
    "h": 2,
    "origin": "svg-import",
    "category": "Furniture",
    "walkable": false,
    "defaultBgColor": "#fff",
    "defaultLabelColor": "#444",
    "defaultLabel": "VENDING",
    "tags": [
      "vending"
    ],
    "svg": "<rect x=\"3\" y=\"3\" width=\"19\" height=\"44\" rx=\"2\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.45\"/><rect x=\"6\" y=\"7\" width=\"13\" height=\"20\" rx=\"1\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.3\"/><rect x=\"8\" y=\"10\" width=\"3\" height=\"7\" rx=\"0.5\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.25\"/><rect x=\"13\" y=\"10\" width=\"3\" height=\"7\" rx=\"0.5\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.25\"/><rect x=\"8\" y=\"19\" width=\"3\" height=\"6\" rx=\"0.5\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.25\"/><rect x=\"13\" y=\"19\" width=\"3\" height=\"6\" rx=\"0.5\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.25\"/><rect x=\"6\" y=\"33\" width=\"13\" height=\"9\" rx=\"1\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.35\"/><line x1=\"6\" y1=\"37.5\" x2=\"19\" y2=\"37.5\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.25\"/>",
    "svgViewBox": {
      "w": 25,
      "h": 50
    },
    "walkableGrid": [
      [
        false
      ],
      [
        false
      ]
    ]
  },
  {
    "id": "builtin-plant-1",
    "name": "Plant",
    "w": 1,
    "h": 1,
    "origin": "svg-import",
    "category": "Furniture",
    "walkable": false,
    "defaultBgColor": "#fff",
    "defaultLabelColor": "#444",
    "svg": "<circle cx=\"12.5\" cy=\"10\" r=\"7\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.4\"/><circle cx=\"8.5\" cy=\"7.5\" r=\"3.5\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.3\"/><circle cx=\"16.5\" cy=\"7.5\" r=\"3.5\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.3\"/><circle cx=\"12.5\" cy=\"5\" r=\"3\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.3\"/><path d=\"M8 16 L17 16 L15.5 23 L9.5 23 Z\" fill=\"var(--obj-fill,none)\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.4\"/><line x1=\"12.5\" y1=\"16\" x2=\"12.5\" y2=\"19\" stroke=\"var(--obj-stroke,var(--border-dim))\" stroke-width=\"0.25\"/>",
    "svgViewBox": {
      "w": 25,
      "h": 25
    },
    "walkableGrid": [
      [
        false
      ]
    ]
  }
]
