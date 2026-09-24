# Sources index — every source cited by the architecture research files

Regenerable index over the 23 domain files: one section per file, reproducing that file's own
`## Sources` list so each entry stays attached to the tier label, jurisdiction and verification status
its author assigned. The citing file states what was taken from a source; this index is the audit
trail, not independent evidence.

Tiers (master spec §26): T1 government / official codes / standards bodies / buildingSMART ·
T2 peer-reviewed / universities / professional institutions · T3 established architecture &
engineering publications, architect project documentation · T4 professional forums · T5 anecdote.

Read it with the quality audit in mind (`audit/README.md`):
- `knowledge source`, `not quoted`, `403`, `paywalled`, `partial`, `no` mean the citing author could
  not read the document. Nothing numeric may be quoted from those entries.
- `verified?` in `building-codes.md`'s register means "read from a reachable page in that session",
  never "the law where you build".
- A URL listed here is not a URL verified here: the audit probed 560 unique URLs, of which 28 do not
  resolve and 3 were structurally impossible as written.
- Concentration warning: `up.codes` (a mirror of paywalled ICC text) carries codes figures across 9
  files, `floor-plans.md` rests almost wholly on arXiv preprints, and `bim-cad.md` leans on a GitHub
  issue thread. Treat those as single origins, not corroboration.


<!-- architecture-theory.md: rules=29, url-lines=68 -->
## architecture-theory.md

Tiers: T1 codes/standards/ISO/government · T2 peer-reviewed & university · T3 professional publications & established textbooks · T4 professional community · T5 anecdote. Nothing below T3 has been used for a number without being labelled as such inside the entry.
Standards, codes and government guidance (T1)
- BS EN 17037:2018 *Daylight in buildings* — https://standards.iteh.ai/catalog/standards/cen/836e5b91-1eb0-4643-a2ba-7ca5a5988e64/en-17037-2018 (catalogue record; the target values quoted in TH-26 were read from the open-access study listed under T2)
- ISO 1006:1983 *Modular coordination — Basic module* — https://www.iso.org/standard/5470.html (title verified; body text not retrievable this pass)
- ISO 2848:1984 *Modular coordination — Principles and rules* — https://cdn.standards.iteh.ai/samples/7846/a86382c91b96433da03b947608e0c2d0/ISO-2848-1984.pdf
- ISO 7250-1:2017 *Basic human body measurements for workplace design* — cited by title and number only; no text verified
- 2010 ADA Standards for Accessible Design, Ch. 3 "Building Blocks" (§304.3.1, §304.3.2, §305.3) — https://www.access-board.gov/ada/chapter/ch03/
- IBC Section 1005 "Means of Egress Sizing" — https://up.codes/s/means-of-egress-sizing
- Sidelight daylight-zone definition (ASHRAE 90.1 lineage) — https://up.codes/s/sidelight-daylight-zone
- UK MHCLG/DCLG, *Technical housing standards – nationally described space standard* (2015) — https://www.gov.uk/government/publications/technical-housing-standards-nationally-described-space-standard/technical-housing-standards-nationally-described-space-standard
- Oscar Newman, *Creating Defensible Space* (US government report) — https://www.huduser.gov/publications/pdf/def.pdf
- *Manual for Streets 2* (UK) — https://tsrgd.co.uk/pdf/mfs/mfs2.pdf
- Whole Building Design Guide (NIBS for US federal agencies), *Architectural Programming* — https://www.wbdg.org/design-disciplines/architectural-programming (live page; body text was not machine-readable, so no sentence is quoted from it)
- NSW *Apartment Design Guide*, Part 3 "Siting the development" — https://www.planning.nsw.gov.au/sites/default/files/2023-03/apartment-design-guide-part-3-siting-the-development.pdf (listed; text not retrieved — no claim in this file rests on it)
Peer-reviewed and university sources (T2)
- "The practical implications of the EN 17037 minimum target daylight level…" (open access) — https://pmc.ncbi.nlm.nih.gov/articles/PMC10773465/ (source of the 300 lx / 100 lx / 2190 h / 0.85 m figures in TH-26)
- "Defensible Space and Low-Rise Public Housing Design, 1966–1976", AMST (Winter Verlag, open access) — https://amst.winter-verlag.de/article/amst/2020/2/7/display/html (source of every verbatim Newman quotation and its page number)
- "Bill Hillier's Legacy: Space Syntax — A Synopsis of Basic Concepts, Measures and Empirical Application", *Sustainability* 13(6):3394, 2021 — https://www.mdpi.com/2071-1050/13/6/3394
- "Scaling and Universality in City Space Syntax" (arXiv preprint; graph formulas as reproduced there) — https://arxiv.org/html/0709.4375v1
- "Space adjacency analysis; diagramming information for architectural design" — https://www.researchgate.net/publication/284721733_space_adjacency_analysis_diagramming_information_for_architectural_design ; matrix/bubble figure at https://www.researchgate.net/figure/Traditional-adjacency-matrix-and-space-bubble-diagram_fig1_30870942
- TU Delft OCW, *3.1.3 Building Layers* (the six shearing-layer names) — https://ocw.tudelft.nl/course-lectures/3-1-3-building-layers/
- SUNY Buffalo IDEA lecture note DR-14, *Spatial Orientation, Environmental Perception and Wayfinding* — http://idea.ap.buffalo.edu/wp-content/uploads/sites/110/2019-08-14.pdf (listed; body text not extracted, so Passini's decision names are flagged as second-hand in TH-19)
- "Modularity in transition: reconciling open building principles with early design education", *Open House International* 51(1) — https://www.emerald.com/ohi/article/51/1/176/1305084/Modularity-in-transition-reconciling-open-building
- "Shearing Layers of Space", *Urban Planning* (Cogitatio) — https://www.cogitatiopress.com/urbanplanning/article/viewFile/9332/4320
- "Exploring the Panel Exercises in the Modulor as presented by Le Corbusier", *Journal of Open Image History* (Wiley OA) — https://onlinelibrary.wiley.com/doi/full/10.1002/2475-8876.12147
- Kevin Lynch, *The Image of the City* — university teaching PDF https://cus.ubt-uni.net/wp-content/uploads/2024/11/Kevin-Lynch-The-Image-of-the-City.pdf
- HFES, *Guidelines for Using Anthropometric Data* — https://www.hfes.org/Portals/0/Publications/Guidelines_AnthropometricData.pdf (chapter titles verified: "Defining the Target Population", "Anthropometry in Design: Examples and Summary"; body text not machine-readable, hence the percentile caveat in TH-21)
Established textbooks and professional publications (T3)
- Francis D. K. Ching, *Architecture: Form, Space, and Order*, 4th ed., Wiley 2014 — full text https://archive.org/stream/francis-d.-k.-ching-architecture-form-space-and-order-4-e-2014/Francis%20D.%20K.%20Ching%20-%20Architecture_Form%2C%20Space%2C%20and%20Order%204E%20%282014%29_djvu.txt (used for the five organisation forms and the four spatial-relationship determinants)
- Francis D. K. Ching, *Building Construction Illustrated*, 5th ed., Wiley 2014 (partition build-ups; no number taken)
- Ernst & Peter Neufert, *Architects' Data*, 3rd English ed., Wiley 2012 — https://ia600801.us.archive.org/21/items/NeufertS/Neufert-S.pdf (cited for the existence of room-by-room dimensional programming; no number taken from it)
- *Time-Saver Standards for Building Types*, 2nd ed., McGraw-Hill 2001 — cited by title/edition only; no stable URL retrieved and no number taken
- Christopher Alexander, Shara Ishikawa & Murray Silverstein, *A Pattern Language: Towns, Buildings, Construction*, Oxford UP 1977 — Pattern 159 "Light on Two Sides of Every Room" https://patternlanguage.cc/Patterns/Light-on-Two-Sides-of-Every-Room-(159)
- Bill Hillier & Julienne Hanson, *The Social Logic of Space*, Polity 1984; Bill Hillier, *Space is the Machine*, Cambridge UP 1996
- Space Syntax Ltd, *The Space Syntax Approach* — https://spacesyntax.com/the-space-syntax-approach/ (source of the verbatim accessibility/segregation sentences used in TH-11 and TH-20)
- Oscar Newman, *Defensible Space*, Macmillan 1972 (quotations taken via the AMST article above)
- Irwin Altman, *The Environment and Social Behavior: Privacy, Personal Space, Territory, and Crowding*, Brooks/Cole 1975 — cited by title; used only at the level "privacy is regulated at boundaries", no taxonomy detail attributed
- Erving Goffman, *Relations in Public: Social Spacing and Groups*, Harper & Row 1971 — cited by title; no quotation taken (no retrievable primary source found this pass)
- Paul Passini, *Wayfinding in Architecture*, Van Nostrand Reinhold 1984; Passini & Cleemenses, *Wayfinding: People, Signs and Architecture* — https://searchworks.stanford.edu/view/2376159
- Kevin Lynch, *The Image of the City*, MIT Press 1960
- Stewart Brand, *How Buildings Learn: What Happens After They're Built*, Viking 1994 (layer names verified via TU Delft OCW; the per-layer half-life numbers are deliberately not quoted)
- John Habraken, *Supports: An Alternative to Mass Housing*, 1972; Open Building — https://www.openbuilding.co/legacy and https://www.re-dwell.eu/concept-definition/58
- Colin Rowe & Fred Koetter, *Collage City*, MIT Press 1978 (figure-ground; no quotation taken)
- *Problem Seeking: Environmental Analysis in Architecture and Planning*, Routledge — cited by title only; no quotation taken
- Martin Panero & Vincent Zelnik, *Human Dimensions and Interior Space*, Watson-Guptill 1979 — cited by title; no number taken
- Geoffrey Pheasant & Christine Haslegrave, *Bodily Dimensions: Ergonomics for Design*, 3rd ed., Taylor & Francis 2006 — cited by title/edition; no number taken
- Anstey Horne, *Daylight Factors and BS EN 17037* — https://www.ansteyhorne.co.uk/news/daylight-factors-and-bs-en-17037-understanding-internal-daylighting-standards
- CIBSE Lifts Group / Peters Research, *Lift Traffic Analysis and Simulation: Open Forum Report* — https://download.peters-research.com/library/CIBSE_Traffic_Analysis_and_Simulation_Open_Forum_Report.pdf
- Le Corbusier, *Le Modulor* (1950) — the 113 / 226 cm series values were read from the Fondation Le Corbusier-licensed journal page https://dz.lescouleurs.ch/en/journal/posts/the-modulor-human-closeness-as-a-basic-value/ (that page is T4; the system itself is discussed in the Wiley OA paper above)
Professional-community sources (T4 — used only for method, or for heuristics that are explicitly labelled as such)
- The Foraker Group, *Architectural Programming* — https://www.forakergroup.org/predevelopment/resources/architectural-programming/ (source of the quoted programming definition in TH-01)
- Gustin Design Services, *Programming Matrix* — https://gdsatx.com/2018-09-27/programming-matrix/ (source of the quoted matrix definition and diagonal-reading in TH-01/TH-03)
- Harth, *Egress & Corridor Widths* — https://harth.build/resources/design-standards/egress-and-corridor-widths/ (cross-check of 44 in / 36 in / 32 in and the 150 ft² business occupant-load factor)
- Vantage Space, *Circulation Area* — https://www.vantagespace.com/gb/glossary/capacity-density-space-standards/circulation-area (source of the 12–25 % / 15–25 % circulation band, flagged Low confidence in TH-15)
- AdSimulo University, *Basics of Lift Traffic Analysis* — https://adsimulo.com/support/adsimulo-university/basics-of-lift-traffic-analysis/ (measures named; no numeric band taken from it)
- Ching 4th ed. chapter summary ("Organization") — https://beckwithhouseinteriors.wordpress.com/2020-01-30/architecture-form-space-order-by-francis-d-k-ching-chapter-four-organization/ (the check that produced the verified five-forms list)
- Architecture Courses, *Kevin Lynch's 5 Elements* — https://www.architecturecourses.org/design/kevin-lynchs-5-elements-city-guide-urban-design
- Wikipedia, *Desire path* — https://en.wikipedia.org/wiki/Desire_path ; *Privacy regulation theory* — https://en.wikipedia.org/wiki/Privacy_regulation_theory (concept labels only)
- "Limitations, critiques and inconsistencies of the space syntax methodology" — https://www.academia.edu/32698940/LIMITATIONS_CRITIQUES_AND_INCONSISTENCIES_OF_THE_SPACE_SYNTAX_METHODOLOGY (used as the counter-case)

<!-- building-codes.md: rules=28, url-lines=41 -->
## building-codes.md

- **Washington State Legislature — adopted IBC Table 1004.5** — https://lawfilesext.leg.wa.gov/Law/WAC/WAC%20%2051%20%20TITLE/WAC%20%2051%20-%2054A%20CHAPTER/WAC%20%2051%20-%2054A-1004.htm — **T1** — US — IBC 2021 as adopted. *(occupant load)*
- **US Access Board — 2010 ADA Standards Ch.4 Accessible Routes** — https://www.access-board.gov/ada/chapter/ch04/ — **T1** — US — 2010. *(route width, ramp slope/rise/landings, change of level)*
- **US Access Board — ADA guide Ch.4** — https://www.access-board.gov/ada/guides/chapter-4-accessible-routes/ — **T1** — US. *(corroboration)*
- **Corada — mirror of 2010 ADA Standards** §224 / §308 / §404 — https://www.corada.com/documents/2010ADAStandards/224 , /308 , /404 — **T3** (verbatim rendering of T1 primary; confirm at ada.gov). *(reach, guest rooms, door maneuvering)*
- **up.codes (ICC renderings, IBC 2021/2024)** — https://up.codes/s/means-of-egress-sizing , /s/egress-based-on-occupant-load-and-common-path-of-egress-travel-distance , /s/limitations , /s/corridor-width , /s/dead-ends , /s/stair-treads-and-risers , /s/doors-gates-and-turnstiles , /s/fire-resistance-rating , /viewer/new_jersey/ibc-2021/chapter/10/means-of-egress — **T3** — US. *(egress sizing, travel, corridor, dead ends, stairs, doors, shafts, remoteness)*
- **ICC Digital Codes — IBC Ch.10 / Ch.5 / Ch.7 / §404** — https://codes.iccsafe.org/s/IBC2021P1/... — **T1 primary, could NOT be fetched (HTTP 403 to automated fetch this session)** — cited as the authoritative text the T3 mirrors reproduce.
- **US Made Supply — IBC Ch.10 & I-2 healthcare egress** — https://usmadesupply.com/resources/building-codes-standards/emergency-life-safety/ibc-chapter-10 , /ibc-i2-healthcare-egress — **T3** — US.
- **MeltPlan — IBC height/area, fire-resistant construction, fire-protection systems** — https://www.meltplan.com/buildingcodes/ibc/building-height-area-limits , /fire-resistant-construction , /fire-protection-systems — **T3** — US — IBC 2024.
- **DataDrivenAEC — IBC handrail/guard, egress width** — https://datadrivenaec.com/insights/ibc-guardrail-handrail-requirements , /insights/how-to-calculate-egress-width — **T3** — US — 2024.
- **NFPA — Life Safety Code (NFPA 101) horizontal exits blog** — https://www.nfpa.org/news-blogs-and-articles/blogs/2024/05/22/horizontal-exits-overview — **T1 (standards body, explanatory)** — US — 2024. *(full NFPA 101 text is paywalled; only the free explanatory page was reachable)*
- **NIST — "The basis for egress provisions in US building codes"** — https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=861281 — **T2** — US. *(principles/history; not quoted for a number)*
- **GOV.UK — Approved Document B (fire safety) Vols 1 & 2** — https://www.gov.uk/government/publications/fire-safety-approved-document-b + [no direct PDF path available — the publications landing page above is the only reachable locator; an earlier draft printed a placeholder path here, which must not be treated as a retrieved document] — **T1 (primary PDF, not machine-readable this session)** — England.
- **fire-risk-assessment-network — UK travel distance** — https://fire-risk-assessment-network.com/blog/travel-distance-fire-risk-assessments/ — **T3** — England. *(12/18/25, 25/45/60 m benchmarks)*
- **squote.app — Approved Document M (Part M) door widths/thresholds/ramps** — https://squote.app/knowledge/compliance/part-m-access — **T3** — England — AD M 2015 Vol1.
- **turnings.co.uk — Approved Document K stairs** — http://www.turnings.co.uk/stair-regulations.html — **T3** — UK — AD K (1992 lineage).
- **NCC — National Construction Code (ABCB) Vol One Part D2 & D1** — https://ncc.abcb.gov.au/editions/ncc-2022/adopted/volume-one/d-access-and-egress/part-d2-provision-escape , .../ncc-2019-a1/.../part-d1-provision — **T1 (gov)** — Australia — NCC 2022 / 2019-A1.
- **2010 ADA Standards (DOJ full text)** — https://www.ada.gov/law-and-regs/design-standards/2010-stds/ — **T1** — US — 2010 (fetch returned scoping, not tables).
- *(Deliberately empty / uncited: EU transpositions, Singapore SCDF Fire Code, Japan Building Standard Law — no reachable English primary this session.)*
---

<!-- professional-practice.md: rules=26, url-lines=60 -->
## professional-practice.md

Consolidated list of everything actually retrieved and read for this file, by tier. (Inline
`Source:` lines above show which entry used which.)
**T1 — codes, standards, regulator and official design guidance**
- US Access Board, *ADA/ABA Accessibility Guides*, Chapter 4:
  Entrances, Doors, and Gates — https://www.access-board.gov/ada/guides/chapter-4-entrances-doors-and-gates/
- Access Board, *ADA/ABA Accessibility Guides*, Chapter 4: Accessible Routes —
  https://www.access-board.gov/ada/guides/chapter-4-accessible-routes/
- NHS England, *Health Building Note 04-01: Adult in-patient facilities* —
  https://www.england.nhs.uk/wp-content/uploads/2009/12/HBN_04-01_Final.pdf
- NHS England, *Health Building Note 00-09: Infection control in the built environment* —
  https://www.england.nhs.uk/wp-content/uploads/2021/05/HBN_00-09_infection_control.pdf
**T2 — peer-reviewed, university, national-laboratory**
- Graham et al., "Common sources of occupant dissatisfaction with workspace environments in 600
  office buildings", *Buildings & Cities* (CBE Occupant Survey dataset: 62,360 respondents / 617
  buildings) — https://journal-buildingscities.org/articles/10.5334/bc.274
- "Post-Occupancy Evaluation's (POE) Applications for Improving Indoor Environment Quality",
  *Int. J. Environ. Res. Public Health* 2022 (PMC9607023) —
  https://pmc.ncbi.nlm.nih.gov/articles/PMC9607023/
- Darbyshire & Young, "An investigation of sound levels on intensive care units with reference to
  the WHO guidelines", *Critical Care* 18(5) R187 (PMC4056361) —
  https://pmc.ncbi.nlm.nih.gov/articles/PMC4056361/ (also https://doi.org/10.1186/cc12870)
- "Implementation of Wayfinding Signage in Public Hospitals and Its Evaluation Towards Quality
  Improvement" (PMC11345034) — https://pmc.ncbi.nlm.nih.gov/articles/PMC11345034/
- Zhang & Verma, "What Matters Most to Your Guests: An Exploratory Study of Online Reviews",
  *Cornell Hospitality Report* 17(4), Center for Hospitality Research, 2017 —
  https://ecommons.cornell.edu/entities/publication/c780fe11-7b4f-4cdd-ba23-b62abc168329
- NIST Technical Note 1727 (IEA Annex 47 Subtask C), "Commissioning Cost-Benefit and Persistence of
  Savings" — https://nvlpubs.nist.gov/nistpubs/TechnicalNotes/NIST.TN.1727.pdf (contains the
  summary of Mills et al. 2004, LBNL: one-third of major commissioning problems originating in
  design)
- Alhawsawi, Sarvi, Felemban, Rajabifard & Wang, "Understanding the Characteristics of Pedestrians
  when Passing Obstacles of Different Sizes: An Experimental Study", *Collective Dynamics* 6:1–23 —
  https://collective-dynamics.eu/index.php/cod/article/view/A114
- "Analysis of Walking Velocity of Pedestrian Walking Through Angled-Corridor Based on Spatial
  Trajectories – A Bidirectional Scenario" (postgraduate thesis, Universiti Sains Malaysia
  eprints) — http://eprints.usm.my/56981/
**T3 — professional publications, consultancy, engineering memoranda**
- WATG (Nicole Hammond), "Back-of-House Design: How Architecture Shapes Luxury Service" —
  https://www.watg.com/back-of-house-design-how-architecture-shapes-luxury-service/
- CCC Engineering, "Coordination of Services in Ceiling Voids" (design memo; cites AS/NZS 3000,
  AS/NZS 2785, AS 1851, NCC Spec 13) —
  https://cccengineering.com.au/design-memos/services-coordination-ceiling-voids/
- Bureau Veritas North America, "The 8 Top ADA Violations and How to Avoid Them" —
  https://www.bvna.com/magazine/8-top-ada-violations-and-how-avoid-them
- Kitchen Management Authority, "Commercial Kitchen Layout and Design Principles" (cites IBC, IMC,
  NFPA 96, FDA Food Code, NSF/ANSI 2, ADA, FGI Guidelines) —
  https://kitchenmanagementauthority.com/commercial-kitchen-layout-and-design/
- Hotel Development Guide, "Architectural Planning" —
  https://hoteldevelopmentguide.com/architectural-planning/
- "The Influence of Design on Building Cost" (ASAQS free resource) —
  https://cdn.ymaws.com/www.asaqs.co.za/resource/resmgr/4_resources/free_resources/influence_of_design_on_building_cost/the_influence_of_design_on_b.pdf
- OpenSpace, "How much does rework cost in construction? Data & framework" (reports CII Field
  Rework Index, PlanGrid/FMI 2018, Love 2002) —
  https://www.openspace.ai/blog/cost-of-rework-in-construction/
- Loomis Bros. (Pellerin Milnor), "Hotel/Motel Laundry Plant Design" consulting file —
  https://www.loomisbros.com/cmss_files/attachmentlibrary/Consulting%20%26%20Design%20PDFs/Hotel%20%26%20Motel%20Laundry%20Plant%20Design.pdf
- "Flanking sound transmission in residential dwellings through façade" (acoustic consultant
  article with field test data) —
  https://wfmmedia.com/flanking-sound-transmission-between-adjacent-dwelling-units-through-the-facade/
- UW–Madison News, "Desire paths: the unofficial footpaths that frustrate, captivate campus
  planners" (reports a Helbing detour-threshold finding; the 20–30% wording did not reproduce on
  re-read - see PP-13 and *Weak or contested*) —
  https://news.wisc.edu/desire-paths-the-unofficial-footpaths-that-frustrate-captivate-campus-planners/
- Be Accessible, "ADA Lawsuit Statistics by Year, Industry, and State" (aggregates Seyfarth Shaw
  and UsableNet data) — https://beaccessible.com/post/americans-with-disabilities-act-statistics/
**T4 — practitioner community, tool and vendor documentation (weight of a well-informed anecdote)**
- Hotel Desk / Before It Opens, "Back of House: The Half of the Hotel Guests Never See" —
  https://beforeitopens.com/articles/back-of-house/
- TUMI Hospitality, "How to Staff a Hotel: A Department-by-Department Guide" —
  https://tumihospitality.com/how-to-staff-a-hotel/
- National MEP Engineers, "Optimal Placement of Plant Rooms, Riser Shafts, and Equipment for Easy
  Maintenance" —
  https://www.natlmep.com/optimal-placement-of-plant-rooms-riser-shafts-and-equipment-for-easy-maintenance/
- Studio Matrx, "Plumbing-Efficient Bathroom Layout: Single Wet Wall, Back-to-Back & Stacked
  Bathrooms" (cites NBC 2016 Part 9, IS 1172, IS 5329) —
  https://www.studiomatrx.org/guides/plumbing-efficient-bathroom-layout-india
- metroSTOR, "Decommissioning Refuse Chutes in High-rise Buildings" (reports London Borough
  of Hackney/Hounslow/Tower Hamlets outcomes; vendor-interested) —
  https://metrostor.uk/decommissioning-refuse-chutes-in-high-rise-buildings/
- Life of an Architect (working-architect blog), "Toilets by the Front Door" —
  https://www.lifeofanarchitect.com/toilets-by-the-front-door/
- RoomSketch3D help, "Door Clearance: How Much Space a Door Really Needs" —
  https://roomsketch3d.com/help/wall-fixtures/door-clearance
- Fresh Projects, "An Architect's Guide to Managing Scope Creep" —
  https://www.gofreshprojects.com/blog/architects-guide-managing-scope-creep
- ScanQueue, "Hotel Queue Management: How to Reduce Lobby Wait Times" (used for peak-window and
  queue-type mechanics only; its cited statistics failed verification) —
  https://scanqueue.com/blog/hotel-lobby-queue-management
**T5 — forum/Reddit (existence of topic only; content not retrievable — see Method)**
- r/architecture, "What would be the worst mistakes you've ever done while working…" —
  https://www.reddit.com/r/architecture/comments/1755sho/ (not read)
- r/hvacadvice, "Air handler access panel blocked" —
  https://www.reddit.com/r/hvacadvice/comments/1joqjcq/ (not read)

<!-- floor-plans.md: rules=25, url-lines=36 -->
## floor-plans.md

Datasets (all verified to exist; sizes as stated by the cited page):
- **CubiCasa5K** — 5,000 floor plan images, "over 80 floorplan object categories", polygon/vector annotations, multi-task segmentation + geometry model. The README does **not** state a country of origin or that the plans are *houses* — the "Finland / house" tags elsewhere in this file are inferred from the publisher, not quoted from the page. https://github.com/CubiCasa/CubiCasa5k — T1/T2 (dataset + paper).
- **RPLAN** — residential floor plans; **80,788** plans per the *DStruct2Design* benchmark (this file previously carried "80,315", a figure present in none of the three cited sources), **13 room types** and "80K" per Graph2Plan, **60,000 vector floorplans** subset reported for HouseDiffusion (that last figure comes from the paper body, which this pass did not read past the abstract — UNVERIFIED). Cited through its consumers, not a first-party page: https://arxiv.org/abs/2004.13204, https://arxiv.org/abs/2211.13287, https://arxiv.org/html/2407.15723v1 — T2.
- **FloorPlanCAD** — 10,000+ CAD drawings, "line-grained annotations of 30 object categories". https://arxiv.org/abs/2105.07147 — T2.
- **Swiss Dwellings** — apartment models from Archilyse; **over 45,000 apartments** (Zenodo record wording; the false precision "45,176" is not on the record), ~370,000 rooms, ~3,100 buildings; room categories include living, kitchen, bathroom, balcony, loggia, entrance ("bedroom" not surfaced on the categories list — UNVERIFIED). https://zenodo.org/records/7788422 — T1/T2.
- **MSD** — 5,372 plans / 18.9 K units, filtered to residential (2,305 = 16.6 % removed), adds room type + **four functional zones** (`zone1` private / `zone2` public / `zone3` service / `zone4` outside) + shared unit IDs across floors of multi-storey apartments (§8.1; **not** a room-position vertical-alignment measurement — see FP-13). The previously cited "165.3 K rooms" figure did not surface in the fetched text and is UNVERIFIED; the "(Modified Swiss Dwellings)" expansion is the file's gloss, not the paper's title. https://arxiv.org/html/2407.10121v3 — T2.
- **3D-FRONT / LIFULL** — named as other layout-generation corpora (interior/apartment-listing data) only via the review's dataset list; not independently inspected. https://arxiv.org/html/2504.09694v1 — T2 (second-hand).
Generation research:
- **Graph2Plan: Learning Floorplan Generation from Layout Graphs** — room-adjacency graph (nodes = rooms, edges via doors *or proximity*) → raster; validity checks **coverage / interior / mutex** (Eq. 2 losses `L_coverage`, `L_interior`, `L_mutex`); **average room-box IoU reported at ≈ 0.65** — an evaluation score, *not* an acceptance threshold (audit 04 A6b). https://arxiv.org/abs/2004.13204 — T2.
- **HouseDiffusion: Vector Floorplan Generation via a Diffusion Model with Discrete and Continuous Denoising** (arXiv 2211.13287; "CVPR 2023" was the file's claim, not confirmed on the abstract page — UNVERIFIED) — abstract confirms title, exact title, and evaluation on RPLAN; joint discrete+continuous denoising is the paper's own framing. Body-level details (interior/front door taxonomy, FID, modified graph edit distance, the 60,000 count, the "duplicate or missing rooms" critique of baselines) were **not readable on the abstract page** this pass and are UNVERIFIED. https://arxiv.org/abs/2211.13287 — T2 (abstract only).
- **DStruct2Design: Data and Benchmarks for Data Structure Driven Generative Floor Plan Design** (Luo, Lara, Luo, Golemo, Beckham, Pal) — **arXiv preprint, not an ECCV-track paper** (audit 04 A8). RPLAN (80,788) and ProcTHOR-10k (12,000); metric split into **self-consistency** (e.g. overlap and total-area style numbers; the file's earlier naming of those two as *the* two measures did not surface on the fetch), **prompt-consistency**, **compatibility** (GED over the input **bubble diagram**, not a door graph — mildly different from FP-02's framing); benchmarks House-GAN, House-GAN++, HouseDiffusion, ArchiText, AnyHome, Holodeck. https://arxiv.org/html/2407.15723v1 — T2.
- **Computer-Aided Layout Generation for Building Design: A Review** — constraint families confirmed on the fetched page: "residential boundary" and "bubble diagram"; "circulation" and "proportion" as *named* families did not surface (that grouping is this file's reading, not the review's list); metric triple FID/GED/IoU ✔; failure quote "occasional unnecessary overlap between rooms" (the file drops "occasional" — noted); **no "office/industrial are neglected" statement appears in the fetched text** — that claim in FP-19/FP-20 is this file's own negative survey, not the review's (audit 04 A9b). https://arxiv.org/html/2504.09694v1 — T2.
Standards:
- **2010 ADA Standards for Accessible Design, Chapter 4** — §403.5.1 clear width 36 in (915 mm) min; §403.5.3 passing spaces 60 in (1525 mm) min; §404.2.3 door clear width 32 in (815 mm) min. https://www.access-board.gov/ada/chapter/ch04/ — T1.

<!-- real-projects.md: rules=27, url-lines=87 -->
## real-projects.md

Practice and institution pages (T3)
- Fondation Le Corbusier, Unité d'habitation, Marseille — https://www.fondationlecorbusier.fr/en/work-architecture/achievements-unite-dhabitation-marseille-france-1945-1952/
- Le Corbusier World Heritage, Unité d'habitation — https://lecorbusier-worldheritage.org/en/unite-habitation/
- Safdie Architects, Habitat 67 — https://www.safdiearchitects.com/projects/habitat-67
- Safdie Architects, Marina Bay Sands — Hotel and SkyPark — https://www.safdiearchitects.com/projects/marina-bay-sands-hotel-and-skypark
- OMA, The Interlace — https://www.oma.com/projects/the-interlace
- PLP Architecture, The Edge — https://www.plparchitecture.com/projects/the-edge
- ArchDaily, The Edge / PLP Architecture — https://www.archdaily.com/785967/the-edge-plp-architecture
- The Miller Hull Partnership, Ten Years Later, the Bullitt Center — https://millerhull.com/2023/ten-years-later-the-bullitt-center-still-sets-the-standard-for-green-office-buildings/
- Bullitt Center, High Performance Building Case Study (PDF) — https://bullittcenter.org/wp-content/uploads/2015/08/living-proof-bullitt-center-case-study.pdf
- Foster + Partners, Commerzbank Headquarters — https://www.fosterandpartners.com/projects/commerzbank-headquarters/ (page body not retrievable in this pass; figures taken from the T4 cross-check below)
- The Architects' Journal, "Richard Rogers on Maggie's Centre and the architecture of hope" — https://www.architectsjournal.co.uk/practice/culture/richard-rogers-on-maggies-centre-and-the-architecture-of-hope
- Maggie's, Buildings and architecture — https://www.maggies.org/about-us/buildings-and-architecture/ (and the client's own Architecture and Landscape Brief PDF, image-only, unreadable in this pass)
- Hassell, Gold Coast University Hospital — https://www.hassellstudio.com/project/gold-coast-university-hospital
- ArchiPro AU, Gold Coast University Hospital by STH — https://archipro.com.au/project/gold-coast-university-hospital-qld-sth
- ArchitectureAu / Architecture Bulletin, "Social healing: Sunshine Coast University Hospital" — https://architectureau.com/articles/sunshine-coast-university-hospital/
- ALA Architects, Helsinki Central Library Oodi — https://ala.fi/work/helsinki-central-library/
- Dezeen, "Helsinki Central Library Oodi topped with translucent 'book heaven'" — https://www.dezeen.com/2019-01-10/helsinki-central-library-oodi-ala-architects/
- Renzo Piano Building Workshop, Kansai International Airport Terminal — https://www.rpbw.com/project/kansai-international-airport-terminal
- Fondazione Renzo Piano, Kansai terminal — https://www.fondazionerenzopiano.org/en/project/kansai-international-airport-passenger-terminal-building/
- Architectuul, Sendai Mediatheque — https://architectuul.com/architecture/sendai-mediatheque
- ArchDaily AD Classics, Sendai Mediatheque — https://www.archdaily.com/118627/ad-classics-sendai-mediatheque-toyo-ito-and-associates-architects
- ArchDaily, Fogo Island Inn / Saunders Architecture — https://www.archdaily.com/441419/fogo-island-inn-saunders-architecture ; full text via gooood https://www.gooood.cn/en/fogo-island-inn-by-saunders.htm
- BuildingGreen, "Tread Lightly" (Fogo Island Inn) — https://www.buildinggreen.com/feature/tread-lightly
- ArchDaily, Saunalahti School / VERSTAS Architects — https://www.archdaily.com/406513/saunalahti-school-verstas-architects ; Divisare record — https://divisare.com/projects/238860-verstas-architects-andreas-meichsner-tuomas-uusheimo-saunalahti-comprehensive-school
- RIBA Journal, "How Future Systems created Birmingham's Selfridges exterior" — https://www.ribaj.com/intelligence/selfridges-birmingham-future-systems-retail-cladding/
- ArchDaily AD Classics, Fagus Factory — https://www.archdaily.com/612249/ad-classics-fagus-factory-walter-gropius-adolf-meyer
Peer-reviewed / university / institutional (T2)
- "Humanizing the hospital: Design lessons from a Finnish sanatorium", PMC — https://pmc.ncbi.nlm.nih.gov/articles/PMC2917967/
- finland.fi, "Building an even better Finnish school" (state-backed information service, T3/T2) — https://finland.fi/life-society/building-an-even-better-finnish-school/
- Consulting-Specifying Engineer, "2022 FGI guidelines: what do they mean?" (T3, reporting Facility Guidelines Institute, which is the standard's publisher) — https://www.csemag.com/2022-fgi-guidelines-what-do-they-mean/
- Facility Guidelines Institute, 2010 Guidelines (PDF; too large to parse in this pass) — https://fgiguidelines.org/wp-content/uploads/2022-03-2010_FGI_Guidelines.pdf
- MDPI *Buildings* 13(6):1399, ward layout vs nurse-round efficiency, and IOP *EES* 1056:012013, nursing-unit efficiency — identified but not retrievable (403 / bot-wall); listed as a gap, used for nothing.
Professional / trade pages (T4 — used only for the ranges they agree on, and flagged in the rules)
- Archgyan, "How to Design a Hotel" — https://archgyan.com/how-to-design-a-hotel/
- Hotel Development Guide, "Architectural Planning" — https://hoteldevelopmentguide.com/architectural-planning/ ; "Hotel Structural Design and Column Grid Planning" — https://hoteldevelopmentguide.com/hotel-structural-design/
- Studio Puisto, "Designing Back-of-House Spaces for Hotels" — https://studiopuisto.fi/hospitality-tomorrow-10/
- PEB Steel, "Warehouse Design: Building + Layout Complete Guide" — https://pebsteel.com/en/warehouse-design-guide/
- Umstore Storage Systems, "Warehouse Racking Layout Design Guide" — https://www.umstoragesystems.co.uk/blog/warehouse-racking-layout-design-guide
- Oxmaint, "Plant Layout Types Compared: Process, Product & Cellular" — https://oxmaint.com/industries/manufacturing-plant/plant-layout-types-process-product-cellular-comparison
- Retail Design, "Retail Store Layout Design: Grid, Loop, Free-Flow" — https://retaildesign.ai/blog/retail-store-layout-design-guide
- Studio Matrx, "Retail Planning & the Shopper" — https://www.studiomatrx.org/students/interior-design-studio-3/retail-planning-and-the-shopper ; "Bullitt Center" guide — https://www.studiomatrx.org/guides/bullitt-center ; "Fagus Factory" canon note — https://www.studiomatrx.org/architecture-canon/fagus-factory
- HEWI, "Kindergarten new building guidelines" — https://www.hewi.com/en/mag/120-nursery-school-guidelines
Encylopedic cross-checks (T4, used only for figures also stated by a T3 source)
- Wikipedia: Commerzbank Tower — https://en.wikipedia.org/wiki/Commerzbank_Tower ; Selfridges Birmingham — https://en.wikipedia.org/wiki/Selfridges_Birmingham ; Gläserne Manufaktur — https://en.wikipedia.org/wiki/Gl%C3%A4serne_Manufaktur

<!-- bim-cad.md: rules=24, url-lines=8 -->
## bim-cad.md

**Read this session (evidence quoted above is from these only)**
1. IFC2x3 final, schema lexical page for `IfcRelConnectsPathElements` (Lawrence Berkeley National Laboratory mirror of the buildingSMART schema) — https://iaiweb.lbl.gov/Resources/IFC_Releases/R2x3_final/ifcsharedbldgelements/lexical/ifcrelconnectspathelements.htm — **T1 content, T3 host**. Definition read as: "provides the connectivity information between two elements, which have a path information".
2. buildingSMART `IFC4.x-development` issue #1, *IfcZone and IfcSpatialZone* — https://github.com/buildingSMART/IFC4.x-development/issues/1 — **T1 (official development repository; discussion, not the normative clause)**. Quotes used: TLiebich — "IfcZone is an arbitrary collection of spaces that may or may not be adjacent and do not have an own shape representation"; Moult on resolution — "make these minor tweaks to the definition of IfcZone".
3. URL/availability probes (not content): `https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcRelConnectsPathElements.htm` 301-redirects to `https://standards.buildingsmart.org/IFC/DEV/IFC4_3/HTML/lexical/…`, and both `…/lexical/IfcZone.htm` and `…/IfcRelSpaceBoundary.html` returned 403 to this client. These establish that the canonical IFC 4.3.2 lexical pages exist at that host; **their content was not read and is not quoted anywhere in this file.**
**Named, not retrieved — usable as a pointer, never as a clause citation**
4. ISO 16739-1:2018, *Industry Foundation Classes (IFC) for data sharing in the construction and facility management industries* — T1.
5. ISO 29481 series (Information Delivery Manual / Model View Definition) — T1; part-to-title mapping not verified.
6. ISO 19650 series (openBIM information management; "level of information need") — T1.
7. buildingSMART Information Delivery Specification (IDS) and buildingSMART Data Dictionary (bSDD) — T1; **no IDS construct (facet, cardinality, constraint vocabulary) is asserted in this file.**
8. B. Hillier & J. Hanson, *The Social Logic of Space*, Cambridge University Press, 1984 — T3.
9. B. Hillier, *Space is the Machine*, Butterworth-Heinemann, 1996 — T3.
10. A. Penn, B. Hillier, T. Banerjee, J. Xu, "Space syntax, axial maps and architectural morphology: automating axial map generation and configuration analysis", *Environment and Planning B*, 1997 — T2; volume/pages not verified.
11. C. Alexander, "A City is Not a Tree", *Architectural Forum*, vol. 122, 1965 — T3.
12. Commercial IFC model checkers (Solibri-class tools) and the automated design-rule-checking literature (semantic rule checking, code-as-rules) — **not reachable this session; deliberately left as `UNCITED — heuristic` in BIM-16/BIM-18 rather than paraphrased from memory.**
---

<!-- construction.md: rules=28, url-lines=19 -->
## construction.md

T1 — official standards bodies and public interest design resources:
- Whole Building Design Guide (WBDG/NIBS), *Design Disciplines* and service/plant content — https://www.wbdg.org/
- American Wood Council, *CLT Handbook: US Edition* (span tables, connections) — https://www.awc.org/
- The Concrete Centre, UK concrete design guidance (slab systems, span/depth) — https://www.concretecentre.com/
- Steel Construction Services / SCI, composite action and long-span guidance — https://www.steelconstruction.info/
- Post-Tensioning Institute — https://www.post-tensioning.org/
- Masonry: The Masonry Society (TMS 402) — https://www.masonrysociety.org/ ; Eurocode 6 / CEN
- ICC *International Building Code* (egress, shaft enclosures, fire-resistance) — https://www.iccsafe.org/ ; NFPA 101 *Life Safety Code* — https://www.nfpa.org/
- CEN, BS EN 12056-2 (gravity drainage design) — https://standards.cen.eu/ ; BSI/Approved Document E (sound insulation) — https://www.gov.uk/government/building-regulations
- CIBSE Guides A, G, S — https://www.cibse.org/ ; ASHRAE *Handbook: HVAC Applications* — https://www.ashrae.org/
- BSRIA knowledge hub / application guides (shafts, service coordination, ceiling zones) — https://www.bsria.com/
- MHCLG / IHBC and UK fire stop and compartmentation guidance; UL Fire Resistance Directory — https://www.ul.com/
- ISO modular coordination series (building module) — https://www.iso.org/
- CTBUH (tall-building structural/transfer and lateral-system material) — https://www.ctbuh.org/
T2 — peer-reviewed / academic:
- DfMA and industrialised-construction literature (building design management journals; construction-management repetition/learning-curve papers) — see Sources note below; **specific articles to be pinned during verification.**
T3 — established construction/engineering publications:
- Francis D. K. Ching & Mark M. Roundtree, *Building Construction Illustrated*, 6th ed., Wiley (2023) — primary construction reference for this file.
- Frank Ching (with various co-authors), *Building Construction Handbook*, Wiley — 12th ed. approximate; verify edition.
- Edward Allen & Joseph Iano, *Fundamentals of Building Construction: Materials and Methods*, 7th ed., Wiley.
- Ernst Neufert / Pete Silver, *Neufert Architects' Data*, 4th ed., Wiley/Birkhäuser.
- *Time-Saver Standards for Building Types* and *Architectural Graphic Standards*, Wiley.
- Schumacher & Lange, *Structural Details for Architecture and Design*, Birkhäuser.
- Ching, *Architecture: Form, Space, and Order*, 5th ed., Wiley (load path framing only).
- Park & Paulay, *Reinforced Concrete Design*, Wiley (shear-wall/continuity behaviour).
T4 — professional/practitioner commentary and forums:
- BSRIA/CIBSE practice articles, engineering firm technical blogs (structural and facade), architect-led buildability articles — used only for qualitative corroboration, never for numbers.
T5 — anecdote: deliberately unused.
**Retrieval state of this pass (honest log).** Located and URL-verified but *not* value-read: The
Concrete Centre *Slabs and Flat Slabs* lecture PDF; *How to Design Concrete Structures using Eurocode 2*;
AWC/Think Wood *CLT Handbook (US Edition)*; WoodWorks CLT design slides; Swedish Wood *CLT Handbook*;
IPC Chapter 7 via the ICC page (HTTP 403 to retrieval); IJAME 2023 PT-vs-solid-slab span/economy
comparison; ICCAUA 2021 PT cost paper; PHCPPros cleanout article. **Now read (audit pass, from an
adoption mirror not ICC): IPC 2021 §704.1 slope values and §708 cleanouts, incl. the ~100 ft spacing
ceiling — the earlier "§704/§707 stand, values do not" line is superseded; §707 was the wrong section.**
Not retrieved at all in this pass (named as the authority to go to, not as evidence read): IBC/ICC
chapter text (incl. the corrected shaft-enclosure address), BS EN 12056, CIBSE Guides A/G/S, BSRIA
application guides, NFPA 70/101, TMS 402, SCI composite tables, ADA 2010 / ANSI A117.1 clause text,
Approved Document E, DfMA journal articles, CTBUH transfer case studies.
UNCITED — heuristic ledger (items in this file without a retrieved numeric source): **every span band in
the reference table** — masonry 3–6 m, CLT one-way 2–5 m and ribbed/composite 5–8 m, RC ribbed/beam-and-
slab 4.5–8 m, flat slab 6–9 m, waffle 8–12 m, post-tensioned 8–12 m, steel + deck 2.5–4 / beams 6–9 m,
composite long span 9–15 m, trussed 15–45 m, parking 7.5–8.5 m, timber joists 2.5–5 m; the flat-slab
6–9 m "commonly quoted" wording; the accessibility proxies (915 / 1067 mm clear widths, 1500 mm turning
circle — the *tile* conversion 1500 mm = 3×3 tiles is verified arithmetic, the millimetre values are not
retrieved); the shaft minimum sizes (4×4 / 3×3 tiles); the drain-run placeholders (20 / 40 tiles); the
valve-within-20-tiles rule; the 4-tile removal-path and 6-tile service-band widths; the ISO "3 m minimum"
(withdrawn: that was the 3M = 300 mm module, see CN-01); all learning-curve and cost-delta implications;
the `aspect ≤ 1.5` two-way limit; the `≤ 3 distinct bay widths`, `distinctPartCount ≤ 6` and
`constancy ≥ 0.6` thresholds. These are *planning heuristics for the tile grid*, not construction claims.

<!-- site-context.md: rules=24, url-lines=42 -->
## site-context.md

Opened and used above (tier-stamped; books by edition, numbers only as the source states them):
**T1 — government / official standards and adopted codes**
- MHCLG/DLUHC, *National Design Guide: planning practice guidance for beautiful, enduring and successful places*, Jan 2021 — https://assets.publishing.service.gov.uk/media/602cef1d8fa8f5038595091b/National_design_guide.pdf (paras 24, 27, 41–43, 64–69, "Looking forward" box, glossary "Active frontage")
- DfT/DETR, *Manual for Streets*, 2007 — https://assets.publishing.service.gov.uk/media/5a7e0035ed915d74e6223743/pdfmanforstreets.pdf (§5.4.2 + Fig. 5.3 street widths; Table 5.1 height:width; §5.5 junctions; §6.3.6–6.3.8 desire lines and crossing frequency; §7.5 Table 7.1 SSD; §7.7 visibility splays; §7.8 forward visibility and obstructions; Fig. 6.2 corner radii)
- US Access Board, *2010 ADA Standards for Accessible Design* — https://www.access-board.gov/ada/ (§206.2.2, §206.4.1, §206.4.2, §403.3, glossary "Site", "Service Entrance", "Ramp")
- City of Sanford, NC, *Unified Development Ordinance*, Appendix A Definitions — https://www.sanfordnc.net/DocumentCenter/View/4980/Appendix-A---Definitions (Building envelope, Floor, Floor area, FAR, Impervious surface, Lot coverage, Phased site plan application, Setback ×5, Site plan)
- New York City, *Zoning Resolution* Art. II Ch. 3 (official text, print rendering last amended 5 Dec 2024) — https://zr.planning.nyc.gov/print/pdf/node/18037 and district chapter page https://zr.planning.nyc.gov/article-ii/chapter-3 (§§23-32/33/34 yard minimums; §23-422 heights; §23-423 setback depths and the 50 ft / 65-degree exemption; §23-431 street wall location; §23-432/433 base and maximum heights)
- Great Falls (MT) Fire Marshal's Office, *Fire Lanes / Fire Apparatus Access Roads*, rev. 05.10.2023 — https://www.greatfallsmt.gov/DocumentCenter/View/950/Fire-Apparatus-Access (restating IFC App. D incl. Tables D103.1/D103.4)
- Orem (UT), *Transportation Master Plan — Appendix B: Access Management Standards* — https://orem.gov/wp-content/uploads/2024/12/TMP-Appendix-B.pdf (Tables 1–2 access spacing and opposing-driveway offsets; median/vegetation sight-distance rule)
- City of Toronto, *Urban Design Guidelines for Sites with Drive-Through Facilities*, 29 Apr 2005 — https://www.toronto.ca/wp-content/uploads/2017/08/9491-Urban-Design-Guidelines-for-Sites-with-Drive-Through-Facilities.pdf (§6.1.3, §6.1.4, §6.4.1)
- City of Toronto, *Tall Building Design Guidelines*, May 2013 — https://www.toronto.ca/wp-content/uploads/2018/01/96ea-cityplanning-tall-buildings-may2013-final-AODA.pdf (§1.2 Master Plan for Larger Sites; §1.4 Sunlight and Sky View; §3.1.1 base scale/height; §3.2.1–3.2.3 floor plate, setbacks, separation)
- City of Canby (OR), *Development Code* criteria as applied in *Project Meadowlark — Project Narrative and Criteria Response*, 2024 — https://www.canbyoregon.gov/sites/default/files/fileattachments/planning_commission/meeting/packets/28404/attach_b_-_project_narrative_and_criteria_response.pdf (§16.10.060 loading; design-review scorecard)
- City of Sydney, *Development Control Plan 2012 — Section 5 Specific Areas* — https://www.cityofsydney.nsw.gov.au/-/media/corporate/files/publications/development-control-plans/2024/section5-dcp2012_030524.pdf (§5.1.7 Sun protection of public parks and places; Table 5.7)
- City of Sydney, *Environmental Wind Speed Measurements* (wind-tunnel report restating DCP 2012 wind criteria), 2022 — https://www.cityofsydney.nsw.gov.au/-/media/corporate/files/projects/policy-planning-changes/your-feedback-on-proposed-changes-to-planning-controls-for-hunter-street-and-pitt-street-sydney/documents/appendix-g-pedestrian-environmental-wind-report.pdf (§2 Environmental wind criteria)
- Charlotte Douglas International Airport, *14 CFR Part 150 Study Update — Appendix A: Applicable Laws, Regulations and Policies* (DRAFT Aug 2024) — https://cltpart150.com/wp-content/uploads/2024/08/06-DRAFT-CLT-Part-150-Study-Update-Appendix-A-Applicable-Laws-Regulations-and-Policies.pdf (Table A-1 = 14 CFR §150.151 land-use/noise compatibility; DNL 65 AIP threshold; Schultz curve note)
- Saratoga Springs (UT), *City Code ch. 19.10 Hillside Development Ordinance* — https://www.saratogasprings-ut.gov/DocumentCenter/View/702/1910-Hillside-Development
- Barnsley MBC, *Supplementary Planning Document: Residential Amenity and the Siting of Buildings* — https://www.barnsley.gov.uk/media/15718/residential-amenity-and-the-siting-of-buildings-spd.pdf (§§3.3–3.9)
- Greater London Authority, *The London Plan* (2021) — https://www.london.gov.uk/sites/default/files/the_london_plan_2021.pdf (ch. 3, design requirements for housing: outlook, overlooking, communal and private amenity space)
- Law Commission of England & Wales, *Rights to Light*, Law Com No 356 / HC 796 (2014) — https://assets.publishing.service.gov.uk/media/5a7dac39ed915d2acb6ed74c/44872_HC_796_Law_Commission_356_WEB.pdf
- US EPA, *Reducing Urban Heat Islands: Compendium of Strategies — Ch. 1: Urban Heat Island Basics* (draft; copy hosted by the City of Alexandria, VA) — https://media.alexandriava.gov/docs-archives/tes/eco-city/info/10=ecctf=meeting4=epa-reducing=urban=heat=islands=ch=1.pdf
**T2 — peer-reviewed / university**
- Reid Ewing & Robert Cervero, "Travel and the Built Environment — Synthesis", *Journal of the American Planning Association* 76(3), 2010 (full text as filed in a municipal EIR appendix) — https://filecenter.santa-clarita.com/Planning/VistaCanyon/DraftEIR/Volume3/Apx_4_3i_Travel_Built_Environment.pdf (Table 1 typical elasticities; Transportation Networks section; appendix tables of proximity buffers)
- NEMO Program, University of Delaware, *Nonpoint Source Education and Management Manual*, ch. 2 "Impervious Cover" — http://nemo.udel.edu/manual/chap2web.pdf (thresholds; Table 1 typical % impervious by land use)
- BRE, *Site Layout Planning for Daylight and Sunlight: A Guide to Good Practice*, 3rd ed., BRE Global, 2022 (adopted-plan copy hosted by South Dublin County Council) — https://www.sdcc.ie/en/devplan2022/adopted-plan/related-documents/site-layout-planning-for-daylight-and-sunlight-a-guide-to-good-practice.pdf (§§2.1 VSC 27 % / 25° obstruction angle, 0.8× test; §3.2 25 % APSH incl. 5 % winter; §3.3 two hours of sunlight on 21 March for amenity areas)
**T3 — established publications**
- Jane Jacobs, *The Death and Life of Great American Cities*, Random House, 1961 — full-text mirror https://www.petkovstudio.com/bg/wp-content/uploads/2017/03/The-Death-and-Life-of-Great-American-Cities_Jane-Jacobs-Complete-book.pdf (ch. 9 "The need for small blocks" pp. 178–193; ch. 14 "The curse of border vacuums" pp. 257–271; zoning-for-diversity passage on demolition controls)
- Kevin Lynch, *The Image of the City*, MIT Press, 1960 — course PDF mirror https://cus.ubt-uni.net/wp-content/uploads/2024/11/Kevin-Lynch-The-Image-of-the-City.pdf (five elements; "Legibility" and "Imageability" opening chapters)
- Kevin Lynch with Gary Hack, *Site Planning*, MIT Press (Open Library work record: 8 editions, first 1962) — cited for the inventory→analysis sequence only; edition statement not retrievable this pass
- James A. LaGro, *Site Analysis: A Class-Based Guide to Developing Site Planning and Design Skills*, Wiley (work record: 12 editions, first 2008; 2013 reprint) — same caveat
**Not opened this pass (deliberately unused as evidence)**
- DfT *Manual for Streets 2* (2014); Neufert, *Architects' Data*; CIBSE/ASHRAE context material; ICOMOS *Burra Charter*; FHWA *Corridor Access Management* — listed in the brief's source frame, not relied on for any number above.

<!-- environmental-design.md: rules=26, url-lines=73 -->
## environmental-design.md

Tiers: T1 standards/codes/government & intergovernmental · T2 peer-reviewed · T3 established professional publications and practice guidance · T4 professional-community/vendor · T5 anecdote. Nothing below T3 was used for a number without the entry labelling it as such inside the rule.
Codes, standards and government/intergovernmental (T1)
- Whole Building Design Guide (NIBS for US federal agencies), *Daylighting* — https://legacy.wbdg.org/resources/daylighting (source of the 15° tolerance, the 60 ft floor-depth statement, the 7'6" head-height line, the 2.5× penetration rule, the reflectance targets, the 50 fc task note and the "one-third of total building energy costs" claim)
- WBDG, *Natural Ventilation* — https://legacy.wbdg.org/resources/natural-ventilation (45 ft cross-ventilation width, `Qwind = K·A·V` with K = 0.4–0.8, 160 fpm → ~5 °F, humid-climate limitation, ASHRAE 55/62.1 references)
- WBDG, *Sun Control and Shading Devices* — https://legacy.wbdg.org/resources/sun-control-and-shading-devices (south easiest vs east/west hardest to shade; exterior shading 5–15 % cooling reduction; interior blinds control glare not heat)
- IECC via UpCodes, *Sidelight Daylight Zone* (C405.2.3.2) — https://up.codes/s/sidelight-daylight-zone (1.0 × head height lateral, 2 ft/610 mm longitudinal, monitor provisions; C402.4.2 threshold)
- IECC via UpCodes, *C402.5.3 Maximum U-factor and SHGC* — https://up.codes/s/maximum-u-factor-and-shgc (orientation-specific fenestration; skylight SHGC 0.60 exception with daylight controls)
- Energy Code Ace (CA Title-24), *13.24 NA7.6.1 Automatic Daylighting Control Acceptance* — https://energycodeace.com/site/custom/public/reference-ace-2016/Documents/1324na761automaticdaylightingcontrolacceptance.htm (daylit-zone geometry, separate zone control, 150 % setpoint ceiling, <35 % power under daylight)
- IES LM-83-12, *Spatial Daylight Autonomy (sDA) and Annual Sunlight Exposure (ASE)* — https://store.accuristech.com/ies/products/preview/1853773 (metric definitions)
- USGBC, *Daylight* credit (LEED v4.1 NC and others) — https://www.usgbc.org/credits/new-construction-schools-new-construction-retail-new-construction-data-centers-new-9 (credit exists, 1–3 points; thresholds were **not** machine-readable this pass — no point ladder quoted)
- BS EN 17037:2018, *Daylight in buildings* — catalogue record https://standards.iteh.ai/catalog/standards/cen/836e5b91-1eb0-4643-a2ba-7ca5a5988e64/en-17037-2018; target values read from the open-access study below (T2)
- EN 15251 / REHVA Journal, *Revision of EN 15251: Indoor Environmental Criteria* — https://www.rehva.eu/rehva-journal/chapter/revision-of-en-15251-indoor-environmental-criteria (daylight factor categories >5/>3/>2 %, 2.5–7 L/s per person, PMV bands 20–24/23–26 °C)
- ISO 3382-3:2022, *Acoustics — Sound reflection and diffusion properties of rooms — Part 3: Open offices* — https://www.iso.org/obp/ui/es/#iso:std:iso:3382:-3:en (title/scope; distance quantities read from T4 below)
- ANSI/ASHRAE/Standard 62.1 addendum PDF — https://www.ashrae.org/file%20library/technical%20resources/standards%20and%20guidelines/standards%20addenda/62.1-2016/62_1_2016_s_20190726.pdf (formula structure confirmed; **Table 6-1 per-type Rp/Ra values not readable — not quoted**)
- WHO Regional Office for Europe, *Noise* fact sheet — https://www.who.int/europe/news-room/fact-sheets/item/noise (<30 dB(A) night bedrooms, <35 dB(A) classrooms)
- WHO, *Guidelines for Community Noise* (1999) executive summary — https://www.ruidos.org/Noise/WHO_Noise_guidelines_summary.html (bedroom 30 dB night / 45 dB max, living room 35 dB, hospital 30 dB, school 35 dB, annoyance >55 dB) — T1 text via a T3 mirror
- NCC 2025 Part F6 natural-ventilation DTS values (5 % / 10 %, CO₂ 850 ppm, F6D7/F6D8(b)/F6V1) — read from CCC Engineering below (the NCC text itself was not retrieved)
- England Building Regulations Part E sound values (45 dB DnT,w+Ctr, 43 dB conversions, 40 dB Rw internal, 62/64 dB L'nT,w) — read from Plans Made Easy below
- BRANZ Level (NZ Building Research Association training resource), *Passive design for daylight in a home* — https://www.level.org.nz/passive-design/daylighting/ (glazing ≥10 % of floor area, head-height vs room-width rule, ~1.5 × head height penetration, 30 lx/75 % target, 900–2000 mm clear zone)
- BRANZ Level, *Location and orientation for passive heating and cooling* — https://www.level.org.nz/passive-design/location-orientation-and-layout/ (within ~20° of north; living north / services south; shallow east–west plan)
- NZEB (TERI), *Form & Orientation* — https://nzeb.in/knowledge-centre/passive-design/form-orientation/ (N–S long axis, 0–30° tolerance, compact form for hot-dry and cold)
Peer-reviewed and university (T2)
- "The practical implications of the EN 17037 minimum target daylight level…" (open access) — https://pmc.ncbi.nlm.nih.gov/articles/PMC10773465/ (300 lx / 100 lx / 2190 h / 0.85 m values)
- M. Karimoshaver & F. Derakhshan, "Window Orientation, Glare, and Visual Comfort in Offices", *Journal of Daylighting* — https://solarlits.com/jd/13-167 (DGP > 0.35 on SE/SW; NE/NW better; 20–40 % of façade; vertical illuminance > 600 lux; desk orientation)
- J. Li, B. Zheng, K. B. Bedra, Z. Li, X. Chen, "Evaluating the Effect of Window-to-Wall Ratios on Cooling-Energy…", *IJERPH* 18 (2021) — https://pmc.ncbi.nlm.nih.gov/articles/PMC8393238/ (+100 kWh per +20 % WWR, southern Hunan office, 0–100 % WWR sweep)
- S. Woo et al., "Access to Daylight and Views Improves Physical and Emotional Wellbeing…", *Frontiers in Sustainable Cities* 3:690055 (2021) — https://www.frontiersin.org/journals/sustainable-cities/articles/10.3389/frsc.2021.690055/full
- "The silent threat: investigating sleep disturbances in hospitalized patients" (open access) — https://pmc.ncbi.nlm.nih.gov/articles/PMC11107945/ (shared 49.9 dB vs single 44.7 dB; >100 dB peaks; 2–3× events/night; 40 % poor sleep)
- R. S. Ulrich, "View through a window may influence recovery from surgery", *Science* (1984) — https://pubmed.ncbi.nlm.nih.gov/6143402/ ; knowledge-repository summary https://www.healthdesign.org/knowledge-repository/view-through-window-may-influence-recovery-surgery (used **qualitatively only**: no counts or day figures taken)
- "Flanking Sound Transmission in Massive-Lightweight Connections", *Archives of Acoustics* (PAN) — https://www.journals.pan.pl/Content/138550
- "Prediction of flanking sound transmission through gypsum board partitions", DAGA — https://pub.dega-akustik.de/DAGA_1999-2008/data/articles/003324.pdf
- "A Simulation-based review of the ubiquitous window-head-height to daylit zone depth rule-of-thumb" / "Daylight design rules of thumb" — https://www.researchgate.net/publication/44088466…, https://scispace.com/pdf/daylight-design-rules-of-thumb-1f5crijuxp.pdf (**listed, not retrieved** — both blocked; the multipliers used in EN-04 come from the T1 sources instead)
Established professional publications and practice guidance (T3)
- Anstey Horne, *Daylight and Sunlight: BRE Guidelines* — https://www.ansteyhorne.co.uk/news/daylight-and-sunlight-bre-guidelines (VSC ≥27 %/15–27 %/<5 %; NSL 0.8×; APSH 25 % annual / 5 % winter; façades within ±30° of due south)
- Anstey Horne, *Daylight Factors and BS EN 17037* — https://www.ansteyhorne.co.uk/news/daylight-factors-and-bs-en-17037-understanding-internal-daylighting-standards
- Pager Power, *What are the 45 and 25 Degree Rules?* — https://www.pagerpower.com/news/daylight-sunlight-assessments-what-are-the-45-and-25-degree-rules/ (BRE 209 screen rules and their measurement points)
- VELUX DEIC, *Daylight requirements in building codes* — https://www.velux.com/healthy-buildings/research-and-knowledge/deic-basic-book/daylight/daylight-requirements-in-building-codes (Denmark 10 % → 15 % glass/floor; BREEAM domestic ≥1.5 % average DF in living/dining/studies; 2 % DF commercial workplane; 300 lx recommendation)
- CCC Engineering, *Natural Ventilation NCC 2025: 5 % Openable Area + DTS Rules* — https://cccengineering.com.au/design-memos/natural-ventilation-ncc-compliance/ (NCC F6 clause values; CIBSE AM10 single-sided ~2 × and cross 4–5 × ceiling height)
- WindowMaster, *Natural Ventilation Design Guidelines* — https://www.windowmaster.com/expertise/natural-ventilation-and-mixed-mode-ventilation/natural-ventilation-design-guidelines/ (single-sided ~10 m; cross ≈5 × height)
- J. Straube, BSD-061 "The Function of Form — Building Shape and Energy", Building Science Corporation — https://buildingscience.com/documents/insights/bsi-061-function-form-building-shape-and-energy (compactness C = V/SA; ~25 % small-house vs ~10 % large-building heating-load sensitivity)
- Steel Construction Information Service, *Thermal mass for cooling in multi-storey commercial buildings* — https://steelconstruction.info/topics/sustainability/thermal-mass/ (BRE Digest 454: penetration ~100 mm; optimum 75–100 mm; deep plans hinder flow; <1 % carbon variation)
- Climate4Buildings, *Adaptive Thermal Comfort Model: ASHRAE 55 and EN 16798* — https://climate4buildings.com/guides/adaptive-thermal-comfort (0.31 T + 17.8, ±3.5/±2.5 °C, 10–33.5 °C; 0.33 T + 18.8, Cat I/II/III bands, 10–30 °C, applicability conditions)
- Plans Made Easy, *Building Regulations Part E Explained* — https://plansmadeeasy.org/building-regulations-part-e/
- Designing Buildings, *Sound insulation in buildings* — https://www.designingbuildings.co.uk/wiki/Sound_insulation (~45 dB Dw typical office; 5–10 dB Rw-to-Dw gap)
- Techlumen, *EN 12464-1 / EN 12464-2 specification tables* — https://www.techlumen.gr/en/guide/lighting-standards-guide/ (per-room-type lux, UGR, Ra)
- Christopher Alexander, Shara Ishikawa & Murray Silverstein, *A Pattern Language*, Pattern 159 "Light on Two Sides of Every Room" — https://patternlanguage.cc/Patterns/Light-on-Two-Sides-of-Every-Room-(159)
- G. Z. (Olgyay) tradition as relayed by WBDG above: *Sun Control and Shading Devices* (1955) — cited as the origin of the shading-device-by-orientation family; **no text retrieved this pass**, no dimension attributed to it
- Edward M. Mazria, *The Passive Solar Energy Book* / Szokolay, *Introduction to Architectural Science* / Brown & Grimm, *Urban Resource Systems* / Hopkins, *Guide to Sustainable Construction* — listed as background; **no sentence or number taken from any of them in this pass** (not retrievable), so no claim below rests on them
Professional-community and vendor (T4 — used only for method, or for figures explicitly labelled Low/Medium where used)
- Passive Solar Architecture, *Passive Solar Overhang Calculator* — https://www.passivesolararchitecture.com/passive-solar-overhang-calculator/ (projection = (G + H)/tan αp and the worked example)
- GDCG, *External vs internal shading — what the evidence says* — https://gdcg.co.uk/blog/external-vs-internal-shading-what-the-evidence-says/ (trade-association campaign blog; **used for the direction "external > internal" only** — the "12–18 °C vs 8–13 °C peak reduction" magnitudes this file previously carried are removed because the blog cites them to an unnamed BBSA-supported study with no reference list; audit 05 A4).
- eNoiseControl, *Doubling of Distance Noise Reduction* — https://www.enoisecontrol.com/acoustic-terminology/doubling-distance-noise-reduction-decibel/ (6 dB per doubling in free field; less in reverberant rooms)
- Treble Technologies, *Open Plan Office acoustic parameters* — https://docs.treble.tech/acoustic-parameters/open_plan_office (r_D via STI < 0.5, r_C via SPL < 45 dB(A), D₂,S as dB per doubling)
- Commercial Acoustics, *Noise Criteria (NC) Rating Chart* — https://commercial-acoustics.com/sound-advice/noise-criteria-nc-rating-chart/ (private office NC 30–35, open plan NC 35–40, hospital patient room NC 25–35)
- biobuilds, *Passive House Certification: criteria and classes* — https://www.biobuilds.com/blog/passivhaus/certification (PHI Classic: 15 kWh/m²a, 10 W/m², 0.6 ACH₅₀, 60 kWh/m²a PER on TFA)
- ClimateStudio documentation, *LEED v4 Daylight Option 1* — https://climatestudiodocs.com/docs/daylightLEEDOpt1.html (ASE = >1000 lux for >250 occupied hours; v4 >10 % ASE exclusion)
- ISO 1006/2848-style modular-coordination cross-reference: see `architecture-theory.md` TH-22 (the 0.5 m tile is not an ISO coordination size)
Could not retrieve this pass (recorded so no rule pretends otherwise): BRE Report BR 209 primary text; CIBSE Guide A and AM10 primary text; ASHRAE 90.1 Appendix G perimeter-zone depth convention; ASHRAE 62.1 Table 6-1 per-type values; LEED sDA/ASE point ladder; BS 8233 text (two PDF hosts refused parsing); the Scottish solar-gain-limit formula; ISO 10211/EN ISO 14683 thermal-bridge default values; Passive House Institute's own criteria page; the Baruch "Design Building" daylight and ventilation rule pages (403).
---

<!-- human-behavior.md: rules=26, url-lines=72 -->
## human-behavior.md

Tiers: T1 official (agency/standards/code/international guideline) · T2 peer-reviewed & university · T3 professional publications and established textbooks · T4 professional community · T5 anecdote. Numbers are taken only from T1/T2 unless the entry says otherwise; where a source was located but its body could not be read, that is stated and no number is attributed to it.
Official and governmental (T1)
- US DOT / FHWA & TRC, *Capacity Analysis of Pedestrian and Bicycle Facilities* (Feb 1998), Section 3 — walkway/terminal/platoon/stair/crossflow/queue LOS tables — https://www.fhwa.dot.gov/publications/research/safety/pedbike/98107/section3.cfm (primary source of every m²/ped and ped/min/m figure in HB-01, HB-02, HB-20, HB-22, HB-24)
- IMO, MSC.1/Circ.1238, *Guidelines for Evacuation Analysis*, Annex 1 Tables 1.1 (speed vs density) and 1.2 (max flow 1.3 / 1.1 / 0.88 p per m per s), queue threshold ≥ 3.5 p/m² — as published at https://puc.overheid.nl/doc/PUC_1952_14/
- IBC (2023 Florida Building Code edition) Ch. 30, §3008.6.4 *Lobby size* — 3 ft² (0.28 m²) per person for ≥ 25 % of the occupant load served; one 30 × 48 in wheelchair space per 50 persons — https://up.codes/viewer/florida/fl-building-code-2023/chapter/30/elevators-and-conveying-systems
- IBC §1005 *Means of Egress Sizing* — https://up.codes/s/means-of-egress-sizing (used in HB-22 as the design-occupancy counterpart; the egress arithmetic itself is in TH-12)
- 2010 ADA Standards for Accessible Design, Ch. 3 §305.3 clear floor space — https://www.access-board.gov/ada/chapter/ch03/ (static-body envelope, HB-04)
- NIST, TN 1664, Kuligowski & Hoskins, *Occupant Behavior in a High-rise Office Building Fire* (2010) — https://www.nist.gov/publications/occupant-behavior-high-rise-office-building-fire (PDF body https://www.nist.gov/document/tn1664pdf; abstract read, detailed timings not machine-readable this pass)
- NIST publication server, *Questioning the linear relationship between doorway width and pedestrian evacuation flow rate* — https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=861412 (title and URL verified; PDF not machine-readable — cited for the existence of the non-linearity question only, no coefficient taken)
Peer-reviewed and university (T2)
- *Pedestrian flow characteristics through different angled bends: Exploring the spatial variation of velocity*, PLOS ONE 17(3):e0264635, 2022 — https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0264635 / https://pmc.ncbi.nlm.nih.gov/articles/PMC8893709/ (bend angles, inner-vs-outer lane speeds, density 3 p/m², "series of smaller angles" recommendation)
- Küpper & Seyfried, *Waiting in crowded places: influence of number of pedestrians and interpersonal spacing*, Sci Rep 2023 — https://pmc.ncbi.nlm.nih.gov/articles/PMC10498346/ (preferred distance ≈ 1.0–1.2 m irrespective of density)
- *Estimating density limits for walking pedestrians keeping a safe distance from each other*, Sci Rep 2021 — https://pmc.ncbi.nlm.nih.gov/articles/PMC7810874/ (≤ 0.16 p/m² ≈ 6 m²/ped for 1 m separation)
- *The connection between stress, density, and speed in crowds*, 2023 — https://pmc.ncbi.nlm.nih.gov/articles/PMC10442413/ (speed ↑ stress ↑; density ↑ speed ↓ stress ↑)
- *How long is too long? Examining waiting times and stress in human queues*, 2025 — https://pmc.ncbi.nlm.nih.gov/articles/PMC12369606/ (30 participants, 1,416 trials, no queue-length effect)
- *Evacuation behaviors and emergency communications: an analysis of…* — https://pmc.ncbi.nlm.nih.gov/articles/PMC10620751/ (35 % delayed, ≥ 30 s threshold, 0.68 vs 1.68 min pre-movement as cited there from Lovreglio, familiar-exit risk)
- *Wayfinding in Healthcare Facilities: Contributions from Environmental Design and Cognition Research*, HERD — https://pmc.ncbi.nlm.nih.gov/articles/PMC4287692/ (Baskaya et al. 2004 — 63.2 % vs 6.5 %; Werner & Schindler 2004 interconnection density; Tang et al. 2004/2009 > 40 % door over sign; Hashim et al. 2014 symbol recognition; Wright et al. 2010 kiosk success — all read as reported in this review, not in the originals)
- Jamshidi et al., *Wayfinding in Interior Environments: An Integrative Review*, Frontiers in Psychology, 2020, DOI 10.3389/fpsyg.2020.549628 — https://pmc.ncbi.nlm.nih.gov/articles/PMC7677306/ (open access; wayfinding as "a problem-solving process of determining and navigating a route to a destination", decision points as "nodes" with "two or more alternatives exist", after O'Neill 1991a — definitional only, HB-06)
- *Association between room location and adverse outcomes in hospitalized patients* — https://pmc.ncbi.nlm.nih.gov/articles/PMC6520200/ (83,635 inpatients; OR 1.15 critical illness, OR 1.16 mortality, +13 h LOS by distance from ward entrance; no nurses'-station effect)
- *Factors Affecting Nurses' Walking Distance: Age, Clinical Ladder Level, Wards, Nurse Calls, Weekend*, J Nurs Manage 2025 — https://pmc.ncbi.nlm.nih.gov/articles/PMC12411061/ (4.17 / 6.18 / 4.76 km per shift, N = 883 / 991 / 1,050)
- Obeidat, Bani Younis & Al-Shlool, *Investigation into the impact of nursing unit layout on critical care nurses*, Heliyon 8(2) e08929, 2022, DOI 10.1016/j.heliyon.2022.e08929 — https://pmc.ncbi.nlm.nih.gov/articles/PMC8850728/ (open access; per-shift means 2.28 km private-room ICU vs 2.87 km and 2.96 km open-ward ICUs, station centrality named as driver — HB-15's layout-sensitivity half)
- *Examining key hotel attributes for guest sleep and overall satisfaction* — https://pmc.ncbi.nlm.nih.gov/articles/PMC10130565/ (N = 609; hallway OR 2.01, adjacent room OR 2.07, outside OR 2.23, AC/heater OR 1.57, pillows OR 2.49/3.29)
- *Environmental noise in hospitals: a systematic review* — https://pmc.ncbi.nlm.nih.gov/articles/PMC7935697/ (33 studies; day Leq 37–88.6 dB(A), night 38.7–68.8; WHO ≤ 35 / ≤ 30 as reported there)
- Danielsson & Rogström, *Noise and Perceived Privacy – Flexible Office Space Matters* (Acoustics Research Press Room, JASA) — https://acoustics.org/pressroom/httpdocs/155th/danielsson.htm (469 participants, 26 organisations, seven office categories; highest privacy dissatisfaction in traditional open-plan)
- Nguyen et al., *Where do People Interact in High-Rise Apartment Buildings?*, IJERPH 2020 — https://pmc.ncbi.nlm.nih.gov/articles/PMC7369851/ (274 residents, four buildings 19–36 floors; 46 % circulation, 16.2 % open space, 15.9 % home)
- *Designing Hospital for better Infection Control: an Experience*, Mil Med J Armed Forces India — https://pmc.ncbi.nlm.nih.gov/articles/PMC4923482/ (separate stairs/lifts for waste; bed centres ≥ 8 ft; 1 hand-wash basin per 6 beds; 24–32 beds per unit)
- *Effect of waiting time estimates on patients' satisfaction in the emergency department: randomized controlled trial*, Alrajhi KN et al., Saudi Med J 2020;41(8):883–886 — https://pmc.ncbi.nlm.nih.gov/articles/PMC7502966/ (n = 100; 5.92 vs 5.45, p = 0.476; actual wait 70.54 min)
- *Impact of visibility on indoor retail store rent*, J Property Investment & Finance — https://ideas.repec.org/a/eme/jpifpp/jpif-01-2022-0004.html (object-based isovist, 153 stores, IDR 40.74/m²/month per m²·person, 38.4 % of price variance from layout)
- *A Review of Pedestrian Flow Characteristics and Level of Service Criteria*, Collective Dynamics — https://collective-dynamics.eu/index.php/cod/article/view/A17 (LOS construct and its limits)
- *Effect of architectural adjustments on pedestrian flow at bottleneck*, Collective Dynamics 2020 — https://collective-dynamics.eu/index.php/cod/article/view/A47 (boundary-layer and effective-width effects at bottlenecks; door width ↑ → evacuation time ↓, no numeric table extractable)
- *The influence of spatial configuration on…* / bend dynamics follow-up, Sustainability 16(4):1391 — https://www.mdpi.com/2071-1050/16/4/1391 (listed; not used for a claim)
- *Productivity, satisfaction, work environment and health after relocation to an open-plan office* — https://pmc.ncbi.nlm.nih.gov/articles/PMC8304243/ (listed; no claim taken)
- *The influence of classroom seating arrangement on children's…* (Tobia et al. 2020, N = 77) — https://pmc.ncbi.nlm.nih.gov/articles/PMC7602767/ (used only in the type audit; small study, no dimension derived)
- Karki, *Visibility-Based Hospital Inpatient Unit Design*, doctoral dissertation, University of Louisville — https://ir.library.louisville.edu/context/etd/article/5458/viewcontent/Dissertation_Uttam_Karki.pdf (T2, listed as the visibility-design convention; HB-18 argues against relying on it)
- "Measuring the Structure of Visual Fields in Nursing Units", Health Design knowledge repository — https://www.healthdesign.org/knowledge-repository/measuring-structure-visual-fields-nursing-units-0 (403 on retrieval; title listed, no claim taken)
- Contested-behaviour papers, cited by title only because bodies were not retrievable: *Clockwise versus counterclockwise turning bias*, J Retailing & Consumer Services 2022 — https://www.sciencedirect.com/science/article/abs/pii/S0969698922000583; *Decompression zone deconstructed: Products located at the store entrance do have an impact on sales*, 2018 — https://www.researchgate.net/publication/328756004_ (HB-26)
- Space-syntax method references carried over from TH-20: *Bill Hillier's Legacy: Space Syntax — A Synopsis of Basic Concepts, Measures and Empirical Application*, Sustainability 13(6):3394, 2021 — https://www.mdpi.com/2071-1050/13/6/3394; Hillier & Hanson 1984; Hillier 1996 — T3
Established professional publications (T3)
- David Maister, *The Psychology of Waiting Lines* — http://davidmaister.com/blog/201/ (eight principles quoted in HB-12; also hosted as a course PDF at http://www.columbia.edu/~ww2040/4615S13/Psychology_of_Waiting_Lines.pdf — PDF body not machine-readable)
- Space Syntax Ltd, *The Space Syntax Approach* — https://spacesyntax.com/the-space-syntax-approach/ (both quotes verified in TH-11/TH-20 and reused here)
- Edward T. Hall, *The Hidden Dimension*, Doubleday 1966 — proxemic bands as reported in EBSCO Research Starter *Proxemics* https://www.ebsco.com/research-starters/social-sciences-and-humanities/proxemics/ (T3) and https://en.wikipedia.org/wiki/Proxemics (T4); the primary text was not retrievable, so the band values are second-hand
- Paul Passini, *Wayfinding in Architecture*, Van Nostrand Reinhold 1984; Passini & Cleemenses, *Wayfinding: People, Signs and Architecture* — https://searchworks.stanford.edu/view/2376159 (decision-sequence framing; carried from TH-19)
- Irwin Altman, *The Environment and Social Behavior: Privacy, Personal Space, Territory, and Crowding*, Brooks/Cole 1975 — cited at the level "privacy is regulated at boundaries" only
- Kevin Lynch, *The Image of the City*, MIT Press 1960 — https://cus.ubt-uni.net/wp-content/uploads/2024/11/Kevin-Lynch-The-Image-of-the-City.pdf
- CIBSE Lifts Group / Peters Research, *Lift Traffic Analysis and Simulation: Open Forum Report* — https://download.peters-research.com/library/CIBSE_Traffic_Analysis_and_Simulation_Open_Forum_Report.pdf (PDF not machine-readable this pass; measures named in TH-29, no number taken here)
- *Lift escalator library* papers on lobby design and up-peak handling — https://liftescalatorlibrary.org/paper_indexing/papers/00000370.pdf and /00000269.pdf (listed; bodies not machine-readable, no claim taken)
Professional-community and educational sources (T4 — used for method or for explicitly-labelled heuristics)
- Studio Matrx Academy, *Service Flow & Staff Spaces* — https://www.studiomatrx.org/students/hospitality-design/service-flow-and-staff-spaces (source of the quoted separation rule and of the "rooms not ready / food arrives cold / guests see the machinery" failure list in HB-14)
- Life of an Architect, *Men and Urinals* — https://www.lifeofanarchitect.com/men-and-urinals-time-for-one-of-them-to-change/ (anecdotal territorial-spacing observation; the underlying peer-reviewed lavatory study — Bailey, LaPointe & McCarty, *Personal Space Invasions in the Lavatory*, Environment and Behavior 1976 — could not be retrieved with numbers, so it is deliberately not cited for a figure)
- "Limitations, critiques and inconsistencies of the space syntax methodology" — https://www.academia.edu/32698940/LIMITATIONS_CRITIQUES_AND_INCONSISTENCIES_OF_THE_SPACE_SYNTAX_METHODOLOGY (counter-case in HB-25)
- McTrans Center, *Understanding Pedestrian Analysis on Segments* — https://mctrans.ce.ufl.edu/understanding-pedestrian-analysis-on-segments/ (method context only; the HCM "design pedestrian" body-width figure could not be verified and is not used)
- Hotel noise trade coverage — https://insights.ehotelier.com/news/2013-09-29/noise-is-most-common-complaint-in-online-hotel-reviews/ and https://www.cnn.com/2026-09-03/travel/noise-hotels-complaints-solutions (neither retrievable with numbers this pass; HB-16 rests on the T2 survey instead)
---

<!-- human-scale.md: rules=28, url-lines=19 -->
## human-scale.md

T1 — official standards and accessibility guidance
- US Access Board, *2010 ADA Standards for Accessible Design*, ch. 2 (scoping), ch. 3 (§304 turning space, §305 clear floor space, §308 reach ranges), ch. 4 (§403 routes and protruding objects, §404 doors), ch. 6 (§604 water closets, §606 lavatories, §607-608 tubs/showers). **ch. 3 + ch. 4 read back this session (values verified):** §304.3 turning space 60 in / 1525 mm circle or T-shape · §305.2 clear floor space 30 × 48 in / 760 × 1220 mm · §308 reach high 48 in / low 15 in (1220 / 380 mm) · §403.5.1 route clear width 36 in / 915 mm, 32 in / 815 mm allowed only for segments ≤ 24 in / 610 mm separated by ≥ 48 in segments · §404.2.3 door clear width 32 in / 815 mm measured face-of-door to stop at 90° open · §404.2.4.1 maneuvering clearance forward-pull 60 in perpendicular + 18 in beyond the latch/hinge side, forward-push 48 in + 0 in (add 12 in with a closer) · §404.2.9 interior door opening force 5 lb / 22 N max · §405.2 ramp running slope 1:12. On this basis HS-01, HS-04, HS-05, HS-06, HS-21, HS-22 and HS-23 are High confidence; **ch. 6 fixture clearances were not re-read this session and stay Medium** (HS-07, HS-08). https://www.access-board.gov/ada/chapter/ch03/ · https://www.access-board.gov/ada/chapter/ch04/ · https://www/access-board.gov/ada/chapter/ch06/
- ISO 7250-1:2017, *Ergonomics — Basic human body measurements for technological design — Part 1: Body measurement concepts and terminology*. T1, cited by standard number.
- BSI, *BS 8300-1:2018 Design of an accessible and inclusive built environment — Part 1: Commercial buildings*. T1, cited by number (no text retrieved).
- DIN 18040-1:2010-10, *Barrierefreies Bauen — Planungsgrundlagen — Teil 1: Öffentlich zugängliche Gebäude*. T1, cited by number (no text retrieved).
- CEN, *EN 527 series — Office furniture — Work tables and desks* (height 720–760 mm class values). T1, cited by number.
- UK, *Approved Document M 2022, Access to and use of buildings, Vol. 2 (buildings other than dwellings)* and *Approved Document K 2013 (+2022)*, *Protection from falling, collision and impact*. T1, cited by edition; specific clause values marked UNCITED this session.
- ICC, *International Building Code*, ch. 10 *Means of Egress* (corridor/stair/aisle widths, egress capacity 0.2 in/occupant) and NFPA 101 *Life Safety Code* ch. 7/14. T1, cited by code; values UNCITED.
- National Kitchen & Bath Association, *Residential Kitchen Planning Guidelines* https://www.nkba.org/ — T1/T3 industry standard; aisle figures UNCITED.
T2 — ergonomics research
- Human Factors and Ergonomics Society, *HFES Guidelines: Anthropometric Data* (PDF) https://www.hfes.org/Portals/0/Publications/Guidelines_AnthropometricData.pdf
T3 — established publications (by edition; no full-text retrieved this session unless noted)
- Stephen Pheasant & Christine Haslegrave, *Bodyspace: Anthropometry, Ergonomics and the Design of Work*, 3rd ed., Taylor & Francis, 2012 reprint of 2006.
- James Panero & Martin Zelnik, *Human Dimensions & Interior Space: A Source Book of Design Reference Metrics*, revised ed., Whitney Library of Design, 1979.
- Ernst & Peter Neufert, *Architects' Data*, 4th ed., Wiley, 2012 (English translation of *Bauentwurfslehre*).
- Francis D. K. Ching, *Interior Graphic Standard: A Guide to Architectural Graphics Criteria*, 2nd ed., Wiley (dimension tables for furniture, clearances, circulation).
- John Pile & James G. Tretheway, *Design Interior*, current ed., Wiley — furniture/clearance tables (cited only as corroboration).
- Linda N. Gustin et al., *Problem Seeking / Architectural Programming* lineage — cross-reference to architecture-theory.md TH-01.
T4 — secondary/practitioner
- Retail and hospitality planning summaries published by store-planning consultancies (aisle and BOH width claims) — used only as corroboration, marked UNCITED where quoted.

<!-- space-programming.md: rules=24, url-lines=30 -->
## space-programming.md

Tier key: **T1** official/agency standards · **T2** peer-reviewed · **T3** established
publications (with edition) · **T4** practitioner/professional-service pages · **T5** anecdote.
Status column is part of the citation: `READ` = content retrieved and used; `LOCATED` = document
identified, content not retrieved this pass (so nothing numeric rests on it).
| # | Publisher / document | URL | Tier | Status | Used for |
|---|---|---|---|---|---|
| 1 | DfE/Education and Skills Funding Agency, *Notes on area guidelines for mainstream schools: BB 103* | https://www.gov.uk/government/publications/area-guidelines-and-net-capacity/notes-on-area-guidelines-for-mainstream-schools-bb103 | T1 | **READ** | SP-01/SP-02/SP-05/SP-15/SP-18/SP-22: non-statutory area guidelines; "reduced minimum internal and external areas"; gross "averages 15 % lower than BB98"; separate area-guideline vs net-capacity documents |
| 2 | GOV.UK, *Area guidelines and net capacity* (publication hub) | https://www.gov.uk/government/publications/area-guidelines-and-net-capacity | T1 | LOCATED | SP-03/SP-08: per-place basis + demand→area→capacity formulae |
| 3 | DfES, *Building Bulletin 98: Briefing Framework for Secondary School Projects* (2004), PDF | https://education-uk.org/documents/pdfs/2004-building-bulletin-98-sec.pdf | T1 | LOCATED | SP-01: briefing-before-sizing as an official two-stage process; the pre-2010 gross baseline |
| 4 | DfE, *BB 104 Area guidelines for SEND and alternative provision* | https://www.gov.uk/government/publications/area-guidelines-for-send-and-alternative-provision-bb-104 | T1 | LOCATED | School register (specialist bands) — not read |
| 5 | NHS England, *HTM 00: Policies and principles of facilities design and construction*, PDF | https://www.england.nhs.uk/wp-content/uploads/2021/05/HTM_00.pdf | T1 | LOCATED (binary, not parsed) | SP-11/SP-20: plant + services as named drivers; hospital register — no figure taken |
| 6 | NSS Scotland, *Core guidance — general design for healthcare buildings (HBN 00-01)* | https://www.nss.nhs.scot/publications/core-guidance-general-design-for-healthcare-buildings-hbn-00-01/ | T1 | LOCATED | Hospital corridor/room schedule bands — not read |
| 7 | NHS Wales / NWSSP, *HBN 15-02 Facilities for same day emergency care*, PDF | https://nwssp.nhs.wales/ourservices/specialist-estates-services/specialist-estates-services-documents/whbns-library/hbn-15-02-facilities-for-same-day-emergency-ambulatory-care/ | T1 | LOCATED | Clinical room areas — not read |
| 8 | GSA, OAS 7005.1B *Internal Space Allocation, Design, and Management Policy*, PDF | https://www.gsa.gov/directives/files?file=2026-06%2FOAS%207005.1B%2C%20Internal%20Space%20Allocation%2C%20Design%2C%20and%20Management%20Policy.pdf | T1 | LOCATED (fetch not attempted) | SP-09/SP-17: per-occupant federal allocation policy — no figure taken |
| 9 | US Dept of State, *FAM 06FAM-1710 Office Space Assignment and Utilization, Design and Construction* | https://fam.state.gov/fam/06fam/06fam1710.html | T1 | LOCATED, **fetch failed** | SP-17 office area per person — nothing taken from it |
| 10 | UNICEF, *Office Space Standards and Guidelines* (management-premises annex) | https://www.unicef.org/nepal/media/20591/file/New_Office_Annex_F_UNICEF_management_premises_guidelines_for_dhangadi.pdf | T1 | LOCATED | SP-03/SP-17 institutional per-person allocation — not read |
| 11 | BOMA International, *BOMA Standards* (ANSI/BOMA Z65.1 family) | https://boma.org/boma-standards/ | T1 | LOCATED | SP-06/SP-18: usable vs rentable, load factor; North American jurisdiction |
| 12 | RICS, *New IPMS aims to enable consistent measurement* (Property Journal) | https://ww3.rics.org/uk/en/journals/property-measurement-standards.html (article: https://ww3.rics.org/uk/en/journals/property-journal/ipms-enables-consistent-measurement.html) | T1 | LOCATED | SP-06/SP-18: IPMS 1–3, UK jurisdiction, measurement to internal face of perimeter wall |
| 13 | Blackacre Surveyors, *RICS Code of Measuring Practice: a guide to GEA, GIA, NIA and IPMS* | https://blackacresurveyors.com/blog/why-international-property-measurement-standards-ipms/ | T4 | LOCATED | SP-06: practitioner summary of what each convention counts |
| 14 | *Towards harmonizing property measurement standards* (ResearchGate) | https://www.researchgate.net/publication/329812287_Towards_harmonizing_property_measurement_standards | T2 | LOCATED (abstract stream) | SP-06/SP-18: evidence the conventions are materially non-comparable |
| 15 | WBDG (NIBS), *Architectural Programming* | https://www.wbdg.org/design-disciplines/architectural-programming | T1/T3 | LOCATED | SP-01/SP-23: programming as named pre-design discipline and its documented output |
| 16 | The Foraker Group, *Architectural Programming* | https://www.forakergroup.org/predevelopment/resources/architectural-programming/ | T4 | LOCATED | SP-01/SP-23: programme as the artefact design is demonstrated against |
| 17 | OfficeSpaceSoftware, *Office space per person: standards and density benchmarks* | https://www.officespacesoftware.com/blog/recommended-office-space-per-employee/ | T4 | LOCATED | SP-17: the (unverified) existence of competing commercial density figures — no number taken |
| 18 | F. Neufert / P. Neufert, *Architects' Data*, 3rd ed. (English), Wiley | print — no URL | T3 | **NOT CONSULTED** | Target for the whole register's real bands; every heuristic row should be re-sourced here |
| 19 | *Time-Saver Standards for Building Types*, 5th ed., McGraw-Hill | print — no URL | T3 | **NOT CONSULTED** | Per-space-type net areas and the type-by-type take-off this file's register should eventually match |
| 20 | Ching, *Building Construction Illustrated*, 5th ed., Wiley | print — no URL | T3 | CITED BY EDITION ONLY | SP-14: real internal partitions ≈ 0.10–0.20 m, to contrast the host's 0.5 m wall |
| 21 | Host codebase: `src/blueprint-editor/domain/schema/rooms.ts:9-38`; `src/engine/npc/rooms.ts` | repo-local | project T1 | **READ, verified** | SP-04/SP-13/SP-14/SP-16/SP-19: 15 detectTags, `hall` priority 999, lowest-priority-wins typing, door exclusion from rooms |
| 22 | Companion research file: `architecture-skill/research/architecture-theory.md` (TH-01, TH-02) | repo-local | — | READ | Wall-tax arithmetic, octile-cost/diagonal rule, programme-table format |
Accessed: this session, single pass. Anything marked LOCATED needs a second, targeted retrieval.
---

<!-- adjacency-graphs.md: rules=24, url-lines=53 -->
## adjacency-graphs.md

Tiers: T1 official standards/guidance · T2 peer-reviewed & university · T3 established
publications/textbooks · T4 professional community · T5 anecdote.
Standards and official guidance (T1)
- NHS England / Department of Health, *Health Building Note 00-09: Infection control in the built environment* (2012) — https://www.england.nhs.uk/wp-content/uploads/2021/05/HBN_00-09_infection_control.pdf (source of the clean/dirty separation and supervised hand-hygiene-point quotations used in AG-02, AG-11, AG-15, AG-24)
- IBC Section 1005 *Means of Egress Sizing* — https://up.codes/s/means-of-egress-sizing (used only as the code input to AG-12; sizing rules live in `building-codes.md`)
Peer-reviewed and university sources (T2)
- Buchsbaum, Gansner, Procopiuc, Venkatasubramanian, "Rectangular Layouts and Contact Graphs", *ACM Trans. Algorithms* 4(1) 2008 — OA text https://arxiv.org/pdf/cs/0611107 (rectangular layout/dual characterisations, Theorems 3.3–3.6, NP-hardness of area minimisation, Ungar's plane-map conditions, Stockmeyer's equivalence, and the reference list carrying Steadman 1976 and West 1996)
- Koźmiński & Kinnen, "Rectangular duals of planar graphs", *Networks* 15 (1985) — https://doi.org/10.1002/net.3230150202 (abstract: "no 4 [rectangles] meet at a single point … dual graph … is a 4-connected triangulated plane graph")
- Kumar & Shekhawat, "A Theory of Rectangularly Dualizable Graphs" (2021) — https://arxiv.org/abs/2102.05304 (definitions of rectangular graphs/dualizability; documents a counter-example to the 1985 separable-graph conditions)
- Bhasker & Sahni, "A linear algorithm to find a rectangular dual of a planar triangulated graph", *Algorithmica* (1988) — https://doi.org/10.1007/bf01762117; He, "On Finding the Rectangular Duals of Planar Triangular Graphs", *SIAM J. Comput.* 22 (1993) — https://doi.org/10.1137/0222072 (algorithmic status of dual-finding; not read this pass, cited by record)
- Bekos, van Dijk, Fink, Kindermann, Kobourov, Pupyrev, Spoerhase, Wolff, "Improved Approximation Algorithms for Box Contact Representations", ESA'14 / arXiv:1403.4861v2 — https://arxiv.org/html/1403.4861v2 (rectangle contact = planar + facial triangles; Max-Crown NP-hard; planar bipartite bound `2n − 4`)
- Cai, Hui, *Making "Invisible Architecture" Visible: A Comparative Study of Nursing Unit Typologies in the United States and China*, PhD dissertation, Georgia Tech, 2012 — https://repository.gatech.edu/server/api/core/bitstreams/c6115891-5cb0-475f-b391-3e685214cad2/content (single-corridor / racetrack / courtyard / cruciform-cluster typologies and their trade-offs; cites James & Tatton-Brown 1986)
- Lobos & Donath, "The problem of space layout in architecture: A survey and reflections", *Arquitetura Revista* 6(2):136–161, 2010 — https://revistas.unisinos.br/index.php/arquitetura/article/download/4554/1785 (problem statement; technique taxonomy incl. zoning/clustering and bubble-diagram simulation; criterion list; "the use of graphs is seldom seen")
- Das, Day, Hauck, Haymaker, Davis, "Space Plan Generator: Rapid Generation & Evaluation of Floor Plan Design Options to Inform Decision Making", ACADIA 2016 — http://papers.cumincad.org/data/works/att/acadia16_106.pdf (cell grid + neighbour matrix + weights, Dijkstra/A\* for doors and circulation, scoring metrics; and the reference list carrying Eastman 1970, Nassar 2010, Boon et al. 2015)
- Nauata, Chang, Cheng, Mori, Furukawa, "House-GAN: Relational Generative Adversarial Networks for Graph-constrained House Layout Generation", ECCV 2020 — https://arxiv.org/pdf/2003.06988 (graph constraint → layout; "compatibility with the input graph constraint" metric; adjacency-≠-doors limitation)
- "Graph2Plan: Learning Floorplan Generation from Layout Graphs", Ruizhen Hu, Zeyu Huang, Yuhan Tang, Oliver van Kaick, Hao Zhang, Hui Huang — *ACM Transactions on Graphics*, 2020 (journal reference as stated on the arXiv abs page; related DOI https://doi.org/10.1145/3386569.3392391), preprint https://arxiv.org/abs/2004.13204 (layout graph + boundary → floorplan); body read via https://arxiv.org/html/2004.13204 (loss decomposition: pixel-wise / regression-graph / geometric coverage-interior-mutex-match, no adjacency-vs-geometry weight; ablation IoU 0.66 → 0.43 — AG-08). Correction note: this entry earlier carried the venue "ICCV 2021" and a mismatched author list — the arXiv listing was checked directly on the second pass and the TOG 2020 record above is the verified one; do not quote "ICCV 2021".
- Hu, Wu, Wang, Xu & Zheng, "Advancing Architectural Floorplan Design with Geometry-enhanced Graph Diffusion" (GSDiff), arXiv:2408.16258v1, 2024 — https://arxiv.org/html/2408.16258v1 (read directly; relationship/adjacency carried by a separate edge-prediction loss, geometry by reconstruction + time-weighted alignment loss — AG-08's "publish the residual per term"). Title checked against the arXiv listing (submitted 29 Aug 2024, this version); later versions of the same paper carry the title "GSDiff: Synthesizing Vector Floorplans via Geometry-enhanced Structural Graph Generation", so quote title and version together.
- Rule-based adjacency-graph → dimensioned-floorplan lineage — records read from GSDiff v1's reference list (bibliographically secondary; the papers themselves were not read this pass), cited in AG-08 as evidence that the matrix→geometry translation is treated as constrained optimisation with adjacency and geometry as distinct concerns: Shekhawat, Upasani, Bisht & Jain, "A tool for computer-generated dimensioned floorplans based on given adjacencies", *Automation in Construction* 127:103718 (2021); Bisht, Shekhawat, Upasani, Jain, Tiwaskar & Hebbar, "Transforming an adjacency graph into dimensioned floorplan layouts", *Computer Graphics Forum* 41:5–22 (2022); Sun, Wu, Liu, Min, Zhang & Zheng, "WallPlan: synthesizing floorplans by learning to generate wall graphs", *ACM TOG* 41(4):1–14 (2022) — the last one is the generative version of AG-01's wall/room separation.
- Volchenkov & Blanchard, "Scaling and Universality in City Space Syntax" — https://arxiv.org/html/0709.4375v1 (space-syntax formulae and the `twins nodes` definition)
- Tian, Bashan, Shi, Liu, "Articulation points in complex networks", *Nature Communications* 8:14223 (2017) — https://doi.org/10.1038/ncomms14223
- Freeman, "A Set of Measures of Centrality Based on Betweenness", *Sociometry* 40 (1977) — https://doi.org/10.2307/3033543; Freeman, "Centrality in social networks: conceptual clarification", *Social Networks* (1978/79) — https://doi.org/10.1016/0378-8733(78)90021-7; Brandes, "A faster algorithm for betweenness centrality", *J. Mathematical Sociology* (2001) — https://doi.org/10.1080/0022250x.2001.9990249
- Kernighan & Lin, "An Efficient Heuristic Procedure for Partitioning Graphs", *Bell System Technical Journal* (1970) — https://doi.org/10.1002/j.1538-7305.1970.tb01770.x; Newman & Girvan, "Finding and evaluating community structure in networks", *Phys. Rev. E* 69:026113 (2004) — https://doi.org/10.1103/physreve.69.026113
- Junker, "QUICKXPLAIN: Preferred Explanations and Relaxations for Over-Constrained Problems", ECAI 2004 (record title) — with O'Sullivan, Papadopoulos, Faltings, "Representative explanations for over-constrained problems" — http://infoscience.epfl.ch/record/115284; Rodler, "A formal proof and simple explanation of the QuickXplain algorithm", *Artificial Intelligence Review* (2022); Petit & Régin, "Specific Filtering Algorithms for Over-Constrained Problems", CP 2001, LNCS — https://doi.org/10.1007/3-540-45578-7_31; Vidal-Silva, Felfernig et al., *J. Intelligent Information Systems* (2021) — https://doi.org/10.1007/s10844-021-00675-4
- Williamson, "Depth-First Search and Kuratowski Subgraphs", *J. ACM* (1984) — https://dl.acm.org/doi/pdf/10.1145/1634.322451
- Galle, "An algorithm for exhaustive generation of building floor plans", *Comm. ACM* (1981) — https://doi.org/10.1145/358800.358804 (title-level; enumeration of a restricted floor-plan class)
- Eastman, "Automated Space Planning", *Comm. ACM* 13(4):242–250 (1970) and "Automated space planning", *Artificial Intelligence* (1973) — https://doi.org/10.1016/0004-3702(73)90008-8 (rule-driven placement of design units to satisfy a set of relationships — description via Das et al. and OpenAlex record)
- Gwynne, Galea, Lawrence, Deklerk, "Questioning the linear relationship between doorway width and evacuation speed", *Fire Safety Journal* 44 (2009) 80–87 — https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=861412
- Pérez-Gosende, Mula, Díaz-Madroñero, "Facility layout planning. An extended literature review", *Int. J. Production Research* (2021) — https://doi.org/10.1080/00207543.2021.1897176 (title-level; lineage of flow×distance layout objectives)
- Diestel, *Graph Theory*, free edition — https://diestel-graph-theory.com/ (planarity, Kuratowski, Menger, cut vertices/blocks); West, *Introduction to Graph Theory*, 2nd ed., Prentice-Hall 1996 (verified via Buchsbaum et al. ref. [51]); Wilson, *An Introduction to Graph Theory*, Longman 1996 p.162 (planar-graph definition, via the Space Syntax glossary); Cormen et al., *Introduction to Algorithms*, 3rd ed., MIT Press (max-flow/min-cut, DFS) — title-level
- Jia, Nourian, Luscuere, Wagenaar, "Spatial decision support systems for hospital layout design: A review", *J. Building Engineering* (2023) — https://doi.org/10.1016/j.jobe.2023.106042 (record verified; body text not retrieved — no claim rests on it)
- Jamali, Leung, Verderber, "A review of computerized hospital layout modelling techniques and their ethical implications", *Frontiers of Architectural Research* (2020) — https://doi.org/10.1016/j.foar.2020.01.003 (record verified; body text not retrieved — no claim rests on it)
Established publications and textbooks (T3)
- Richard Muther, *Systematic Layout Planning*, 4th ed. — https://richardmuther.com/wp-content/uploads/2016/07/Systematic-Layout-Planning-SLP-4th-edition-soft-copy.pdf (title/existence verified; 41 MB PDF not machine-readable this pass, so the A/E/I/O/U/X lettering is taken from the T4 source below)
- Bill Hillier & Julienne Hanson, *The Social Logic of Space*, Polity 1984 — connectivity p.103, depth/mean depth/RA pp.108–109, RRA/D-value pp.111–113, ringness p.102, stringiness p.91, justified map p.106, y-map/convex adjacency graph p.100, area/perimeter ratio p.17 (page numbers as given in the Space Syntax glossary entries, which is how they are cited here)
- Bill Hillier, *Space is the Machine*, Cambridge UP 1996 — graph isomorphism p.88, strategic value p.123, movement economy pp.125–127, centrality paradox p.266 (same citation route)
- Hillier, Penn, Hanson, Grajewski, Wu, "Natural Movement: or, Configuration and Attraction in Urban Pedestrian Movement", *Environment and Planning B* 20 (1993) 29–66, p.32 (via glossary)
- Steadman, "Graph-theoretic representation of architectural arrangement", in March (ed.), *The Architecture of Form*, Cambridge UP 1976, pp. 94–115 (via Buchsbaum et al. ref. [42]); Steadman, *Architectural Morphology* (normalisation formula, via glossary "i-value")
- Space Syntax Online Training Platform glossary — https://www.spacesyntax.online/glossary/ (definitions and their page references; T3 because it is the method owner's own training material)
- Neufert, *Architects' Data*, 3rd English ed., Wiley 2012 — https://ia600801.us.archive.org/21/items/NeufertS/Neufert-S.pdf (room-level relationship requirements; no number taken)
- Boon, Griffin, Papaefthimious, Ross, Storey, "Optimizing Spatial Adjacencies using Evolutionary Parametric Tools", *Perkins + Will Research Journal* 7(2):25–37, 2015 (via Das et al.'s reference list)
- Nassar, "New Advances in the Automated Architectural Space Plan Layout Problem", ICCBE 2010 (via Das et al.'s reference list: space plans as "simple, connected, labeled planar graphs" and rectangle-dual relevance)
- James & Tatton-Brown, *Hospital Planning*, 1986 (secondary, via Cai 2012's figures)
Professional-community sources (T4 — method and labelled heuristics only)
- Resource Systems Consulting, *Simplified Systematic Layout Planning* — https://www.resourcesystemsconsulting.com/2006-10-22/simplified-systematic-layout-planning/ (source of the letter wordings and the 16/8/4/1/0/−80 weighting)
- Georgia Tech ISY course page, *Systematic Layout Planning or SLP* — https://www2.isye.gatech.edu/~mgoetsch/cali/Spiral/Spiral%20HTML%20Help/SystematicLayoutPlanningorSLP.htm (relationship chart = "level of interaction between pairs of departments"; the "not a final layout" caveat)
- Gustin Design Services, *Programming Matrix* — https://gdsatx.com/2018-09-27/programming-matrix/ (via TH-03)
- Hotel Development Guide, *Hotel Structural Design and Column Grid Planning* — https://hoteldevelopmentguide.com/hotel-structural-design/ (grid span ~7.0–8.5 m, "two guestrooms fit neatly between columns", inefficiency multiplied "repeated across multiple storeys"; T4 — used as precedent for the stack-alignment cost argument only)
- Dominguez et al., "Evacuation routes in a multi-story building", *Proc. 13th Space Syntax Symposium* — https://www.hvl.no/siteassets/hvl-internett/arrangement/2022/13sss/426dominguez.pdf (multi-storey graph with stair/lift links, justified graphs + VGA applied to a building)

<!-- operations-maintenance.md: rules=28, url-lines=44 -->
## operations-maintenance.md

T1 — official, regulatory, operator-issued standards
1. UK **Approved Document H, Requirement H6 — solid waste storage** (consultation draft, Sept 2014), gov.uk: https://assets.publishing.service.gov.uk/media/5a7e24d9e5274a2e87dafd5b/140910_HSR_Supporting_Doc5_H6_Waste.pdf — waste store capacity, siting, distances, chute diameter, container clearance, wash-down.
2. **NHS Health Building Note 04-01 — Adult in-patient facilities** (NHS England): https://www.england.nhs.uk/wp-content/uploads/2009/12/HBN_04-01_Final.pdf — §4.7–4.16 clusters; §4.39–4.42 cleaning system rooms; §4.64–4.69 supplies and dirty utility; §5.29–5.41 bays, stores, reception; schedules of accommodation (all unit areas and allowances).
3. **NHS Health Building Note 00-09 — Infection control in the built environment**: https://www.england.nhs.uk/wp-content/uploads/2021/05/HBN_00-09_infection_control.pdf — §3.61–3.75 ancillary areas and sinks; §3.110–3.116 finishes/carpets; §3.149–3.166 healthcare waste; Appendix 3 construction/IPC (debris by chutes).
4. **GOV.UK, Healthcare waste: appropriate measures for permitted facilities — managing healthcare wastes**: https://www.gov.uk/guidance/healthcare-waste-appropriate-measures-for-permitted-facilities/managing-healthcare-wastes — segregation at source, bag/colour classes, 770 L bulk carts, incineration temperature.
5. **Secured by Design Commercial Guide 2023** (police scheme; PDF hosted by Epping Forest DC): https://www.eppingforestdc.gov.uk/app/uploads/2025/07/SBD-COMMERCIAL_GUIDE_2023_v4.pdf — §24 door recesses, §33 access covers, §34 internal lighting, §35 CCTV, §45–48 entrances/reception/access control, §51–52 secure doorsets and lift vandal resistance (BS EN 81-71), §92–96 storage, waste, cleaning-equipment store, utility services.
6. **29 CFR §1910.141 — Sanitation** (US OSHA; Cornell LII mirror): https://www.law.cornell.edu/cfr/text/29/1910.141 — change rooms and Table J-1 toilet counts. Also OSHA restrooms/washing facilities overview: http://www.osha.gov/restrooms-sanitation
7. **HSE (UK), Construction welfare: changing, eating and rest areas**: https://www.hse.gov.uk/construction/healthrisks/welfare/changing-rooms-and-lockers.htm — changing areas, separate provision, lockers, seats for all at once.
8. **Florida Building Code (Building) 2014, §450.3.9.1 Housekeeping rooms / janitor's closets**, via UpCodes: https://up.codes/s/housekeeping-rooms-janitor-s-closets — at least one per floor with a service sink.
9. **City of Toronto Retail Design Manual (2019)**: https://www.toronto.ca/legdocs/mmis/2020/ph/bgrd/backgroundfile-157291.pdf — §1 servicing from rear lanes, §2.2 back-of-house wall space, §3.3 shipping/receiving/loading, §3.4 column grid.
10. **McGill University Facilities, Building Design Standards — Custodial Areas (Mar 2023)**: https://www.mcgill.ca/buildings/sites/buildings/files/custodial_areas.pdf — closet ratio and dimensions, mop sink, drain, shelving, garbage rooms, chute fire ratings.
11. **Oxford University Estates, Building Services Design Guide v1.1 (published March 2026)**: https://assets-oxweb.admin.ox.ac.uk/2026-04/Building-Services-Design-Guide.pdf — A1.4 isolation zoning, A2.7 fan coils, A3.6 tanks, B6 switchboard clearances, C1.10 goods lifts, Appendix E metering (incl. CIBSE Guide TM39 / Part L2 reference), Appendix G maintenance access, plant rooms, risers, roof access.
12. **Maryland Stadium Authority, Cleaning Specifications (Attachment A, 2020)**: https://mdstad.com/sites/default/files/2020-08/Attachment%20A.Cleaning%20Specifications.FINAL_.pdf — cleaning quality standards, frequencies, trash/recycling streams, staging and storage obligations, badge control.
T2 — peer-reviewed
13. Aguilar-Escobar, Garrido-Vega, Majado-Márquez & Camuñez-Ruiz (2021), "Hotel Room Cleaning: Time Study and Analysis of Influential Variables in a Spanish Hotel", *JIEM* 14(3):645–660: https://www.jiem.org/index.php/jiem/article/download/3441/983
14. Chang & Cho (2022), "Nurses' steps, distance traveled, and perceived physical demands…", *Human Resources for Health*, 117 nurses / 351 shifts: https://pmc.ncbi.nlm.nih.gov/articles/PMC9548108/
15. (Search-indexed, not retrieved — listed for completeness, not cited in rules) "A framework for designing backroom areas in grocery stores", *IJRDM* 45(3):230: https://www.emerald.com/ijrdm/article/45/3/230/151754/ — 403 at retrieval.
T3 — professional/operator publications and consultancy
16. Nova Technology International, *Dock Planning Standards* (2013): https://www.novalocks.com/wp-content/uploads/Dock-Planning-Standards-Guide.pdf
17. Link Logistics, "What Is a Loading Dock? Types, Features & How to Evaluate": https://www.linklogistics.com/news-insights/industrial-real-estate-101/what-is-a-loading-dock-a-guide-to-types-configurations-and-key-features/
18. R. D. Peters (Peters Research Ltd.), "The Application of Simulation to Traffic Design and Dispatcher Testing", 3rd Symposium on Lift and Escalator Technologies: https://peters-research.com/index.php/papers/the-application-of-simulation-to-traffic-design-and-dispatcher-testing/
19. BASE4, "Select the right elevator for your next hotel": https://www.base-4.com/select-the-right-elevator-2/
20. WATG, "Back of house design: how architecture shapes luxury service": https://www.watg.com/back-of-house-design-how-architecture-shapes-luxury-service/ (used only as extension of PP-02/05/06)
21. Quality Shielding, "MRI Room Construction Guide": https://www.qualityshielding.com/knowledge-base/mri-room-construction-guide
22. Toyota Material Handling Europe, "Aisle width guide" (Asta formula, 200 mm clearance): https://toyota-forklifts.eu/guides/aisle-width-guide/
23. AWE Forklifts, "Warehouse Aisle Widths & Racking — Truck Guide": https://awe.ie/blog/warehouse-racking-and-aisle-widths
24. PHS, "What is the Health Technical Memorandum 07-01…": https://www.phs.co.uk/resources/what-is-the-health-technical-memorandum-07-01/
T4 — vendor/trade material (used for product dimensions only, marked as such)
25. Mitsubishi Elevator, *Hospital Bed Elevators* catalogue: https://www.melsa.com.sa/front_assets/download/elevators-cat/Nexies-MR/hospital.pdf
26. chutes.com, "Linen & Laundry Chutes for Multi-Story Commercial Buildings": https://chutes.com/products/internal-chutes/linen-chutes/
27. Mercura, "How to choose the right housekeeping cart for your hotel" (cart weight only): https://mercurausa.com/2020-10-12/how-to-choose-the-right-housekeeping-cart-for-your-hotel/
28. Loading Dock Supply, "Loading Dock Design Guide": https://loadingdocksupply.com/loading_dock_design (used only where Nova figures were corroborated)

<!-- lifecycle.md: rules=24, url-lines=54 -->
## lifecycle.md

Tiers: T1 codes/standards/government & statutory guidance · T2 peer-reviewed · T3 established professional publications · T4 professional/community · T5 anecdote. Where a T1 text was read only through a reproduction, that is said in the entry.
Standards, codes, statute and government guidance (T1)
- International Code Council / US DoD Green Construction Code 2018, §1001.3.2.3 "Service Life Plan" — https://up.codes/s/service-life-plan (fields: assembly description; materials/products; design or estimated service life in years; maintenance frequency; maintenance access; scope: structural, envelope, hardscape).
- BS EN 1990 *Eurocode: Basis of structural design*, design working life categories — read through Concrete Society, *Design working life* https://www.concrete.org.uk/fingertips/design-working-life/ (10 / 10–25 replaceable parts / 15–30 / 50 / 100 years; UK NA modifies categories 2, 3, 5).
- HM Treasury, *The Green Book: appraisal and evaluation in central government* (2026) — https://www.gov.uk/government/publications/the-green-book-appraisal-and-evaluation-in-central-government/the-green-book-2026 (communicate sources of uncertainty; explicit optimism-bias adjustment; sensitivity analysis of key assumptions).
- England, GPDO 2015 (SI 2015/596) Schedule 2, Part 3, Class MA (residential conversion, inserted by SI 2021/428) — https://www.legislation.gov.uk/uksi/2015/596/schedule/2/part/3 (prior approval on "adequate natural light in all habitable rooms"; two-year qualifying use; not listed).
- Greater London Authority, *The London Plan* (2021), Policy SI 7 "Reducing waste and supporting the circular economy" — https://www.planningpolicy.co.uk/policy/london-plan/si-7 (reproduced policy text: Circular Economy Statement incl. material re-use and disassembly for future use; 95% reuse/recycling/recovery; zero biodegradable or recyclable waste to landfill by 2026).
- European Commission, *Waste Framework Directive* (2008/98/EC) — https://environment.ec.europa.eu/topics/waste-and-recycling/waste-framework-directive_en (landing page confirms the Directive establishes the waste hierarchy and related concepts; article text was not machine-readable this pass, so the hierarchy order is stated as standard knowledge, not as a quotation).
- Historic Environment Scotland, *Managing Change in the Historic Environment: Use and Adaptation of Listed Buildings* (Feb 2020) — https://www.historicenvironment.scot/publications/all/publication/?publicationId=8ab1f9c9-521a-435e-a3f2-aa240119b5e1 ("support, promote and enable the continued use, reuse and adaptation").
- BS EN 15978 *Sustainability of construction works — assessment of environmental performance of buildings* — module structure A1–A3 / A4–A5 / B1–B7 / C1–C4 / D and the 50-year reference study period, read through https://docs.realtimelca.com/methodology-and-compliance/en-15978 (T3 reproduction, states CEN as publisher).
- Approved Document H drainage falls, read through Rospower quick reference — https://rospower.co.uk/resources/drainage-gradients/ (T4 quoting T1: 100 mm WC branch 1:80 min / 1:40 recommended; 150 mm 1:150 min; 75 mm not permitted for WC).
- ISO 55001 asset management (SAMP / AMP, "line of sight") — read through https://www.glocertinternational.com/resources/guides/asset-management-policy-samp-and-asset-management-plans-iso-55001/ (T4 guide to a T1 standard).
- ISO 15686 series (service life planning; Part 8 "Reference service life and service-life estimation") — https://en.wikipedia.org/wiki/ISO_15686 (T3/T4; clause text paywalled, so no numeric reference service life is taken from it).
- Federal Reserve Bank of New York — Ellen, I.G. & Kazis, N.M. (2023), *Flexibility and Conversions in New York City's Housing Stock* — https://fedinprint.org/item/fednep/97155 (modelled conversion scenarios; ~75,000 homes from converting about 10% of eligible stock; regulatory barriers).
Peer-reviewed (T2)
- Huuhka, S., Moisio, M., Salmio, E., Köliö, H. & Lahdensivu, H. (2023), "Renovate or replace? Consequential replacement LCA framework…", *Buildings & Cities* 4, DOI 10.5334/bc.309 — https://journal-buildingscities.org/articles/10.5334/bc.309 (renovation generally lower impact; replacement case only clears at a payback of "circa 10 years"; "decades-long payback times … are not helpful"; frame the choice "neutrally" at planning).
- Vorobjev, O., Uotila, U., Joensuu, T. & Saari, A. (2026), "Design for disassembly: a review of public policy proposals", *Buildings & Cities* 7(1), DOI 10.5334/bc.722 — https://journal-buildingscities.org/articles/10.5334/bc.722 (51 results screened to 21 papers; seven instrument families; "A limited empirical basis for many proposed measures…"; "major barriers still limit its uptake, including inadequate legislation, a paucity of financial incentives"; Italian 50% reusable-component rule and California 70% C&D recycling statute; no effectiveness ranking).
- Shahi et al. (2020), "A definition framework for building adaptation projects", *Sustainable Cities and Society* — https://pmc.ncbi.nlm.nih.gov/articles/PMC7326450/ (refurbishment/retrofit/renovation/rehabilitation/adaptive reuse/conversion definitions; adaptive reuse distinguished "by a change in a building's function or use"; clarity avoids cost from confused specifications).
- Liao, J., Ren, S. & Li, V. (2023), "Existing Building Renovation: A Review of Barriers to Economic and Environmental Sustainability" — https://pmc.ncbi.nlm.nih.gov/articles/PMC10001863/ (1,402 Web-of-Science papers; financial, regulatory, technical/organisational barriers; risk aversion and litigation culture; occupant-behaviour uncertainty).
- Systematic review of life-cycle cost estimation for upgrading existing buildings (47 Scopus papers, 2009–2024) — https://pmc.ncbi.nlm.nih.gov/articles/PMC12425850/ (operation stage highest cost, via Huang 2018; paybacks > 20 years, via González 2021; salvage value often omitted).
- Jankovic, L. & Christophers, J. (2022), "Cumulative Embodied and Operational Emissions of Retrofit…", *Frontiers in Built Environment* 8 — https://www.frontiersin.org/journals/built-environment/articles/10.3389/fbuil.2022.826265/full (title/metadata and method verified; body text was not machine-readable this pass, so no figure is taken from it).
- Haasnoot, M. et al., dynamic adaptive policy pathways — record at https://research.utwente.nl/en/publications/dynamic-adaptive-policy-pathways-a-new-method-for-crafting-robust/ ; practitioner description https://www.deltares.nl/en/expertise/areas-of-expertise/sea-level-rise/dynamic-adaptive-policy-pathways (method used only at the level of "stage commitments, pre-agree triggers").
Professional publications and established practice sources (T3)
- Steel Construction Info (Tata Steel-hosted industry information), *Steel Construction for Multi-Storey Office Buildings* — https://steelconstruction.info/sectors/multi-storey-office-buildings/ (floor plate ~13.5 m for natural ventilation; grids 6×9 m and 7.5×12 m; "all internal walls to be relocated"; flexibility to "maximise the economic life of the building"; occupation density 1 person per 10–15 m²).
- Chapman Taylor, *Repurposing the department store* (20 Jan 2021) — https://www.chapmantaylor.com/insights/repurposing-the-department-store (≥2.7 m free height; problems above 7 m single-aspect / 14 m double-aspect; residential modules 2–2.5 m to 4–4.5 m; back-of-house up to 20%; slab removal or demolition sometimes unavoidable).
- isurv / BSRIA, *Soft landings framework: the principles* (2018) — https://www.isurv.com/info/390/features_archive/11897/soft_landings_framework_the_principles (six phases, inception → extended aftercare and POE beyond 12 months; BS 8536).
- Lifschutz Davidson Sandilands, *Long life, Loose fit* (2020) — https://lds-uk.com/idea/long-life-loose-fit/ (phrase coined by Alex Gordon, 1972; flexible grids, generous heights, accessible services, no fixed walls).
- LMN Architects, *10 – Existing Building Reuse* (2023) — https://lmnarchitects.com/lmn-research/10-existing-building-reuse (structure holds most embodied carbon; reuse generally lower total carbon; 86% of US commercial stock under 25,000 sf; underlying datasets AIA/EPIC/CARE/EC3/2030).
- UNEP Global Alliance for Buildings and Construction, "Avoid-Shift-Improve" (building materials and climate) — https://globalabc.org/buildingmaterialsandclimate/chapte-2-life-cycle-thinking/2-6-strategies-towards-a-building-materials-revolution-avoid-shift-improve.html (avoid = don't build new / reuse).
- Anstey Horne, *Daylight and Sunlight BRE Guidelines* — https://www.ansteyhorne.co.uk/news/daylight-and-sunlight-bre-guidelines (secondary account of BRE BR 209, 3rd ed. 2022; non-statutory; VSC ≥27%, APSH tests).
- CCC Engineering, *Coordination of services in ceiling voids* — https://cccengineering.com.au/design-memos/services-coordination-ceiling-voids/ (void stack-up economics; late floor-to-floor changes hit every level; already used in PP-18/PP-23).
- Structville, *Live loads (imposed loads) on floors* — https://structville.com/live-loads-imposed-loads-on-floors (T4 reproduction of EN 1991-1-1 Table 6.1 category values; see Weak or contested for the office-value discrepancy).
- Tonn & Blank Construction, *Long-term construction strategies for expanding higher education campuses* (2025) — https://www.tonnandblank.com/long-term-construction-strategies-for-expanding-higher-education-campuses/ (T4; master plan enables phasing with a fixed end goal; multi-use spaces prioritised early).
- Stewart Brand, *How Buildings Learn: What Happens After They're Built*, Viking 1994 — layer names and the adaptation argument verified again via https://en.wikipedia.org/wiki/How_Buildings_Learn (the per-layer year ranges remain unverified; see below).
---

<!-- economics.md: rules=22, url-lines=45 -->
## economics.md

**T1 — official / standards / government measurement and cost data**
- BOMA International, standards catalogue (ANSI/BOMA Z65.1 family — office, industrial, retail, mixed-use and gross-area methods; editions 2010→2026) — https://boma.org/boma-standards/ (page lists standards; it does not itself define the boundaries — definitions below come via T3 reproductions)
- RICS, *Cost analysis and benchmarking*, 2nd ed. — element breakdowns, GIA normalisation, whole-life requirement, caution on cross-project comparison — https://www.rics.org/content/dam/ricsglobal/documents/standards/Cost-analysis-and-benchmarking_2nd-edition.pdf
- RICS, *Whole life cost in real estate: sustainability by design* (part two), 2024 — https://www.rics.org/news-insights/wbef/whole-life-cost-in-real-estate-sustainability-by-design-part-two
- US EIA, 2018 Commercial Buildings Energy Consumption Survey, *health care* (144.5 MBtu/ft²; 4 % of floorspace; inpatient highest heating 62.6 and ventilation intensities) — https://www.eia.gov/consumption/commercial/pba/health-care.php
- US EIA, 2018 CBECS, *office buildings* (65.6 MBtu/ft²; 17 % of floorspace) — https://www.eia.gov/consumption/commercial/pba/office.php
- GSA, *Occupancy and utilization reporting guidelines* (150 USF per person design standard) — https://www.gsa.gov/real-estate/use-it-act-and-occupancy-data/reporting-guidelines
- (Attempted, not readable as text: IPMSc *International Property Measurement Standards — Residential Buildings* PDF; RICS *Property Measurement* 2nd ed. page; WBDG "Utilize Cost and Value Engineering" — see `## Weak or contested`.)
**T2 — peer-reviewed**
- *Space Efficiency in Tapered Super-Tall Towers*, Buildings 13(11):2819 (2023), 40 towers: efficiency mean 72 % (55–84 %), core-to-GFA 26 % (11–38 %), function/structure not significant — https://cris.tuni.fi/ws/portalfiles/portal/103056634/buildings-13-02819-1.pdf
- *A comparative analysis of space efficiency in skyscrapers: case studies from the Middle East, Asia and North America*, Buildings 14(11):3345 (2024): Asia 68 % efficiency / 30 % core; Middle East and North America 76 % / 21–25 % core; inverse correlation height↔efficiency — https://cris.tuni.fi/ws/portalfiles/portal/147341324/A_comparative_analysis_of_space_efficiency_in_skyscrapers_Case_studies_from_the_Middle_East_Asia_and_North_America.pdf
- *The value of daylight in office spaces* — hedonic study, 5,145 Manhattan offices, 5–6 % premium associated with daylight (via MIT Real Estate Innovation Lab summary, 2019) — https://realestateinnovationlab.mit.edu/research_article/the-value-of-daylight-in-office-spaces/
**T3 — professional publications, surveys, industry bodies**
- BOMA, *Answers to 26 Questions About the Standard Method of Measuring Office Building Areas* (reproduction hosted by UBC Sauder Real Estate Division) — **the hosted page is a 1998 Q&A reproduction of ANSI/BOMA Z65.1-1996**; every definition this file takes from it is that edition's, and the current office standard is the Z65.1-2017/2025 family — https://professional.sauder.ubc.ca/re_creditprogram/course_resources/courses/content/451/boma.cfm
- NAI Keystone, *Standard for Measuring Floor Areas of an Office Building* (core/load factor 10–18 %) — https://naikeystone.com/standard-for-measuring-floor-areas-of-an-office-building/
- Steel Construction Institute / Tata Steel, *Cost comparison study for multi-storey office building frames* (Central London, Q3 2016 prices; frame and total costs per m²; floor-to-floor effect on envelope) — https://steelconstruction.info/topics/cost-of-structural-steelwork/cost-comparison-study/
- HVS, *U.S. Hotel Development Cost Survey 2025* (2024 costs; median per-room costs by segment) — https://www.hvs.com/article/10219-HVS-US-Hotel-Development-Cost-Survey-2025
- CQIC, *How much does error cost?* (GIRI estimate: 10–25 % of project cost, Jan 2023) — https://cqic.org.uk/insights/how-much-does-error-cost/
- Advanced Buildings *Daylighting Pattern Guide*, Pattern 1: Floor Plate Geometry (8 m / 24 ft workstation-to-window rule; Aon 92 ft case) — https://patternguide.advancedbuildings.net/pattern-slideshow/Pattern%201_%20Floor%20Plate%20Geometry.html
- Neumann Monson Architects, *Design Thinking: Floor Plates and Office Adaptive Reuse* (2023; ~60 ft plates suit residential reuse) — https://neumannmonson.com/blog/design-thinking-plates-office-adaptive-reuse
- STUDIO mtx, *Space Productivity & Sales per Square Foot* (sales-per-area definition; space-to-sales principle; productivity must not reclaim code space) — https://www.studiomatrx.org/students/retail-and-store-design/space-productivity
- Facilities Dive, *OMB sets federal office space utilization standards* (150 sq ft/person; 60 % occupancy threshold) — https://www.facilitiesdive.com/news/omb-sets-federal-office-space-utilization-standards-minimum-occupancy-thre/728428/
- Turner Construction, *Cost Index* (index scope: labour, materials, market conditions) — https://www.turnerconstruction.com/cost-index
- Designing Buildings Wiki, *Building design and construction fees* and *Value engineering* (architect's fees 4–9 % of UK construction cost; "value engineering should start at project inception where the benefits can be greatest") — https://www.designingbuildings.co.uk/wiki/Building%20design%20and%20construction%20fees , https://www.designingbuildings.co.uk/wiki/Value_engineering
**T3/T4 boundary, T4 — practice/vendor/community (used only for direction, never as prices)**
- GreenSpec (UK), *The Heat Loss Form Factor* (HEFF; 0.56 vs 0.72 → ~28 % heat loss; home-form factor compact 1.0 vs form-rich 4.1; Passivhaus ≤ 3) — http://www.greenspec.co.uk/building-design/heat-loss-form-factor/
- Black Ac Surveyors, *RICS Code of Measuring Practice: GIA, NIA, GEA and IPMS* (IDF rule at 2.75 m; IPMS 3.2 includes columns/internal structural walls; "typically 2–5 % larger than NIA") — https://blackacresurveyors.com/blog/why-international-property-measurement-standards-ipms/
- Vantage Space glossary, *Net-to-Gross Ratio* (60–80 %) and *Floor Plate Efficiency* (office 65–80 %; <60 % planning problem; >80 % limits circulation) — https://www.vantagespace.com/gb/glossary/space-planning-layout-principles/net-to-gross-ratio , https://www.vantagespace.com/sr-me/glossary/space-costing-financial-metrics/floor-plate-efficiency
- Terrapin, *Hotel Construction Cost Per Key (2026)* and *A&E Fees & Soft Costs (2026)* (US; soft costs 15–30 %, A/E 4.5–18 % by type; select-service $215–325k/key, full-service $385–625k/key, FF&E $25–48k/key) — https://terrapincg.com/news/hotel-construction-cost-per-key-2026 , https://terrapincg.com/news/architectural-engineering-fees-soft-costs-commercial-construction-2026
- Studio Anyo, *Design Principles for DFMA Hotels* (standard keys 300–400 sq ft; lobby 10–15 % of area) — https://studioanyo.com/design-principals-for-dfma-hotels/
- BFS Industries, *Concrete Formwork Pricing Per m²* ($40–200/m²; steel 150+, aluminium 200+ reuse cycles) — https://bfs-industries.com/blog/concrete-formwork-pricing/
- Retail Ops Toolkit, *Sales per Square Foot: Benchmarks* (SPSF formula; category bands — contested) — https://www.retailopstoolkit.com/blog/sales-per-square-foot
---

<!-- design-alternatives.md: rules=10, url-lines=4 -->
## design-alternatives.md

- `architecture-skill/goal-task` §18 (Domain Q), §21 (Domain T examples), §37 (multi-option design) —
  the task specification defining the required record fields and the no-winner rule.
- RIBA Plan of Work 2020, Stage 3 — https://www.ribaplanofwork.com — T3, knowledge source; the
  institutional expectation that options are produced and tested against brief priorities.
- WBDG (NIBS/NIH) — https://www.wbdg.org — T1/T3; sustainability and programming as scheme-level design
  drivers rather than late additions.
- `architecture-skill/research/validation.md` — VA-01 (oracle first), VA-10 (capability manifest),
  VA-18 (diff table) — internal corollaries used by DA-03, DA-07.
- `architecture-skill/research/professional-practice.md` — PP-23 (freeze-then-change cost) — internal,
  itself flagged as practitioner consensus rather than measurement.
- `architecture-skill/research/building-codes.md` — conservative default and flag protocol — internal.
- MCDA / AHP application in construction appraisal; morphological analysis; Lawson's designer-strategy
  studies; Rittel & Webber (1973) — T2, cited as research classes; no passage quoted, no number taken.

<!-- failure-patterns.md: rules=28, url-lines=9 -->
## failure-patterns.md

Tiers: T1 official / code-derived · T2 peer-reviewed · T3 documented case critique · T4 forums/blogs ·
T5 Reddit. Nothing here is sourced to T4/T5 without being labelled as such.
Code-derived (this repository — highest trust for grid behaviour):
- `src/engine/npc/rooms.ts:6` — `deriveFloorRooms(map, doorCells)`: 4-connected flood-fill over walkable cells, **door cells excluded from every room** (called with `floorDoorCells(floor)` at `src/engine/npc/layoutBuild.ts:369`). Feeds FL-06, FL-01, FL-05.
- `src/blueprint-editor/domain/schema/rooms.ts:4-27` — the 15-type vocabulary with `detectTags`, `privacy`, `priority` (10/20/30/40-tie/50), plus `HALL_ROOM_TYPE = { detectTags: [], priority: 999 }`: the fallback can never match, so unmatched and out-of-vocabulary rooms all become `hall`, and lower priority numbers swallow higher ones inside one tile-set. Read in code this pass. Feeds FL-07, FL-12, FL-15, FL-21.
- A\* octile movement with diagonals gated on both orthogonal neighbours open and unoccupied; `portal` objects with queues; role-tag access; no heights, no window tile state, no dimensioned furniture, no structural/services carriers. Feeds FL-27, FL-18/FL-19 (proxy-only), FL-20/FL-22 (UNKNOWN), FL-24.
- Verification status of the citations below (honest ledger): re-confirmed against primary sources this pass — ICC IBC 2021 §1020.5 (codes.iccsafe.org), 2010 ADA Standards index (ada.gov) and the Access Board clear-space guide, the 2018 England HMO instrument (legislation.gov.uk/uksi/2018/616), Seppänen/Fisk/Lei in *Indoor Air* (Wiley). Carried from standard-text knowledge and **not** re-fetched this pass, so check volume/page/DOI before quoting in a deliverable: Peponis et al. 2006 *Environment and Behavior*, Hillier 1996, Zimring & Gill 1993, NTSB AAR-82-05, Grenfell Phase 1, Hackitt, BB93, Approved Documents B/E/M, CIBSE Guides D and H, Neufert, BRE 245, Fisk/Lei/Seppänen. The HMO bullet in the T1 list names the instrument loosely: the 6.51 m² figure is the England HMO/Space-standard figure (rooms under 4.64 m² may not be used for sleeping by one person over 10); confirm the exact statutory instrument before citing it in a compliance argument.
- Companion files in this directory: architecture-theory.md (TH-xx), professional-practice.md (PP-01…PP-26), validation.md (VA-01…VA-23).
Standards and official reports (T1):
- IBC Chapter 10 (means of egress: occupant load, egress width 0.2 in/occupant, travel distance Table 1017.2, number of exits) and §1020.5 dead ends — https://codes.iccsafe.org/s/IBC2021P2/chapter-10-means-of-egress/IBC2021P2-Ch10-Sec1020.5 (also https://up.codes/s/dead-ends), publisher https://www.iccsafe.org/ — FL-03, FL-26, FL-18 (§1207 daylight).
- NFPA 101 *Life Safety Code* — https://www.nfpa.org/codes-and-standards/all-codes-and-standards/list-of-codes-and-standards/detail?code=101 — FL-03, FL-08, FL-26.
- 2010 ADA Standards for Accessible Design §§305, 306.3, 403.5, 404.2.3-4, 600, 806 — https://www.ada.gov/law-and-regs/design-standards/2010-stds/ and the Access Board clear-space/turning-space guide https://www.access-board.gov/ada/guides/chapter-3-clear-floor-or-ground-space-and-turning-space/ — FL-02, FL-23, FL-24, FL-25.
- UK Approved Document B (means of escape), Approved Document E (sound), Approved Document M (access) — https://www.gov.uk/government/collections/approved-documents — FL-14, FL-23, FL-26.
- UK Approved Document E, Resistance to the passage of sound (40 dB DnT,w + C target, pre-completion testing) — FL-14.
- Building Bulletin 93, *Acoustic design of schools* — https://www.gov.uk/government/publications/building-bulletin-93-acoustic-design-of-schools — FL-14.
- Hackitt Review, *Building a Safer Future* (2018) and Building Safety Act 2022 "golden thread" — https://www.gov.uk/government/publications/building-a-safer-future-review-of-building-regulations-and-fire-safety — FL-16.
- Grenfell Tower Inquiry, Phase 1 Report (2019) — https://www.grenfelltowerinquiry.org.uk/ — FL-16, FL-26.
- Ronan Point collapse (1968) inquiry and the resulting continuous-load-path / tie requirements in the UK Building Regulations — FL-20.
- NTSB Aircraft Accident Report AAR-82-05, *Hyatt Regency Walkway Collapse, Kansas City, June 27 1981* — https://www.ntsb.gov/ — FL-08, FL-20 (cascade lesson: one local connection change doubled the load above).
- WHO Regional Office for Europe, *Indoor Air Quality — Biological Substances: Health Risks and Management* (Sick Building Syndrome), Copenhagen 1984 — FL-18.
- WHO *Guidelines on Core Components of Infection Prevention and Control Programmes*, 2019 — FL-13.
- BRE Report 245 / *National Descriptions for daylight and sunlight assessment* (VSC 27 % for habitable rooms) — FL-19.
- UK Licensing of Houses in Multiple Occupation (Prescribed Description) (England) Order 2018 — 6.51 m² minimum lettable room — FL-05.
- CIBSE Guide D *Transition in buildings* (lift traffic) and Guide H *Building drainage services* — FL-17, FL-21.
- Whole Building Design Guide (NIBS), programming and commissioning pages — https://www.wbdg.org/ — FL-07, FL-16.
Peer-reviewed (T2):
- Hillier & Hanson, *The Social Logic of Space* (1984); Hillier, *Space is the Machine* (1996) — ringiness, intelligibility, movement prediction. FL-01, FL-04, FL-10, FL-27.
- Peponis, Zimring, Xie, Karydis et al., "Finding the building you are looking for: layout legibility and wayfinding", *Environment and Behavior*, 2006 — FL-04, FL-10, FL-27.
- Zimring & Gill, "Design quality and residential burglary", *Environment and Behavior* 25(5), 1993 — FL-03, FL-12.
- Seppänen, Fisk, Lei, "Effect of temperature on symptoms and work performance", *Indoor Air* 16(2), 2006; Fisk, Lei, Seppänen, "Effect of outdoor ventilation rate … on prevalence of SBS", *Indoor Air* 16(2), 2006 — FL-18, FL-19.
- Stewart & Roskilly, "Design life of building material and component subsystems", *Building and Environment* 41(1), 2006 — FL-09, FL-16, FL-22, FL-28.
- Banfill, "Factors affecting construction productivity", and formwork repetition cost studies — FL-28.
- Lin et al., "Psychological benefits of daylight … in occupants of buildings", *Frontiers in Public Health*, 2017 — FL-18.
- Preiser & Vischer (eds.), *Assessing Building Performance / Evaluating and Improving Workplace Productivity* — the POE method underpinning this whole file — FL-01…FL-28; and PP-25.
Standard texts (T2/T3):
- Neufert, *Architects' Data*, 3rd ed., Wiley — dimensions, clearances, corridor widths, storage ratios. FL-02, FL-05, FL-15, FL-21, FL-24.
- Ching, *Building Construction Illustrated*, 5th ed. — load path, spans. FL-20. Ching & Eckler, *Interior Graphic Standards* — furniture clearances, door swings. FL-24, FL-25.
- Kasavana & Smith, *Managing Better Hotels* (1982) — hotel BOH/F&B area and adjacency ratios. FL-15.
- Alexander et al., *A Pattern Language* (1977) — nooks need a purpose, corridor width and sight. FL-05, FL-12.
- Newman, *Defensible Space* (1972); Coleman, *Utopia on Trial* (1985); Brand, *How Buildings Learn* (1994) — FL-03, FL-12, FL-22.
- Rand, Parker & Zimring, *Problem Seeking*, 5th ed. — adjacency matrix method. FL-11.
Documented case critiques (T3) and lower tiers:
- Heschong Mahone Group, *Daylighting in Schools* (1999) — FL-18/FL-19; methodology contested (see Weak or contested).
- Vdara Tower, Las Vegas downdraft/vortex complaints (2010) and subsequent canopy remediation — FL-28: computed form without physical testing.
- Hotel housekeeping cart catchment figures (10–16 rooms per cart run) circulate in operator blogs and trade forums — T4 — used in FL-15 only as a heuristic, flagged below.
- Reddit r/architecture, r/hotelmanagement anecdote threads — T5, consulted but used for nothing; retained here only as a signal of which failures operators complain about (sound, storage, cleaning access).
---

<!-- multi-scale.md: rules=24, url-lines=38 -->
## multi-scale.md

T1 — official / published guidance (retrieved as links this pass; several blocked automated
reading, marked so, and needing clause-level verification):
1. ICC, *2018 IBC Chapter 10 — Means of Egress* — https://codes.iccsafe.org/content/IBC2018P4/chapter-10-means-of-egress — **UNVERIFIED**: fetch returned 403 in the audit pass and again this remediation; provisions cited by chapter only, no clause number or dimension confirmed. Used for MS-08, MS-09, MS-21 (each now labelled "clause unverified").
2. NIST (Bukowski), *The basis for egress provisions in U.S. building codes* (PDF) — https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=861281 — **UNVERIFIED**: found via search, PDF not opened. Used for MS-08, MS-21.
3. NFPA, *Unraveling the Area of Refuge Requirements* (2023-03-13) — https://www.nfpa.org/news-blogs-and-articles/Blogs/2023-03-13/Unraveling-the-Area-of-Refuge-Requirements — **DEAD (404) — removed as a load-bearing citation**: re-fetched this pass and still 404; audit 05 C3 also demoted the marketing-blog tier. Used only for MS-09 concept, not clause. Substitute before scoring: NFPA 101 §7.5.2 / IBC §1009 read directly.
4. *Guidance on the emergency use of lifts or escalators for evacuation* (DCLG-linked, PDF mirror) — https://highrisefire.co.uk/docs/guidanceemergemcylifts.pdf — **UNVERIFIED (mirror, not official text)**: PDF not machine-extractable, and a campaign-site mirror is not the authoritative path; audit 05 C3 downgrades from T1. Used for MS-09, MS-10, MS-23 concept only.
5. US Access Board, *ADA 2010 Accessibility Standards* — https://www.access-board.gov/ada/ — **UNVERIFIED**: not fetched this pass; MS-16's §206/§403/§407 guess is not confirmed.
6. WBDG (NIBS/NIH), *Architectural Programming* — https://www.wbdg.org/design-disciplines/architectural-programming — carried from `architecture-theory.md` TH-01. Used for MS-02, MS-17.
T2 — peer-reviewed:
7. Al-Subbani, A. & Penn, A., *Challenges in Multilevel Wayfinding: A Case Study with the Space Syntax Technique*, Environment and Planning B — https://journals.sagepub.com/doi/10.1068/b34050t — **link only, article body not read**. Used for MS-24.
8. *Spatial complexity and wayfinding: extending space syntax to three dimensions* — https://arxiv.org/pdf/2012.14419 (preprint) — arXiv URL live; **body not read**. Used for MS-24.
9. Stráková, B. et al., *Elevator Traffic Simulation Procedure* — https://www.researchgate.net/publication/31598080_Elevator_Traffic_Simulation_Procedure — **UNVERIFIED: page not opened (ResearchGate is login-gated)**. Used for MS-10 method framing.
10. *Beyond the Up Peak*, symposium paper indexed at The Lift and Escalator Library — https://liftescalatorlibrary.org/paper_indexing/papers/00000430.pdf — **UNVERIFIED: PDF binary not extractable in either pass**. Used for MS-10.
11. *Tall Buildings and Elevators: A Review of Recent Technological Advances*, Buildings 5(3):1070, MDPI — https://www.mdpi.com/2075-5309/5/3/1070 — **UNVERIFIED: 403 to fetch both passes**. Used for MS-04, MS-11 (strategy taxonomy only, figures not taken).
T3 — established publications / owner standards:
12. CTBUH, *Height Criteria* — https://cloud.ctbuh.org/CTBUH_HeightCriteria.pdf — **previously cited as evidence for MS-03 and MS-13; audit 05 C4 found it is a height-and-completion measurement standard, not a core-layout or stack-order authority. It is no longer the evidence base of either rule and must not be re-attached without a services/structural text.** Retained here only as a title reference.
13. CTBUH, *Vertical Transportation: A Primer* (index copy) — https://www.scribd.com/document/505853062/index — **UNVERIFIED (dead index)**: Scribd index page has no readable body; existence of the primer is confirmed via Elevator World / CTBUH-store listings, but the "design driver of the section" characterisation is not established by any readable page. MS-01 no longer relies on it.
14. Council on Tall Buildings and Urban Habitat — https://verticalurbanism.org/ — **domain attribution confirmed 2026-09** (https://www.ctbuh.org/publications 302-redirects here), so the audit's "third-party journal" flag is out of date; **article-level text still UNVERIFIED** (not extracted). Used for MS-22 site-level only.
15. Network Rail, *Vertical Circulation* (owner standard, PDF) — https://www.networkrail.co.uk/uploads/2022/11/Vertical-Circulation.pdf — **UNVERIFIED: binary not extractable**. Candidate for MS-16, MS-23 (lift lobby and queue clearances).
16. Peters Research, *An Alternate Approach to Traffic Analysis for Residential Buildings* — https://peters-research.com/index.php/papers/an-alternate-approach-to-traffic-analysis-for-residential-buildings/ — **UNVERIFIED: page not opened**. Candidate for MS-10 (residential vs office peak profiles).
T4 — forums / vendor explainers (weak; used only where flagged):
17. AdSimulo University, *Elevator Traffic Analysis Explained* — https://adsimulo.com/support/adsimulo-university/basics-of-lift-traffic-analysis/ — **UNVERIFIED: content not machine-extractable**. MS-10.
18. Bukowski, *Emergency Egress from Buildings — Part II* (course PDF mirror) — https://pdhonline.com/courses/m465/Bukowski%20-%20Emergency%20Egress%20from%20Buildings.pdf — **UNVERIFIED: mirror, not opened**. MS-08, MS-21.
T5 — none used deliberately.
Host facts (task-verified, not external sources): one grid per floor sharing origin and tile size;
1 tile = 0.5 m; states `walkable | blocked | door`; wall = one blocked tile; 4-connected rooms with
door cells in no room (`src/engine/npc/rooms.ts:2,15,33`); portals as objects with interaction spots
and queues, default patience 30 s; role-tag access; no heights/sections/slabs/columns.
---

<!-- decision-making.md: rules=24, url-lines=8 -->
## decision-making.md

Format: name — what it establishes — tier. Retrieval status is stated per entry: entries marked
*located by search, not read* were surfaced by this session's searches (so the URL and title are
real) but their text was not machine-readable, so no sentence is quoted from them; entries marked
*no URL* are edition/year citations and are used only for the concept they carry. Nothing in this
file quotes a passage that was not retrieved; the rules whose evidence is `UNCITED — heuristic`
(DM-01, DM-07, DM-08, DM-15, DM-22, DM-24, and the standardisation claim in DM-19) are project
conventions, presented as such and not as findings about architecture.
- Herbert A. Simon, *Designing Organizations for an Information-Rich World* (1971) and *The Sciences of the Artificial*, 3rd ed., MIT Press, 1996 — bounded rationality and satisficing against aspiration levels; the case against optimising behaviour in information-rich problems. T3.
- Horst Rittel & Melvin Webber, "Dilemmas in a General Theory of Planning", *Policy Sciences* 4(2), 1973 — the ten properties of wicked problems; why some design decisions admit no computed optimum. T2/T3.
- Bruce Archibald (Geoffrey) Archer, *Systematic Method for Designers*, 1964 (reprinted in *Systematic Design for Form and Variety*, Prestel, 2000) — design as phased analysis/synthesis/evaluation activity. T3.
- Bryan Lawson, *How Designers Think*, Butterworth, 1980 (3rd ed., Architectural Press, 2004) — empirical comparison of designer strategies; problem- vs solution-focused behaviour and early fixation. T2/T3; contested in part (see Weak or contested).
- Thomas L. Saaty, *The Analytic Hierarchy Process*, McGraw-Hill, 1980 — weighted multicriteria comparison, pairwise weights, consistency ratio; also the target of the rank-reversal criticism. T3.
- Value engineering / value analysis: SAVE International code of conduct and function-analysis method (origin US, 1961 ff.); US federal VA/FNMA value engineering guidance — organised, function-based effort to achieve necessary function at whole-life cost. T1/T3.
- RIBA Plan of Work 2020 — staged gates from Strategic Definition to Handover; the mechanism for making and closing design choices at stage boundaries. T3 (professional body). https://www.riba.org/work/insights-and-resources/riba-plan-of-work/ and overview PDF https://www.riba.org/media/syneeeto/2020ribaplanofworkoverviewpdf.pdf — located by search, not read.
- Patrick MacLeamy / HOK, the "MacLeamy curve" (ARCHITECT, 2004, "Curve: The Next Curve in Design-Build Services") — claim that resource leverage and change cost move in opposite directions over a project's timeline. T3; contested (see Weak or contested).
- Roger Ulrich, "Effects of interior design on wellness: theory and new international research", *Yale Journal of Biology and Medicine*, 1991, and The Momentum Center for Evidence-Based Design — evidence-based design as the explicit alternative to authority-based rationale. T2/T3.
- Michael Nygard, "Documenting Architecture Decisions", Cognitect blog, 15 Nov 2011 — the ADR pattern: context/decision/status, immutable records, why options were rejected. T3/T4. https://www.cognitect.com/blog/2011-11-15/documenting-architecture-decisions ; standardised in UK GDS guidance https://gds-way.digital.cabinet-office.gov.uk/standards/architecture-decisions.html (T1) and adr.github.io — located by search, GDS page not read.
- Rittel & Webber (1973) as summarised with quotations by the Swedish Morphological Society, "Wicked Problems" https://www.swemorph.com/wp.html — T3; **read in this session**, supplied the four quoted properties used at DM-05. Wikipedia, "Satisficing" https://en.wikipedia.org/wiki/satisficing — T3; **read in this session**, supplied Simon's satisficing/bounded-rationality framing and the Simon 1955 *QJE* 69(1) pointer used at DM-02.
- Gary Klein, "Performing a Project Premortem", *Harvard Business Review*, September 2007 — assumption of failure and generation of reasons before committing. T3.
- RICS guidance on life cycle cost analysis; ASTM E917 standard practice for measuring whole-life costs — whole-life rather than initial-cost comparison. T1/T3.
- Measurement standards for net-to-gross language (BOMA methods of measuring floor area; RICS code of measuring practice) — efficiency is defined by the measurement rule chosen, so an efficiency argument is only as good as its definition. T1/T3.
- Project spec `goal-task` §21 (Domain T) and §36 (failure prioritisation) — T1 for this project's requirements and the default priority order.
- `AGENTS.md` (project root) — decide-don't-stall, veto-able decision logging, verification cadence. T1 for this project.

<!-- uncertainty.md: rules=20, url-lines=47 -->
## uncertainty.md

Tiers per UN-12. Nothing below T3 carries a number or a rule; T4 appears only for method, wording, or as
a labelled mirror of a paywalled/binary primary.
**T1 — official, standards bodies, government**
- ODNI ICD 203 *Analytic Standards* — https://archive.dni.gov/files/documents/ICD/ICD-203.pdf (binary PDF; body not machine-readable) + tradecraft wording from *Objectivity* — https://archive.dni.gov/index.php/how-we-work/objectivity (the three quoted duties)
- S. Kent, *Words of Estimative Probability* — https://www.cia.gov/readingroom/docs/CIA-RDP93T01132R000100020036-3.pdf (primary, not machine-readable); numeric equivalents via T4 mirror https://en.wikipedia.org/wiki/Words_of_estimative_probability
- IPCC AR5 *Uncertainties Guidance Note* — https://www.ipcc.ch/site/assets/uploads/2017-08/AR5_Uncertainty_Guidance_Note.pdf (not machine-readable) + mirror https://www.greenfacts.org/en/climate-change-ar5-science-basis/l-3/1-likelihood.htm (confidence definition, five terms, evidence sources, likelihood scale)
- CDC/ACIP, *GRADE handbook* ch. 7 *Determining certainty of evidence* — https://www.cdc.gov/acip-grade-handbook/hcp/chapter-7-grade-criteria-determining-certainty-of-evidence/index.html
- NIST TN 1297, Appendix D6 — https://www.nist.gov/pml/nist-technical-note-1297/nist-tn-1297-appendix-d6-uncertainty-and-units-si-proper-use-si-and
- GOV.UK, *Building regulations approval: when you need approval* — https://www.gov.uk/building-regulations-approval
- Building Safety Regulator, *Regulating the building control profession* — https://buildingsafety.campaign.gov.uk/building-safety-regulator-making-buildings-safer/building-safety-regulator-news/regulating-the-building-control-profession/
- ASME, *Verification, Validation and Uncertainty Quantification (VVUQ)* incl. V&V 10-2019, V&V 40-2018 — https://www.asme.org/codes-standards/publications-information/verification-validation-uncertainty
- AACE International, *18R-97 Cost Estimate Classification System* (TOC only) — https://web.aacei.org/docs/default-source/toc/toc_18r-97.pdf
- W3C, *PROV-O: The PROV Ontology*, Recommendation 30 Apr 2013 — https://www.w3.org/TR/prov-o/
- ISO 31000:2018 *Risk management — Guidelines* — https://www.iso.org/standard/65694.html (403; title/edition only, no clause relied on)
- NCARB, *Model Rules of Conduct* / *Model Law and Regulations* — https://www.ncarb.org/publications/ncarb-model-rules-of-conduct , https://www.ncarb.org/sites/default/files/LegislativeGuidelines.pdf (located; **not read** — no rule here rests on an NCARB clause)
**T2 — peer-reviewed**
- Der Kiureghian & Ditlevsen, "Aleatory or epistemic? Does it matter?", *Structural Safety* 31 (2009) — https://www.sciencedirect.com/science/article/abs/pii/S0167473008000556 ; abstract https://orbit.dtu.dk/en/publications/aleatoric-or-epistemic-does-it-matter/
- Kendall & Gal, NIPS 2017 — https://arxiv.org/abs/1703.04977
- Oehmen & Kwakkel, "Risk, Uncertainty, and Ignorance in Engineering Systems Design" (2022) — https://research.tudelft.nl/en/publications/risk-uncertainty-and-ignorance-in-engineering-systems-design/
- Lempert et al., *Frontiers in Climate* (2024) — https://www.frontiersin.org/journals/climate/articles/10.3389/fclim.2024.1380054/full
- Xu et al., "GhostCite", arXiv:2602.06718v2 (2026) — https://arxiv.org/html/2602.06718v2 (56,381 papers / 2.2 M citations; 1.07 % of papers with invalid citations)
- HALLMARK benchmark repo — https://github.com/rpatrik96/hallmark (2,526 entries, 14 types, 3 tiers; the tool-measurement gap; the 53-paper NeurIPS 2025 fabrication incident)
- Zhou et al., "Relying on the Unreliable…", ACL 2024 — https://arxiv.org/abs/2401.06730
- Kadavath et al., "Language Models (Mostly) Know What They Know" (2022) — https://arxiv.org/abs/2207.05221
- Ulmer et al., "What Verbalized Uncertainty in Language Models is Missing" (2025) — https://arxiv.org/abs/2507.10587
- Gebru et al., "Datasheets for Datasets" (arXiv 2018; CACM 2021) — https://arxiv.org/abs/1803.09010
- Garbin & Marques, *Radiology: AI* (2022) — https://pmc.ncbi.nlm.nih.gov/articles/PMC8980932/ (on Mitchell et al., *Model Cards for Model Reporting*, arXiv:1810.03993, FAT* 2019 — https://arxiv.org/pdf/1810.03993 , cited at title/abstract level)
- Located, **not read** (follow-up candidates, no claim rests on them): "Wicked Problems in Architectural Research", *Arena Journal* (2022) https://ajar.arena-architecture.eu/articles/10.5334/ajar.296 ; "Uncertainty and Risk Reduction in Engineering Design Embodiment Processes" https://www.designsociety.org/download-publication/26792/UNCERTAINTY+AND+RISK+REDUCTION+IN+ENGINEERING+DESIGN+EMBODIMENT+PROCESSES ; Hüllermeier & Waarmann, "Aleatoric and epistemic uncertainty in machine learning", *Machine Learning* (2021) https://link.springer.com/article/10.1007/s10994-021-05946-3
**T3 — established professional publications**
- BIM Forum, *Level of Development (LOD) Specification* (2025) — https://bimforum.org/resource/lod-level-of-development-lod-specification/
- AIA, *FAQs: G201-2013 Project Digital Data Protocol Form and G202-2013 Project BIM Form* — https://help.aiacontracts.com/hc/en-us/articles/1500010380681-faqs-g201-2013-project-digital-data-protocol-form-and-g202-2013-project-building-information-modeling-form
- Amazon.com Inc., *2016 Letter to Shareholders*, SEC Exhibit 99.1 — https://www.sec.gov/Archives/edgar/data/1018724/000119312516530910/d168744dex991.htm
- Located, **not read**: Saul Ewing, *Standard of Care for Design Professionals* https://www.saul.com/sites/default/files/documents/2021-04/Standard%20of%20Care%20for%20Design%20Professionals.pdf ; ABA *Construction Lawyer* (Spring 2025) "Less than Perfection…" https://www.americanbar.org/groups/construction_industry/resources/construction-lawyer/2025-spring/less-perfection-demystifying-standard-care-design-professionals (403)
- In-repo canonical: `architecture-skill/research/building-codes.md` (*How to flag instead of fake*, Numbers register) and `architecture-skill/research/architecture-theory.md` (rule-entry format, tier ladder)
**T4 — professional community (method, wording, or mirror only)**
- Projex, *How To Use RAID Properly In PRINCE2 7th Edition* — https://www.projex.com/how-to-use-raid-properly-in-prince2-7th-edition/
- Cenex, *AACE Cost Estimate Classification System (Class 1-5) Explained* — https://cenex.au/aace/estimate-classification.html
- Designing Buildings Wiki, *Duty of care in building design and construction* — https://www.designingbuildings.co.uk/wiki/Standard_of_care
- GreenFacts (IPCC mirror) and Wikipedia (Kent mirror) — URLs under T1 entries
- Located, **deliberately unused**: 5×5 risk-matrix explainers https://www.sentrient.com.au/blog/5x5-risk-matrix , https://mitti.com/topics/risk-assessment/5x5-risk-matrix (see *Weak or contested*) ; "Exploring automation bias in human–AI collaboration", *AI & Society* (2025) https://link.springer.com/article/10.1007/s00146-025-02422-7 (303 at retrieval; the follow-up to open for UN-20's human-side rationale)
---

<!-- grid-translation.md: rules=26, url-lines=7 -->
## grid-translation.md

Verified this session (T1 = official standard record, T3 = secondary/encyclopaedic or gov. report):
- S1 — **ISO 2848:1984, *Building construction — Modular coordination — Principles and rules*.** Title and year confirmed; the standard's subject is the principles and rules of modular coordination on the 3M system with a 100 mm basic module. ISO catalogue/OBP: https://www.iso.org/obp/ui/#!iso:std:7846:en (standard id 7846); sample record https://cdn.standards.iteh.ai/samples/7846/a86382c91b96433da03b947608e0c2d0/ISO-2848-1984.pdf — **T1 for identity only.** The PDF body has never been machine-readable to this project (the sample re-fetch this pass returned a corrupted stream, and https://www.iso.org/standard/7846.html returned HTTP 403), **so no clause text is or may be quoted from S1 anywhere in this file, and its live-vs-withdrawn status is still not established.**
- S1w — ***https://en.wikipedia.org/wiki/ISO_2848*** — **T3** (encyclopaedic). Read verbatim this pass: *"ISO 2848 is based on multiples of 300 mm and 600 mm. Preference given to lengths which are multiples of 3, 6, 12, 15, 30 and 60 basic modules."* This is the source of the preferred-series enumeration used in GT-03; it agrees with the ISO record the audit opened, but it is a secondary source and the standard's own table has not been read.
- S1b — **ISO 1006:1983, *Modular coordination — Basic module*.** This, not ISO 2848, is the standard that names the basic module — https://www.iso.org/standard/5470.html — **T1**. Relevant because the 100 mm basic module claim (GT-03, GT-10) belongs to ISO 1006.
- S2 — **WITHDRAWN AS EVIDENCE. NOT A VERIFIED STANDARD.** Earlier drafts cited "DIN 4150-1 *Modulraster*" as a modular-coordination standard. It could not be shown to exist: every search result for `DIN 4150` returned the DIN 4150-1…-3 *building vibration* series (e.g. DIN 4150-3:2016, see https://www.movesolutions.it/post/what-is-din-4150-and-why-is-it-the-global-standard). **S2 is therefore struck from every rule-level Source line in this file (GT-03, GT-07, GT-15, GT-16, GT-18, GT-21) and the `STANDARD` classes that rested on it have been demoted.** The correct German modular-coordination standard number is unknown to this project and must not be guessed; do not cite DIN 4150-1 in derived documents until a Beuth record is read — **unusable**.
- S3 — **NBS/NIST government report, *International and national standards on dimensional coordination*** (compiles ISO + national modular-coordination standards incl. DIN, NF, BS) — https://www.govinfo.gov/content/pkg/GOVPUB-C13-dbfc0c2959817b8c5904d1001a935af6/pdf/GOVPUB-C13-dbfc0c2959817b8c5904d1001a935af6.pdf — **T2/T3**. URL confirmed to exist via search; the PDF stream was not machine-readable in this session (re-attempted, still unread), so it is a **pointer only and supports no number**: where a rule still lists S3 it contributes nothing beyond the address, and it is never a `STANDARD`-tier warrant.
- S3b — *Modular coordination* overview (redirect/summary page; the 3M system and national adoptions are **not** on it) — https://en.wikipedia.org/wiki/Modular_coordination — **T3, weak**: consulted and found to carry none of the figures used here. Kept as a negative result so nobody re-cites it.
- S4 — WBDG (NIBS/NIH) design-discipline pages incl. barrier-free dimensioning — https://www.wbdg.org/design-objectives/able-bodied — **T1/T3**.
- S5 — F. D. K. Ching, *Architecture: Form, Space, and Order*, 5th ed., Wiley — **T3**, cited by edition; no URL retrieved (used only for proportion vocabulary, no numeric claim).
- S6 — **WITHDRAWN AS EVIDENCE. IDENTIFIER NOT VERIFIED.** "BS 5606 *Guide to accuracy in building*" — no BSI record retrieved in any pass, so the number may be wrong. **It has been struck from GT-07's Source line and GT-07's class demoted from `STANDARD` to `DESIGN PRINCIPLE`**; the tolerance *principle* used there is credited to S1's subject matter plus standing practice, not to this identifier. Do not reproduce "BS 5606" downstream as a citation until a BSI record is read.
- S7 — Ching & Ward, *Building Construction Illustrated*, 5th ed., Wiley, ch. 5-6 (wall build-ups, structural grid) — **T3**, by edition; used only for the qualitative claim that a real partition is far thinner than 0.5 m.
- S8 — door clear-opening practice (ANSI/BHMA A156 series sizing; manufacturer clear-opening tables) — **T1/T3**, series named from standing practice, no table quoted; all door figures here are illustrative inputs already catalogued in `building-codes.md`.
- S10 — lift machine-room / stair dimensional practice (manufacturer type tables) — **T3**, not quoted numerically; the GT-14 sub-rectangles are illustrative placeholders.
- S12 — net-to-gross measurement conventions (BOMA-type practice) — **T3**; **no specific standard number asserted**.
Host-code evidence (all **FACT**, T5-equivalent as in-repo verification):
`src/blueprint-editor/domain/schema/walkable.ts:4` (three tile states only);
`src/engine/npc/rooms.ts:2,15,33` (4-connected flood-fill, doors excluded from rooms);
`src/engine/npc/pathfinding.ts:190-228` (octile costs, diagonal requires both orthogonal neighbours open **and** unoccupied).

<!-- validation.md: rules=23, url-lines=33 -->
## validation.md

Opened this session (verdicts above trace to these; sibling files carry the underlying code mirrors):
- buildingSMART — IDS repository ("computer interpretable XML based standard... to define IFC based Information Delivery Specifications") https://github.com/buildingSMART/IDS — **T1**.
- Solibri — *Everything you need to know about IDS* ("standardized machine-readable format for tools, such as Solibri, to automatically check"; requirements writable by "anyone") https://www.solibri.com/articles/everything-you-need-to-know-about-information-delivery-specifications — **T3**.
- BIMcollab help — *Creating an IDS* (structure: description/applicability/requirements; cardinality; "If any are found, the specification fails") https://helpcenter.bimcollab.com/en/articles/327351-creating-an-ids-information-delivery-specification — **T3**.
- PMC — systematic/review article, BIM knowledge-graph automated code compliance (barriers: "existing BIM modeling specifications of various professions cannot meet the review requirements"; output class "warning, which indicates the need for manual re-checking"; reported >96% accuracy single study) https://pmc.ncbi.nlm.nih.gov/articles/PMC10151318/ — **T2**.
- Wikipedia — *Counterexample-guided abstraction refinement* (three-valued verdicts, spurious counterexamples, refinement loop; original: Clarke, Grumberg, Jha, Lu, Vardi, JACM 50(5), 2003, https://dl.acm.org/doi/10.1145/876638.876643 — **T2** cited by name/DOI) — **T3**.
- Wikipedia — *V-model* (verification vs validation questions; test-level correspondence) https://en.wikipedia.org/wiki/V-model — **T3**.
- The Center for Children & Design — *Space Syntax And Spatial Cognition: Or Why the Axial Line?* (simulated movement density vs observed pedestrian counts "strong enough to confirm"; integration vs interaction quote) https://theccd.org/spotlight-research/space-syntax-and-spatial-cognition-or-why-the-axial-line/ — **T3** (synopsis of **T2** studies: Penn, Hillier, Desolier).
- CIBSE Journal — *Lessons learned: UCL & Buro Happold project review guidelines* (reviews to "reduce the 'performance gap'"; functional/technical/process criteria; RIBA 0-7; defect reduction at handover) https://www.cibsejournal.com/technical/lessons-learned-ucl-and-buro-happolds-award-winning-project-review-guidelines/ — **T3**.
- CCM — *ISO 19650-2 Explained* (checking "ensuring that information complies with the agreed specifications" vs "authorisation will confirm... can proceed") https://www.uniccm.com/iso-19650-2-explained — **T4** (explainer; ISO 19650 text paywalled, not retrieved).
- Minnesota Dept. of Labor & Industry — *Building plan review* ("We examine construction documents and supporting documentation for buildings funded by the state...") https://www.dli.mn.gov/business/get-licenses-and-permits/building-plan-review — **T1**.
- DC Dept. of Buildings — *Overview of Permitting Process* (multi-step, multi-agency approvals) https://dob.dc.gov/page/overview-permitting-process-0 — **T1** (thin content retrieved).
- JDJ Consulting — *How to read LADBS correction notices* (per-clause comments, e.g. "Update foundation details per LABC Section 1808"; numbered replies; "once corrections are cleared, the permit is issued") https://jdj-consulting.com/how-to-read-ladbs-correction-notices-a-homeowners-guide-to-plan-check-comments/ — **T4**.
- Snyk — *Static Application Security Testing (SAST) Scanning* ("The scan is performed before the code is executable"; "Legacy SAST tools could have a 50 to 80% false positive rate") https://snyk.io/articles/application-security/static-application-security-testing/ — **T3**.
- Mend.io — *Triage your Code Security Findings* ("high-confidence findings to reduce noise"; "If you disagree with the severity assigned... you can change it"; "When a false-positive/acceptable risk is reported, the workflow is to suppress it") https://docs.mend.io/platform/latest/triage-your-code-security-findings — **T3**.
- Harmony AI — *Defect Classification: Critical, Major, Minor* ("could cause an unsafe condition or violate a regulation, no matter how small it looks"; major = function loss; minor = cosmetic) https://www.tryharmony.ai/defect-classification-critical-major-minor — **T4**.
- DFMA Resources (Boothroyd Dewhurst) — *What is DFMA?* (part-count elimination heuristic; 20-50% fewer parts) https://www.dfma.com/resources/what-is-dfma.asp — **T3**.
- Enginero — *BIM Clash Detection: Hard, Soft & Workflow Clashes* (hard = "physically intersect"; soft = lacking "proper clearance"; workflow = operation/maintenance inconsistency) https://www.enginero.com/blogs/bim-clash-detection-hard-soft-workflow-clashes/ — **T4**.
- In-repo consolidation files used as routed threshold sources: `building-codes.md` (CODE-01..28; incl. WA-adopted IBC tables T1, ADA Ch.4 T1, up.codes mirrors T3, NCC T1, AD B/K/M T1/mirrors), `professional-practice.md` (PP-01..26), `architecture-theory.md` (TH-01..).
---
