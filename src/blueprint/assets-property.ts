import type { AssetDef } from './types'

export const SEED_ASSET_CATEGORIES: string[] = [
  "tools",
  "Merged",
  "Linked Sets"
]

export const SEED_ASSETS: AssetDef[] = [
  {
    "kind": "svg",
    "id": "builtin-restroom-1",
    "name": "Rest Room",
    "category": "Special",
    "w": 3,
    "h": 3,
    "custom": true,
    "svg": "<line data-role=\"wall\" x1=\"1\" y1=\"1\" x2=\"74\" y2=\"1\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.6\"/><line data-role=\"wall\" x1=\"74\" y1=\"1\" x2=\"74\" y2=\"74\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.6\"/><line data-role=\"wall\" x1=\"74\" y1=\"74\" x2=\"1\" y2=\"74\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.6\"/><line data-role=\"wall\" x1=\"1\" y1=\"1\" x2=\"1\" y2=\"26\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.6\"/><line data-role=\"wall\" x1=\"1\" y1=\"46\" x2=\"1\" y2=\"74\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.6\"/><line data-role=\"wall\" x1=\"1\" y1=\"26\" x2=\"21\" y2=\"26\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\"/><path data-role=\"door\" d=\"M21 26 A20 20 0 0 1 1 46\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.2\" stroke-dasharray=\"1 1\"/><rect data-role=\"fixture\" x=\"2\" y=\"2\" width=\"21\" height=\"21\" rx=\"1\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\"/><rect data-role=\"fixture\" x=\"3\" y=\"3\" width=\"4\" height=\"4\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/><circle data-role=\"fixture\" cx=\"12.5\" cy=\"12.5\" r=\"2\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/><rect data-role=\"fixture\" x=\"58\" y=\"2\" width=\"14\" height=\"5\" rx=\"1\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\"/><rect data-role=\"fixture\" x=\"59\" y=\"7\" width=\"12\" height=\"13\" rx=\"6\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\"/><rect data-role=\"fixture\" x=\"9\" y=\"61\" width=\"21\" height=\"12\" rx=\"2\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\"/><rect data-role=\"fixture\" x=\"13.5\" y=\"63\" width=\"12\" height=\"7\" rx=\"3\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/><circle data-role=\"fixture\" cx=\"19.5\" cy=\"71\" r=\"1\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.25\"/><line data-role=\"fixture\" x1=\"28\" y1=\"3\" x2=\"47\" y2=\"3\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\"/><rect data-role=\"fixture\" x=\"30\" y=\"4\" width=\"15\" height=\"8\" rx=\"1\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/><rect data-role=\"fixture\" x=\"64\" y=\"28\" width=\"9\" height=\"30\" rx=\"1\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\"/><line data-role=\"fixture\" x1=\"64\" y1=\"38\" x2=\"73\" y2=\"38\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.25\"/><line data-role=\"fixture\" x1=\"64\" y1=\"48\" x2=\"73\" y2=\"48\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.25\"/>",
    "svgViewBox": {
      "w": 75,
      "h": 75
    }
  },
  {
    "id": "builtin-sofa-1",
    "kind": "svg",
    "name": "Sofa",
    "category": "Special",
    "w": 2,
    "h": 1,
    "custom": true,
    "svg": "<rect x=\"2\" y=\"1\" width=\"46\" height=\"4\" rx=\"1.2\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\"/><rect x=\"2\" y=\"5\" width=\"6\" height=\"18\" rx=\"1.5\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\"/><rect x=\"42\" y=\"5\" width=\"6\" height=\"18\" rx=\"1.5\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\"/><rect x=\"9\" y=\"5\" width=\"15.5\" height=\"18\" rx=\"1\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.35\"/><rect x=\"25.5\" y=\"5\" width=\"15.5\" height=\"18\" rx=\"1\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.35\"/>",
    "svgViewBox": {
      "w": 50,
      "h": 25
    }
  },
  {
    "id": "builtin-bed-1",
    "name": "Bed",
    "kind": "svg",
    "category": "Special",
    "w": 1,
    "h": 2,
    "custom": true,
    "svg": "<rect x=\"1\" y=\"4\" width=\"23\" height=\"44\" rx=\"2\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\"/><rect x=\"1\" y=\"1\" width=\"23\" height=\"3\" rx=\"1\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\"/><rect x=\"3.5\" y=\"5.5\" width=\"18\" height=\"8\" rx=\"2\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.35\"/><line x1=\"1\" y1=\"30\" x2=\"24\" y2=\"30\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/><line x1=\"12.5\" y1=\"30\" x2=\"12.5\" y2=\"47\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.25\"/>",
    "svgViewBox": {
      "w": 25,
      "h": 50
    }
  },
  {
    "id": "custom-mr8wdziq-1",
    "name": "Table",
    "category": "tools",
    "kind": "simple",
    "w": 1,
    "h": 2,
    "custom": true
  },
  {
    "id": "custom-mr8wfbqa-1",
    "name": "Chair",
    "category": "tools",
    "kind": "simple",
    "w": 1,
    "h": 1,
    "custom": true,
    "defaultPadding": 5,
    "defaultRx": {
      "tl": 3,
      "tr": 3,
      "br": 3,
      "bl": 3
    }
  },
  {
    "id": "linked-mr8ztb1g-1",
    "name": "Table Set",
    "category": "Linked Sets",
    "kind": "linked",
    "w": 3,
    "h": 2,
    "custom": true,
    "linkedParts": [
      {
        "type": "custom-mr8wdziq-1",
        "dx": 25,
        "dy": 0,
        "w": 25,
        "h": 50,
        "rotation": 0
      },
      {
        "type": "custom-mr8wfbqa-1",
        "dx": 50,
        "dy": 0,
        "w": 25,
        "h": 25,
        "rotation": 0
      },
      {
        "type": "custom-mr8wfbqa-1",
        "dx": 0,
        "dy": 0,
        "w": 25,
        "h": 25,
        "rotation": 0
      },
      {
        "type": "custom-mr8wfbqa-1",
        "dx": 0,
        "dy": 25,
        "w": 25,
        "h": 25,
        "rotation": 0
      },
      {
        "type": "custom-mr8wfbqa-1",
        "dx": 50,
        "dy": 25,
        "w": 25,
        "h": 25,
        "rotation": 0
      }
    ]
  },
  {
    "id": "custom-mr8zu9xo-1",
    "name": "Door",
    "category": "tools",
    "kind": "simple",
    "w": 2,
    "h": 1,
    "custom": true
  },
  {
    "id": "custom-mradv414-17664810560",
    "name": "Double Bed",
    "category": "Special",
    "kind": "svg",
    "w": 2,
    "h": 2,
    "custom": true,
    "svg": "<rect x=\"1\" y=\"4\" width=\"48\" height=\"44\" rx=\"2.5\"\n fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\"/>\n  <rect x=\"1\" y=\"1\" width=\"48\" height=\"3\" rx=\"1\"\n        fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\"/>\n  <rect x=\"4\" y=\"5.5\" width=\"20\" height=\"8\" rx=\"2\"\n        fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.35\"/>\n  <rect x=\"26\" y=\"5.5\" width=\"20\" height=\"8\" rx=\"2\"\n        fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.35\"/>\n  <line x1=\"1\" y1=\"30\" x2=\"49\" y2=\"30\"\n        stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/>\n  <line x1=\"25\" y1=\"30\" x2=\"25\" y2=\"47\"\n        stroke=\"var(--blueprint-line)\" stroke-width=\"0.25\"/>",
    "svgViewBox": {
      "w": 50,
      "h": 50
    }
  },
  {
    "id": "custom-mraerhs8-9.041026690228171e+23",
    "name": "Bath",
    "category": "Special",
    "w": 1,
    "kind": "svg",
    "h": 2,
    "custom": true,
    "svg": "<rect x=\"2\" y=\"2\" width=\"21\" height=\"46\" rx=\"9\"\n fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\"/>\n  <rect x=\"4.5\" y=\"5\" width=\"16\" height=\"40\" rx=\"7\"\n        fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/>\n  <rect x=\"10.5\" y=\"0.5\" width=\"4\" height=\"2.5\" rx=\"0.8\"\n        fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.35\"/>\n  <circle cx=\"8.5\" cy=\"4\" r=\"1\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/>\n  <circle cx=\"16.5\" cy=\"4\" r=\"1\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/>\n  <circle cx=\"12.5\" cy=\"41\" r=\"1.3\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/>",
    "svgViewBox": {
      "w": 25,
      "h": 50
    }
  },
  {
    "id": "builtin-elevator-1",
    "name": "Elevator",
    "category": "Special",
    "w": 3,
    "h": 4,
    "kind": "svg",
    "custom": true,
    "svg": "<defs><marker id=\"arrow\" viewBox=\"0 0 10 10\" refX=\"8\" refY=\"5\" markerWidth=\"5\" markerHeight=\"5\" orient=\"auto-start-reverse\"><path d=\"M2 1L8 5L2 9\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></marker></defs><rect x=\"1\" y=\"1\" width=\"73\" height=\"98\" rx=\"2\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.5\"/><rect x=\"5\" y=\"5\" width=\"65\" height=\"85\" rx=\"2\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/><line x1=\"1\" y1=\"90\" x2=\"74\" y2=\"90\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\"/><rect x=\"6\" y=\"91\" width=\"30.5\" height=\"7\" rx=\"0.5\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.35\"/><rect x=\"38.5\" y=\"91\" width=\"30.5\" height=\"7\" rx=\"0.5\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.35\"/><line x1=\"34\" y1=\"94.5\" x2=\"26\" y2=\"94.5\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\" marker-end=\"url(#arrow)\"/><line x1=\"41\" y1=\"94.5\" x2=\"49\" y2=\"94.5\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\" marker-end=\"url(#arrow)\"/><rect x=\"30\" y=\"8\" width=\"15\" height=\"7\" rx=\"1\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/><circle cx=\"8\" cy=\"94.5\" r=\"1.3\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/>",
    "svgViewBox": {
      "w": 75,
      "h": 100
    }
  },
  {
    "id": "custom-mrahjnoa-9.041026690228171e+23",
    "name": "Kitchen Left",
    "category": "Special",
    "w": 4,
    "h": 3,
    "custom": true,
    "kind": "svg",
    "svg": "<path d=\"M1 1 H99 V24 H24 V74 H1 Z\"\n fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.5\"/>\n  <line x1=\"2\" y1=\"23\" x2=\"23\" y2=\"2\"\n        stroke=\"var(--blueprint-line)\" stroke-width=\"0.35\"/>\n  <circle cx=\"12\" cy=\"12\" r=\"3\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/>\n  <rect x=\"27\" y=\"3\" width=\"19\" height=\"20\" rx=\"1\"\n        fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\"/>\n  <circle cx=\"33\" cy=\"9\" r=\"2\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/>\n  <circle cx=\"41\" cy=\"9\" r=\"2\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/>\n  <circle cx=\"33\" cy=\"17\" r=\"2\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/>\n  <circle cx=\"41\" cy=\"17\" r=\"2\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/>\n  <rect x=\"52\" y=\"3\" width=\"19\" height=\"20\" rx=\"1\"\n        fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\"/>\n  <rect x=\"56\" y=\"8\" width=\"11\" height=\"10\" rx=\"2\"\n        fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/>\n  <rect x=\"77\" y=\"3\" width=\"19\" height=\"20\" rx=\"1\"\n        fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\"/>\n  <line x1=\"86.5\" y1=\"3\" x2=\"86.5\" y2=\"23\"\n        stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/>\n  <rect x=\"3\" y=\"27\" width=\"20\" height=\"19\" rx=\"1\"\n        fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\"/>\n  <rect x=\"7\" y=\"32\" width=\"12\" height=\"9\" rx=\"1\"\n        fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.25\"/>\n  <rect x=\"3\" y=\"52\" width=\"20\" height=\"19\" rx=\"1\"\n        fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\"/>\n  <line x1=\"3\" y1=\"58\" x2=\"23\" y2=\"58\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.25\"/>\n  <line x1=\"3\" y1=\"65\" x2=\"23\" y2=\"65\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.25\"/>",
    "svgViewBox": {
      "w": 100,
      "h": 75
    }
  },
  {
    "id": "custom-mrahmoey-9.041026690228171e+23",
    "name": "Kitchen-Right",
    "category": "Special",
    "w": 4,
    "h": 3,
    "custom": true,
    "svg": "<path d=\"M99 1 H1 V24 H76 V74 H99 Z\"\n fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.5\"/>\n  <line x1=\"98\" y1=\"23\" x2=\"77\" y2=\"2\"\n        stroke=\"var(--blueprint-line)\" stroke-width=\"0.35\"/>\n  <circle cx=\"88\" cy=\"12\" r=\"3\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/>\n  <rect x=\"4\" y=\"3\" width=\"19\" height=\"20\" rx=\"1\"\n        fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\"/>\n  <line x1=\"13.5\" y1=\"3\" x2=\"13.5\" y2=\"23\"\n        stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/>\n  <rect x=\"29\" y=\"3\" width=\"19\" height=\"20\" rx=\"1\"\n        fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\"/>\n  <rect x=\"33\" y=\"8\" width=\"11\" height=\"10\" rx=\"2\"\n        fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/>\n  <rect x=\"54\" y=\"3\" width=\"19\" height=\"20\" rx=\"1\"\n        fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\"/>\n  <circle cx=\"59\" cy=\"9\" r=\"2\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/>\n  <circle cx=\"67\" cy=\"9\" r=\"2\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/>\n  <circle cx=\"59\" cy=\"17\" r=\"2\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/>\n  <circle cx=\"67\" cy=\"17\" r=\"2\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/>\n  <rect x=\"77\" y=\"27\" width=\"20\" height=\"19\" rx=\"1\"\n        fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\"/>\n  <rect x=\"81\" y=\"32\" width=\"12\" height=\"9\" rx=\"1\"\n        fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.25\"/>\n  <rect x=\"77\" y=\"52\" width=\"20\" height=\"19\" rx=\"1\"\n        fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\"/>\n  <line x1=\"77\" y1=\"58\" x2=\"97\" y2=\"58\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.25\"/>\n  <line x1=\"77\" y1=\"65\" x2=\"97\" y2=\"65\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.25\"/>",
    "kind": "svg",
    "svgViewBox": {
      "w": 100,
      "h": 75
    }
  },
  {
    "id": "custom-mrahr7le-9.041026690228171e+23",
    "name": "Wash",
    "category": "Special",
    "w": 2,
    "h": 1,
    "custom": true,
    "kind": "svg",
    "svg": "<rect x=\"1\" y=\"1\" width=\"48\" height=\"23\" rx=\"1.5\"\n fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\"/>\n  <line x1=\"25\" y1=\"1\" x2=\"25\" y2=\"24\"\n        stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/>\n  <rect x=\"5\" y=\"3\" width=\"15\" height=\"4\" rx=\"1\"\n        fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/>\n  <circle cx=\"13\" cy=\"16\" r=\"7\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\"/>\n  <circle cx=\"13\" cy=\"16\" r=\"5\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.25\"/>\n  <rect x=\"30\" y=\"3\" width=\"15\" height=\"4\" rx=\"1\"\n        fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/>\n  <circle cx=\"37\" cy=\"16\" r=\"7\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\"/>\n  <circle cx=\"37\" cy=\"16\" r=\"5\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.25\"/>",
    "svgViewBox": {
      "w": 50,
      "h": 25
    }
  },
  {
    "id": "builtin-reception-1",
    "name": "Reception Counter",
    "category": "Special",
    "w": 10,
    "h": 1,
    "custom": true,
    "kind": "svg",
    "svg": "<rect x=\"1\" y=\"5\" width=\"248\" height=\"18\" rx=\"2\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.5\"/>\n  <rect x=\"1\" y=\"1\" width=\"248\" height=\"4\" rx=\"1\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\"/>\n  <rect x=\"10\" y=\"7\" width=\"30\" height=\"14\" rx=\"1\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.35\"/>\n  <rect x=\"13\" y=\"9\" width=\"24\" height=\"10\" rx=\"0.5\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.25\"/>\n  <rect x=\"60\" y=\"7\" width=\"30\" height=\"14\" rx=\"1\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.35\"/>\n  <rect x=\"63\" y=\"9\" width=\"24\" height=\"10\" rx=\"0.5\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.25\"/>\n  <rect x=\"110\" y=\"7\" width=\"30\" height=\"14\" rx=\"1\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.35\"/>\n  <rect x=\"113\" y=\"9\" width=\"24\" height=\"10\" rx=\"0.5\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.25\"/>\n  <rect x=\"160\" y=\"7\" width=\"30\" height=\"14\" rx=\"1\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.35\"/>\n  <rect x=\"163\" y=\"9\" width=\"24\" height=\"10\" rx=\"0.5\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.25\"/>\n  <rect x=\"210\" y=\"7\" width=\"30\" height=\"14\" rx=\"1\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.35\"/>\n  <rect x=\"213\" y=\"9\" width=\"24\" height=\"10\" rx=\"0.5\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.25\"/>\n  <circle cx=\"25\" cy=\"22\" r=\"3\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/>\n  <circle cx=\"75\" cy=\"22\" r=\"3\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/>\n  <circle cx=\"125\" cy=\"22\" r=\"3\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/>\n  <circle cx=\"175\" cy=\"22\" r=\"3\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/>\n  <circle cx=\"225\" cy=\"22\" r=\"3\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/>",
    "svgViewBox": {
      "w": 250,
      "h": 25
    }
  },
  {
    "id": "builtin-sportscar-1",
    "name": "Sports Car",
    "category": "Special",
    "w": 6,
    "h": 3,
    "custom": true,
    "kind": "svg",
    "svg": "<path d=\"M 10 37.5 C 12 30, 16 16, 26 14 C 40 12, 75 11, 85 12 C 95 11, 110 14, 112 18 L 112 57 C 110 61, 95 64, 85 63 C 75 64, 40 63, 26 61 C 16 59, 12 45, 10 37.5 Z\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.7\"/>\n  <path d=\"M 10 37.5 C 11 32, 14 20, 20 18 L 22 26 C 18 28, 16 34, 16 37.5 C 16 41, 18 47, 22 49 L 20 57 C 14 55, 11 43, 10 37.5 Z\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.5\"/>\n  <path d=\"M 44 37.5 C 44 26, 52 20, 64 20 C 80 20, 88 23, 94 27 L 95 48 C 88 52, 80 55, 64 55 C 52 55, 44 49, 44 37.5 Z\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.5\"/>\n  <rect x=\"22\" y=\"8\" width=\"20\" height=\"8\" rx=\"2\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\"/>\n  <rect x=\"22\" y=\"59\" width=\"20\" height=\"8\" rx=\"2\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\"/>\n  <rect x=\"86\" y=\"7\" width=\"24\" height=\"9\" rx=\"2\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\"/>\n  <rect x=\"86\" y=\"59\" width=\"24\" height=\"9\" rx=\"2\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\"/>\n  <path d=\"M 110 20 L 114 22 L 114 53 L 110 55 Z\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.35\"/>\n  <rect x=\"114\" y=\"27\" width=\"3\" height=\"4\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/>\n  <rect x=\"114\" y=\"44\" width=\"3\" height=\"4\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/>\n  <path d=\"M 82 26 L 98 29 L 98 46 L 82 49 Z\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.35\"/>\n  <line x1=\"85\" y1=\"31\" x2=\"85\" y2=\"44\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/>\n  <line x1=\"89\" y1=\"32\" x2=\"89\" y2=\"43\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/>\n  <line x1=\"93\" y1=\"33\" x2=\"93\" y2=\"42\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/>\n  <path d=\"M 106 12 L 109 11 L 109 64 L 106 63 C 105 45, 105 30, 106 12 Z\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\"/>\n  <rect x=\"105\" y=\"8\" width=\"6\" height=\"4\" rx=\"1\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.35\"/>\n  <rect x=\"105\" y=\"63\" width=\"6\" height=\"4\" rx=\"1\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.35\"/>\n  <line x1=\"110\" y1=\"16\" x2=\"110\" y2=\"24\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\" stroke-linecap=\"round\"/>\n  <line x1=\"110\" y1=\"51\" x2=\"110\" y2=\"59\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\" stroke-linecap=\"round\"/>",
    "svgViewBox": {
      "w": 150,
      "h": 75
    }
  },
  {
    "id": "builtin-sportscar-4seat-1",
    "name": "Sports Car 4-Seat",
    "category": "Special",
    "w": 5,
    "h": 3,
    "custom": true,
    "kind": "svg",
    "svg": "<path d=\"M 10 37.5 C 12 30, 16 16, 26 14 C 40 12, 70 11, 80 12 C 90 11, 105 14, 107 18 L 107 57 C 105 61, 90 64, 80 63 C 70 64, 40 63, 26 61 C 16 59, 12 45, 10 37.5 Z\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.7\"/>\n  <path d=\"M 10 37.5 C 11 32, 14 20, 20 18 L 22 26 C 18 28, 16 34, 16 37.5 C 16 41, 18 47, 22 49 L 20 57 C 14 55, 11 43, 10 37.5 Z\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.5\"/>\n  <path d=\"M 44 37.5 C 44 26, 52 20, 64 20 C 75 20, 85 23, 90 27 L 91 48 C 85 52, 75 55, 64 55 C 52 55, 44 49, 44 37.5 Z\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.5\"/>\n  <line x1=\"64\" y1=\"20\" x2=\"64\" y2=\"55\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/>\n  <rect x=\"22\" y=\"8\" width=\"20\" height=\"8\" rx=\"2\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\"/>\n  <rect x=\"22\" y=\"59\" width=\"20\" height=\"8\" rx=\"2\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\"/>\n  <rect x=\"81\" y=\"7\" width=\"24\" height=\"9\" rx=\"2\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\"/>\n  <rect x=\"81\" y=\"59\" width=\"24\" height=\"9\" rx=\"2\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\"/>\n  <path d=\"M 105 20 L 109 22 L 109 53 L 105 55 Z\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.35\"/>\n  <rect x=\"109\" y=\"27\" width=\"3\" height=\"4\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/>\n  <rect x=\"109\" y=\"44\" width=\"3\" height=\"4\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.3\"/>\n  <path d=\"M 81 12 L 84 11 L 84 64 L 81 63 C 80 45, 80 30, 81 12 Z\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\"/>\n  <rect x=\"80\" y=\"8\" width=\"6\" height=\"4\" rx=\"1\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.35\"/>\n  <rect x=\"80\" y=\"63\" width=\"6\" height=\"4\" rx=\"1\" fill=\"none\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.35\"/>\n  <line x1=\"105\" y1=\"16\" x2=\"105\" y2=\"24\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\" stroke-linecap=\"round\"/>\n  <line x1=\"105\" y1=\"51\" x2=\"105\" y2=\"59\" stroke=\"var(--blueprint-line)\" stroke-width=\"0.4\" stroke-linecap=\"round\"/>",
    "svgViewBox": {
      "w": 125,
      "h": 75
    }
  }
]
