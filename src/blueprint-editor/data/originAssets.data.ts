export const originAssetsData = [
  {
    "id": "table-1",
    "name": "Table 1",
    "w": 2,
    "h": 1,
    "walkable": false,
    "defaultPadding": 3,
    "defaultRx": {
      "tl": 4,
      "tr": 4,
      "br": 4,
      "bl": 4
    },
    "defaultFillColor": "#ffffff",
    "defaultStrokeColor": "#ffffff",
    "tags": [
      "lounge"
    ],
    "origin": "drawn",
    "usePx": true,
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
    "interactSpots": [
      {
        "kind": "stand",
        "x": 13,
        "y": 13
      },
      {
        "kind": "stand",
        "x": 38,
        "y": 13
      }
    ],
    "interact": {
      "capacity": 1,
      "durationMin": 1,
      "durationMax": 3
    },
    "queue": {
      "maxMembers": 3,
      "admissionDepth": 4
    }
  },
  {
    "id": "chair",
    "name": "Chair",
    "w": 1,
    "h": 1,
    "walkable": true,
    "defaultPadding": 5,
    "defaultRx": {
      "tl": 4,
      "tr": 4,
      "br": 4,
      "bl": 4
    },
    "defaultFillColor": "#ffffff",
    "tags": [
      "lounge"
    ],
    "origin": "drawn",
    "walkableGrid": [
      [
        true
      ]
    ],
    "tileStates": [
      [
        "walkable"
      ]
    ],
    "interactSpots": [
      {
        "kind": "stand",
        "x": 13,
        "y": 13
      }
    ],
    "interact": {
      "capacity": 1,
      "durationMin": 1,
      "durationMax": 3
    },
    "queue": {
      "maxMembers": 3,
      "admissionDepth": 4
    }
  },
  {
    "id": "table-set",
    "name": "Table Set",
    "w": 2,
    "h": 3,
    "walkable": true,
    "tags": [
      "lounge"
    ],
    "origin": "flattened",
    "svg": "<path d=\"M 7 28 L 43 28 Q 47 28 47 32 L 47 43 Q 47 47 43 47 L 7 47 Q 3 47 3 43 L 3 32 Q 3 28 7 28 Z\" fill=\"var(--obj-fill,#ffffff)\" stroke=\"var(--obj-stroke,#ffffff)\" stroke-width=\"1\"/>\n  <path d=\"M 9 5 L 16 5 Q 20 5 20 9 L 20 16 Q 20 20 16 20 L 9 20 Q 5 20 5 16 L 5 9 Q 5 5 9 5 Z\" fill=\"var(--obj-fill,#ffffff)\" stroke=\"var(--text-secondary)\" stroke-width=\"1\"/>\n  <path d=\"M 34 5 L 41 5 Q 45 5 45 9 L 45 16 Q 45 20 41 20 L 34 20 Q 30 20 30 16 L 30 9 Q 30 5 34 5 Z\" fill=\"var(--obj-fill,#ffffff)\" stroke=\"var(--text-secondary)\" stroke-width=\"1\"/>\n  <path d=\"M 9 55 L 16 55 Q 20 55 20 59 L 20 66 Q 20 70 16 70 L 9 70 Q 5 70 5 66 L 5 59 Q 5 55 9 55 Z\" fill=\"var(--obj-fill,#ffffff)\" stroke=\"var(--text-secondary)\" stroke-width=\"1\"/>\n  <path d=\"M 34 55 L 41 55 Q 45 55 45 59 L 45 66 Q 45 70 41 70 L 34 70 Q 30 70 30 66 L 30 59 Q 30 55 34 55 Z\" fill=\"var(--obj-fill,#ffffff)\" stroke=\"var(--text-secondary)\" stroke-width=\"1\"/>",
    "svgViewBox": {
      "w": 50,
      "h": 75
    },
    "walkableGrid": [
      [
        true,
        true
      ],
      [
        true,
        true
      ],
      [
        true,
        true
      ]
    ],
    "tileStates": [
      [
        "walkable",
        "walkable"
      ],
      [
        "walkable",
        "walkable"
      ],
      [
        "walkable",
        "walkable"
      ]
    ],
    "interactSpots": [
      {
        "kind": "stand",
        "x": 13,
        "y": 63
      },
      {
        "kind": "stand",
        "x": 13,
        "y": 13
      },
      {
        "kind": "stand",
        "x": 38,
        "y": 13
      },
      {
        "kind": "stand",
        "x": 38,
        "y": 63
      }
    ],
    "interact": {
      "capacity": 1,
      "durationMin": 1,
      "durationMax": 3
    },
    "queue": {
      "maxMembers": 3,
      "admissionDepth": 4
    }
  },
  {
    "id": "double-bed-1",
    "name": "Double Bed",
    "w": 2,
    "h": 2,
    "category": "Special",
    "walkable": true,
    "defaultFillColor": "#ffffff",
    "tags": [
      "living"
    ],
    "origin": "svg-import",
    "svg": "<rect x=\"1.5\" y=\"1.5\" width=\"47\" height=\"47\" rx=\"2\" fill=\"var(--obj-fill,#ffffff)\" stroke=\"var(--obj-stroke,#ffffff)\" stroke-width=\"1\"/><rect x=\"1.5\" y=\"1.5\" width=\"47\" height=\"6\" rx=\"1.5\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.7\"/><rect x=\"6\" y=\"10\" width=\"17\" height=\"9\" rx=\"2.5\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.6\"/><rect x=\"27\" y=\"10\" width=\"17\" height=\"9\" rx=\"2.5\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.6\"/><line x1=\"1.5\" y1=\"31\" x2=\"48.5\" y2=\"31\" stroke=\"var(--text-secondary)\" stroke-width=\"0.5\"/><line x1=\"25\" y1=\"31\" x2=\"25\" y2=\"48\" stroke=\"var(--text-secondary)\" stroke-width=\"0.45\"/>",
    "svgViewBox": {
      "w": 50,
      "h": 50
    },
    "walkableGrid": [
      [
        true,
        true
      ],
      [
        true,
        true
      ]
    ],
    "tileStates": [
      [
        "walkable",
        "walkable"
      ],
      [
        "walkable",
        "walkable"
      ]
    ],
    "interactSpots": [
      {
        "kind": "stand",
        "x": 14,
        "y": 25
      },
      {
        "kind": "stand",
        "x": 36,
        "y": 25
      }
    ],
    "interact": {
      "capacity": 1,
      "durationMin": 30,
      "durationMax": 60
    },
    "queue": {
      "maxMembers": 3,
      "admissionDepth": 4
    }
  },
  {
    "id": "washer-1",
    "name": "Washing Machine",
    "w": 1,
    "h": 1,
    "category": "Special",
    "walkable": false,
    "defaultFillColor": "#ffffff",
    "origin": "svg-import",
    "svg": "<rect x=\"2\" y=\"2\" width=\"21\" height=\"21\" rx=\"2\" fill=\"var(--obj-fill,#ffffff)\" stroke=\"var(--obj-stroke,#ffffff)\" stroke-width=\"1\"/><rect x=\"4.5\" y=\"4.5\" width=\"16\" height=\"4.5\" rx=\"1\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.8\"/><circle cx=\"10.5\" cy=\"6.75\" r=\"0.9\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.5\"/><circle cx=\"12.5\" cy=\"15.5\" r=\"5.5\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.9\"/><circle cx=\"12.5\" cy=\"15.5\" r=\"3.4\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.6\"/>",
    "svgViewBox": {
      "w": 25,
      "h": 25
    },
    "walkableGrid": [
      [
        false
      ]
    ],
    "tileStates": [
      [
        "blocked"
      ]
    ],
    "interactSpots": [
      {
        "kind": "stand",
        "x": 12.5,
        "y": 30
      }
    ],
    "interact": {
      "capacity": 1,
      "durationMin": 10,
      "durationMax": 20
    },
    "queue": {
      "maxMembers": 3,
      "admissionDepth": 4
    }
  },
  {
    "id": "treadmill-1",
    "name": "Treadmill",
    "w": 1,
    "h": 2,
    "category": "Special",
    "walkable": true,
    "defaultFillColor": "#ffffff",
    "origin": "svg-import",
    "svg": "<rect x=\"1\" y=\"1\" width=\"23\" height=\"48\" rx=\"2\" fill=\"var(--obj-fill,#ffffff)\" stroke=\"var(--obj-stroke,#ffffff)\" stroke-width=\"1\"/><path d=\"M 3.5 8 H 21.5 M 3.5 15 H 21.5 M 3.5 22 H 21.5 M 3.5 29 H 21.5 M 3.5 36 H 21.5\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.55\"/><rect x=\"3.5\" y=\"41.5\" width=\"18\" height=\"6.5\" rx=\"1.2\" fill=\"var(--obj-fill,#ffffff)\" stroke=\"var(--obj-stroke,#ffffff)\" stroke-width=\"0.9\"/><line x1=\"6\" y1=\"44.75\" x2=\"19\" y2=\"44.75\" stroke=\"var(--text-secondary)\" stroke-width=\"0.6\"/>",
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
    "interactSpots": [
      {
        "kind": "stand",
        "x": 12.5,
        "y": 20
      }
    ],
    "interact": {
      "capacity": 1,
      "durationMin": 10,
      "durationMax": 25
    },
    "queue": {
      "maxMembers": 3,
      "admissionDepth": 4
    }
  },
  {
    "id": "kitchen-table-1",
    "name": "Kitchen Table",
    "w": 2,
    "h": 1,
    "category": "Special",
    "walkable": false,
    "defaultFillColor": "#ffffff",
    "tags": [
      "cooking"
    ],
    "origin": "svg-import",
    "svg": "<rect x=\"1\" y=\"2\" width=\"48\" height=\"21\" rx=\"2\" fill=\"var(--obj-fill,#ffffff)\" stroke=\"var(--obj-stroke,#ffffff)\" stroke-width=\"1\"/><circle cx=\"13.5\" cy=\"12.5\" r=\"8\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.9\"/><circle cx=\"13.5\" cy=\"12.5\" r=\"4.5\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.6\"/><circle cx=\"13.5\" cy=\"12.5\" r=\"1.2\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.5\"/><rect x=\"28.5\" y=\"4.5\" width=\"17\" height=\"16\" rx=\"2\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.8\"/><rect x=\"32\" y=\"8.5\" width=\"10\" height=\"8\" rx=\"1\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.5\"/>",
    "svgViewBox": {
      "w": 50,
      "h": 25
    },
    "walkableGrid": [
      [
        false,
        false
      ]
    ],
    "tileStates": [
      [
        "blocked",
        "blocked"
      ]
    ],
    "interactSpots": [
      {
        "kind": "stand",
        "x": 25,
        "y": 31,
        "post": "kitchen-station"
      }
    ],
    "interact": {
      "capacity": 2,
      "durationMin": 5,
      "durationMax": 15
    },
    "queue": {
      "maxMembers": 3,
      "admissionDepth": 4
    }
  },
  {
    "id": "sofa-1",
    "name": "Sofa",
    "w": 2,
    "h": 1,
    "category": "Special",
    "walkable": true,
    "defaultFillColor": "#ffffff",
    "tags": [
      "lounge"
    ],
    "origin": "svg-import",
    "svg": "<rect x=\"2\" y=\"4\" width=\"46\" height=\"18\" rx=\"3\" fill=\"var(--obj-fill,#ffffff)\" stroke=\"var(--obj-stroke,#ffffff)\" stroke-width=\"1\"/><rect x=\"7\" y=\"4\" width=\"36\" height=\"6\" rx=\"2\" fill=\"var(--obj-fill,#ffffff)\" stroke=\"var(--obj-stroke,#ffffff)\" stroke-width=\"0.8\"/><rect x=\"2\" y=\"4\" width=\"5\" height=\"18\" rx=\"2\" fill=\"var(--obj-fill,#ffffff)\" stroke=\"var(--obj-stroke,#ffffff)\" stroke-width=\"0.9\"/><rect x=\"43\" y=\"4\" width=\"5\" height=\"18\" rx=\"2\" fill=\"var(--obj-fill,#ffffff)\" stroke=\"var(--obj-stroke,#ffffff)\" stroke-width=\"0.9\"/>",
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
    "interactSpots": [
      {
        "kind": "stand",
        "x": 14,
        "y": 15
      },
      {
        "kind": "stand",
        "x": 36,
        "y": 15
      }
    ],
    "interact": {
      "capacity": 1,
      "durationMin": 8,
      "durationMax": 20
    },
    "queue": {
      "maxMembers": 3,
      "admissionDepth": 4
    }
  },
  {
    "id": "single-sofa-1",
    "name": "Single Sofa",
    "w": 1,
    "h": 1,
    "category": "Special",
    "walkable": true,
    "defaultFillColor": "#ffffff",
    "tags": [
      "lounge"
    ],
    "origin": "svg-import",
    "svg": "<rect x=\"2\" y=\"4\" width=\"21\" height=\"18\" rx=\"3\" fill=\"var(--obj-fill,#ffffff)\" stroke=\"var(--obj-stroke,#ffffff)\" stroke-width=\"1\"/><rect x=\"6\" y=\"4\" width=\"13\" height=\"6\" rx=\"2\" fill=\"var(--obj-fill,#ffffff)\" stroke=\"var(--obj-stroke,#ffffff)\" stroke-width=\"0.8\"/><rect x=\"2\" y=\"4\" width=\"4\" height=\"18\" rx=\"2\" fill=\"var(--obj-fill,#ffffff)\" stroke=\"var(--obj-stroke,#ffffff)\" stroke-width=\"0.9\"/><rect x=\"19\" y=\"4\" width=\"4\" height=\"18\" rx=\"2\" fill=\"var(--obj-fill,#ffffff)\" stroke=\"var(--obj-stroke,#ffffff)\" stroke-width=\"0.9\"/>",
    "svgViewBox": {
      "w": 25,
      "h": 25
    },
    "walkableGrid": [
      [
        true
      ]
    ],
    "tileStates": [
      [
        "walkable"
      ]
    ],
    "interactSpots": [
      {
        "kind": "stand",
        "x": 12.5,
        "y": 15
      }
    ],
    "interact": {
      "capacity": 1,
      "durationMin": 8,
      "durationMax": 20
    },
    "queue": {
      "maxMembers": 3,
      "admissionDepth": 4
    }
  },
  {
    "id": "reception-desk",
    "name": "Reception Desk",
    "w": 8,
    "h": 1,
    "category": "Special",
    "walkable": false,
    "defaultFillColor": "#ffffff",
    "tags": [
      "front-desk"
    ],
    "origin": "svg-import",
    "svg": "<rect x=\"2\" y=\"3\" width=\"196\" height=\"7\" rx=\"2\" fill=\"var(--obj-fill,#ffffff)\" stroke=\"var(--obj-stroke,#ffffff)\" stroke-width=\"1\"/><rect x=\"5\" y=\"10\" width=\"190\" height=\"13\" rx=\"1.5\" fill=\"var(--obj-fill,#ffffff)\" stroke=\"var(--obj-stroke,#ffffff)\" stroke-width=\"0.9\"/><line x1=\"5\" y1=\"14\" x2=\"195\" y2=\"14\" stroke=\"var(--text-secondary)\" stroke-width=\"0.55\"/><path d=\"M 53 14 V 21 M 100 14 V 21 M 147 14 V 21\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.55\"/><circle cx=\"176\" cy=\"6.5\" r=\"2.2\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.7\"/>",
    "svgViewBox": {
      "w": 200,
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
        false,
        false
      ]
    ],
    "tileStates": [
      [
        "blocked",
        "blocked",
        "blocked",
        "blocked",
        "blocked",
        "blocked",
        "blocked",
        "blocked"
      ]
    ],
    "interactSpots": [
      {
        "kind": "stand",
        "x": 40,
        "y": 31
      },
      {
        "kind": "stand",
        "x": 100,
        "y": 31
      },
      {
        "kind": "stand",
        "x": 160,
        "y": 31
      },
      {
        "kind": "stand",
        "x": 40,
        "y": -6,
        "post": "reception-station"
      },
      {
        "kind": "stand",
        "x": 100,
        "y": -6,
        "post": "reception-station"
      },
      {
        "kind": "stand",
        "x": 160,
        "y": -6,
        "post": "reception-station"
      }
    ],
    "interact": {
      "capacity": 4,
      "durationMin": 5,
      "durationMax": 12
    },
    "queue": {
      "maxMembers": 4,
      "admissionDepth": 4
    }
  },
  {
    "id": "vending-machine",
    "name": "Vending Machine",
    "w": 2,
    "h": 1,
    "category": "Special",
    "walkable": false,
    "defaultFillColor": "#ffffff",
    "tags": [
      "lounge"
    ],
    "origin": "svg-import",
    "svg": "<g transform=\"translate(50, 0) rotate(90)\"><rect x=\"2\" y=\"2\" width=\"21\" height=\"46\" rx=\"2\" fill=\"var(--obj-fill,#ffffff)\" stroke=\"var(--obj-stroke,#ffffff)\" stroke-width=\"1\"/><rect x=\"4.5\" y=\"4.5\" width=\"16\" height=\"6\" rx=\"1\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.8\"/><rect x=\"4.5\" y=\"13.5\" width=\"11\" height=\"17\" rx=\"1\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.8\"/><path d=\"M 4.5 19.5 H 15.5 M 4.5 24.5 H 15.5\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.55\"/><circle cx=\"18.8\" cy=\"16\" r=\"0.9\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.5\"/><circle cx=\"18.8\" cy=\"20\" r=\"0.9\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.5\"/><circle cx=\"18.8\" cy=\"24\" r=\"0.9\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.5\"/><rect x=\"4.5\" y=\"35\" width=\"16\" height=\"7\" rx=\"1\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.8\"/><line x1=\"7\" y1=\"38.5\" x2=\"18\" y2=\"38.5\" stroke=\"var(--text-secondary)\" stroke-width=\"0.6\"/></g>",
    "svgViewBox": {
      "w": 50,
      "h": 25
    },
    "walkableGrid": [
      [
        false,
        false
      ]
    ],
    "tileStates": [
      [
        "blocked",
        "blocked"
      ]
    ],
    "interactSpots": [
      {
        "kind": "stand",
        "x": 12.5,
        "y": 55
      }
    ],
    "interact": {
      "capacity": 1,
      "durationMin": 3,
      "durationMax": 8
    },
    "queue": {
      "maxMembers": 3,
      "admissionDepth": 4
    }
  },
  {
    "id": "bathtub",
    "name": "Bathtub",
    "w": 2,
    "h": 1,
    "category": "Special",
    "walkable": false,
    "defaultFillColor": "#ffffff",
    "tags": [
      "hygiene"
    ],
    "origin": "svg-import",
    "svg": "<rect x=\"2\" y=\"2\" width=\"46\" height=\"21\" rx=\"8\" fill=\"var(--obj-fill,#ffffff)\" stroke=\"var(--obj-stroke,#ffffff)\" stroke-width=\"1\"/><rect x=\"5.5\" y=\"5.5\" width=\"39\" height=\"14\" rx=\"6\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.8\"/><circle cx=\"40\" cy=\"12.5\" r=\"1.8\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.6\"/><circle cx=\"7.5\" cy=\"12.5\" r=\"1.3\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.6\"/>",
    "svgViewBox": {
      "w": 50,
      "h": 25
    },
    "walkableGrid": [
      [
        false,
        false
      ]
    ],
    "tileStates": [
      [
        "blocked",
        "blocked"
      ]
    ],
    "interactSpots": [
      {
        "kind": "stand",
        "x": 25,
        "y": 31
      }
    ],
    "interact": {
      "capacity": 1,
      "durationMin": 15,
      "durationMax": 40
    },
    "queue": {
      "maxMembers": 3,
      "admissionDepth": 4
    }
  },
  {
    "id": "toilet",
    "name": "Toilet",
    "w": 1,
    "h": 1,
    "category": "Special",
    "walkable": false,
    "defaultFillColor": "#ffffff",
    "tags": [
      "hygiene"
    ],
    "origin": "svg-import",
    "svg": "<rect x=\"6\" y=\"2\" width=\"13\" height=\"6\" rx=\"1.5\" fill=\"var(--obj-fill,#ffffff)\" stroke=\"var(--obj-stroke,#ffffff)\" stroke-width=\"0.9\"/><ellipse cx=\"12.5\" cy=\"15\" rx=\"8\" ry=\"7.5\" fill=\"var(--obj-fill,#ffffff)\" stroke=\"var(--obj-stroke,#ffffff)\" stroke-width=\"1\"/><ellipse cx=\"12.5\" cy=\"15\" rx=\"5.5\" ry=\"5\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.6\"/>",
    "svgViewBox": {
      "w": 25,
      "h": 25
    },
    "walkableGrid": [
      [
        false
      ]
    ],
    "tileStates": [
      [
        "blocked"
      ]
    ],
    "interactSpots": [
      {
        "kind": "stand",
        "x": 12.5,
        "y": 30
      }
    ],
    "interact": {
      "capacity": 1,
      "durationMin": 3,
      "durationMax": 8
    },
    "queue": {
      "maxMembers": 3,
      "admissionDepth": 4
    }
  },
  {
    "id": "washbasin",
    "name": "Washbasin",
    "w": 1,
    "h": 1,
    "category": "Special",
    "walkable": false,
    "defaultFillColor": "#ffffff",
    "tags": [
      "hygiene"
    ],
    "origin": "svg-import",
    "svg": "<rect x=\"2.5\" y=\"2.5\" width=\"20\" height=\"20\" rx=\"5\" fill=\"var(--obj-fill,#ffffff)\" stroke=\"var(--obj-stroke,#ffffff)\" stroke-width=\"1\"/><ellipse cx=\"12.5\" cy=\"13.5\" rx=\"7\" ry=\"6\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.7\"/><circle cx=\"12.5\" cy=\"5.8\" r=\"1.2\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.6\"/><line x1=\"12.5\" y1=\"7\" x2=\"12.5\" y2=\"8.8\" stroke=\"var(--text-secondary)\" stroke-width=\"0.5\"/>",
    "svgViewBox": {
      "w": 25,
      "h": 25
    },
    "walkableGrid": [
      [
        false
      ]
    ],
    "tileStates": [
      [
        "blocked"
      ]
    ],
    "interactSpots": [
      {
        "kind": "stand",
        "x": 12.5,
        "y": 30
      }
    ],
    "interact": {
      "capacity": 1,
      "durationMin": 2,
      "durationMax": 5
    },
    "queue": {
      "maxMembers": 3,
      "admissionDepth": 4
    }
  },
  {
    "id": "shower",
    "name": "Shower",
    "w": 1,
    "h": 1,
    "category": "Special",
    "walkable": false,
    "defaultFillColor": "#ffffff",
    "tags": [
      "hygiene"
    ],
    "origin": "svg-import",
    "svg": "<rect x=\"2\" y=\"2\" width=\"21\" height=\"21\" rx=\"2\" fill=\"var(--obj-fill,#ffffff)\" stroke=\"var(--obj-stroke,#ffffff)\" stroke-width=\"1\"/><circle cx=\"12.5\" cy=\"12.5\" r=\"2\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.7\"/><circle cx=\"12.5\" cy=\"12.5\" r=\"0.7\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.5\"/><path d=\"M 4 12.5 A 8.5 8.5 0 0 1 12.5 4\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.45\"/>",
    "svgViewBox": {
      "w": 25,
      "h": 25
    },
    "walkableGrid": [
      [
        false
      ]
    ],
    "tileStates": [
      [
        "blocked"
      ]
    ],
    "interactSpots": [
      {
        "kind": "stand",
        "x": 12.5,
        "y": 30
      }
    ],
    "interact": {
      "capacity": 1,
      "durationMin": 10,
      "durationMax": 25
    },
    "queue": {
      "maxMembers": 3,
      "admissionDepth": 4
    }
  },
  {
    "id": "kitchen-sink",
    "name": "Kitchen Sink",
    "w": 2,
    "h": 1,
    "category": "Special",
    "walkable": false,
    "defaultFillColor": "#ffffff",
    "tags": [
      "cooking"
    ],
    "origin": "svg-import",
    "svg": "<rect x=\"1.5\" y=\"2\" width=\"47\" height=\"21\" rx=\"2\" fill=\"var(--obj-fill,#ffffff)\" stroke=\"var(--obj-stroke,#ffffff)\" stroke-width=\"1\"/><rect x=\"4.5\" y=\"5\" width=\"17\" height=\"15\" rx=\"2.5\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.8\"/><circle cx=\"13\" cy=\"12.5\" r=\"1.5\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.5\"/><circle cx=\"13\" cy=\"6.8\" r=\"1.1\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.5\"/><path d=\"M 30 6 V 19 M 33.5 6 V 19 M 37 6 V 19 M 40.5 6 V 19 M 44 6 V 19\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.45\"/>",
    "svgViewBox": {
      "w": 50,
      "h": 25
    },
    "walkableGrid": [
      [
        false,
        false
      ]
    ],
    "tileStates": [
      [
        "blocked",
        "blocked"
      ]
    ],
    "interactSpots": [
      {
        "kind": "stand",
        "x": 25,
        "y": 31,
        "post": "kitchen-station"
      }
    ],
    "interact": {
      "capacity": 1,
      "durationMin": 3,
      "durationMax": 8
    },
    "queue": {
      "maxMembers": 3,
      "admissionDepth": 4
    }
  },
  {
    "id": "bench",
    "name": "Bench",
    "w": 2,
    "h": 1,
    "category": "Special",
    "walkable": true,
    "defaultFillColor": "#ffffff",
    "tags": [
      "lounge"
    ],
    "origin": "svg-import",
    "svg": "<line x1=\"6\" y1=\"17\" x2=\"6\" y2=\"21.5\" stroke=\"var(--text-secondary)\" stroke-width=\"0.8\"/><line x1=\"44\" y1=\"17\" x2=\"44\" y2=\"21.5\" stroke=\"var(--text-secondary)\" stroke-width=\"0.8\"/><rect x=\"2\" y=\"8\" width=\"46\" height=\"9\" rx=\"1.5\" fill=\"var(--obj-fill,#ffffff)\" stroke=\"var(--obj-stroke,#ffffff)\" stroke-width=\"1\"/><path d=\"M 4 11 H 46 M 4 14 H 46\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.5\"/>",
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
    "interactSpots": [
      {
        "kind": "stand",
        "x": 14,
        "y": 15
      },
      {
        "kind": "stand",
        "x": 36,
        "y": 15
      }
    ],
    "interact": {
      "capacity": 1,
      "durationMin": 5,
      "durationMax": 12
    },
    "queue": {
      "maxMembers": 3,
      "admissionDepth": 4
    }
  },
  {
    "id": "office-chair",
    "name": "Office Chair",
    "w": 1,
    "h": 1,
    "category": "Special",
    "walkable": true,
    "defaultFillColor": "#ffffff",
    "origin": "svg-import",
    "svg": "<rect x=\"5\" y=\"3\" width=\"15\" height=\"7\" rx=\"3\" fill=\"var(--obj-fill,#ffffff)\" stroke=\"var(--obj-stroke,#ffffff)\" stroke-width=\"0.9\"/><rect x=\"6\" y=\"12\" width=\"13\" height=\"9\" rx=\"3\" fill=\"var(--obj-fill,#ffffff)\" stroke=\"var(--obj-stroke,#ffffff)\" stroke-width=\"1\"/><line x1=\"3.5\" y1=\"8\" x2=\"3.5\" y2=\"17\" stroke=\"var(--text-secondary)\" stroke-width=\"0.6\"/><line x1=\"21.5\" y1=\"8\" x2=\"21.5\" y2=\"17\" stroke=\"var(--text-secondary)\" stroke-width=\"0.6\"/><circle cx=\"12.5\" cy=\"22.2\" r=\"1\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.5\"/>",
    "svgViewBox": {
      "w": 25,
      "h": 25
    },
    "walkableGrid": [
      [
        true
      ]
    ],
    "tileStates": [
      [
        "walkable"
      ]
    ],
    "interactSpots": [
      {
        "kind": "stand",
        "x": 12.5,
        "y": 15
      }
    ],
    "interact": {
      "capacity": 1,
      "durationMin": 3,
      "durationMax": 10
    },
    "queue": {
      "maxMembers": 3,
      "admissionDepth": 4
    }
  },
  {
    "id": "bar-counter",
    "name": "Bar Counter",
    "w": 4,
    "h": 1,
    "category": "Special",
    "walkable": false,
    "defaultFillColor": "#ffffff",
    "tags": [
      "lounge"
    ],
    "origin": "svg-import",
    "svg": "<rect x=\"2\" y=\"9\" width=\"96\" height=\"14\" rx=\"2\" fill=\"var(--obj-fill,#ffffff)\" stroke=\"var(--obj-stroke,#ffffff)\" stroke-width=\"1\"/><rect x=\"2\" y=\"4\" width=\"96\" height=\"5\" rx=\"1.5\" fill=\"var(--obj-fill,#ffffff)\" stroke=\"var(--obj-stroke,#ffffff)\" stroke-width=\"0.8\"/><path d=\"M 20 13 V 21 M 50 13 V 21 M 80 13 V 21\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.6\"/>",
    "svgViewBox": {
      "w": 100,
      "h": 25
    },
    "walkableGrid": [
      [
        false,
        false,
        false,
        false
      ]
    ],
    "tileStates": [
      [
        "blocked",
        "blocked",
        "blocked",
        "blocked"
      ]
    ],
    "interactSpots": [
      {
        "kind": "stand",
        "x": 25,
        "y": 31
      },
      {
        "kind": "stand",
        "x": 50,
        "y": 31
      },
      {
        "kind": "stand",
        "x": 75,
        "y": 31
      },
      {
        "kind": "stand",
        "x": 25,
        "y": -6,
        "post": "bar-back"
      },
      {
        "kind": "stand",
        "x": 75,
        "y": -6,
        "post": "bar-back"
      }
    ],
    "interact": {
      "capacity": 3,
      "durationMin": 4,
      "durationMax": 10
    },
    "queue": {
      "maxMembers": 3,
      "admissionDepth": 4
    }
  },
  {
    "id": "table-stove",
    "name": "Table Stove",
    "w": 2,
    "h": 1,
    "category": "Special",
    "walkable": false,
    "defaultFillColor": "#ffffff",
    "tags": [
      "cooking"
    ],
    "origin": "svg-import",
    "svg": "<rect x=\"1\" y=\"2\" width=\"48\" height=\"21\" rx=\"2\" fill=\"var(--obj-fill,#ffffff)\" stroke=\"var(--obj-stroke,#ffffff)\" stroke-width=\"1\"/><line x1=\"25\" y1=\"2\" x2=\"25\" y2=\"23\" stroke=\"var(--text-secondary)\" stroke-width=\"0.6\"/><circle cx=\"12.5\" cy=\"12.5\" r=\"7\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.8\"/><circle cx=\"12.5\" cy=\"12.5\" r=\"3\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.5\"/><rect x=\"30.5\" y=\"7.5\" width=\"14\" height=\"10\" rx=\"1.5\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.8\"/>",
    "svgViewBox": {
      "w": 50,
      "h": 25
    },
    "walkableGrid": [
      [
        false,
        false
      ]
    ],
    "tileStates": [
      [
        "blocked",
        "blocked"
      ]
    ],
    "interactSpots": [
      {
        "kind": "stand",
        "x": 12.5,
        "y": 31,
        "post": "kitchen-station"
      },
      {
        "kind": "stand",
        "x": 37.5,
        "y": 31,
        "post": "kitchen-station"
      }
    ],
    "interact": {
      "capacity": 2,
      "durationMin": 5,
      "durationMax": 12
    },
    "queue": {
      "maxMembers": 3,
      "admissionDepth": 4
    }
  },
  {
    "id": "elevator-1",
    "name": "Elevator",
    "w": 2,
    "h": 2,
    "category": "Special",
    "walkable": false,
    "defaultFillColor": "#ffffff",
    "tags": [
      "portal"
    ],
    "origin": "svg-import",
    "svg": "<rect x=\"1.5\" y=\"1.5\" width=\"27\" height=\"27\" rx=\"2\" fill=\"var(--obj-fill,#ffffff)\" stroke=\"var(--obj-stroke,#ffffff)\" stroke-width=\"1\"/><rect x=\"6\" y=\"4\" width=\"18\" height=\"22\" rx=\"1\" fill=\"var(--obj-fill,none)\" stroke=\"var(--text-secondary)\" stroke-width=\"0.8\"/><line x1=\"15\" y1=\"4\" x2=\"15\" y2=\"26\" stroke=\"var(--text-secondary)\" stroke-width=\"0.6\"/>",
    "svgViewBox": {
      "w": 30,
      "h": 30
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
    ],
    "tileStates": [
      [
        "blocked",
        "blocked"
      ],
      [
        "blocked",
        "blocked"
      ]
    ],
    "interactSpots": [
      {
        "kind": "stand",
        "x": 7.5,
        "y": -7.5
      },
      {
        "kind": "stand",
        "x": 22.5,
        "y": -7.5
      },
      {
        "kind": "stand",
        "x": 7.5,
        "y": 37.5
      },
      {
        "kind": "stand",
        "x": 22.5,
        "y": 37.5
      }
    ],
    "interact": {
      "capacity": 4,
      "durationMin": 1,
      "durationMax": 3
    }
  }
]
