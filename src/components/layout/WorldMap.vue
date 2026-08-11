<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import { BRANCHES } from "@/data/branches";

const svgRef = ref<SVGSVGElement | null>(null);
const mapLoading = ref(true);
const mapError = ref(false);
const tooltipVisible = ref(false);
const tooltipX = ref(0);
const tooltipY = ref(0);
const tooltipName = ref("");
const tooltipCity = ref("");
const tooltipContinent = ref("");

let zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null;
let svgSel: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;
let gSel: d3.Selection<SVGGraphicsElement, unknown, null, undefined> | null = null;
let cachedWorld: { features: Array<{ type: string; geometry: unknown }> } | null = null;
let resizeFrameId: number | null = null;

interface NodeData {
  id: string;
  name: string;
  lat: number;
  lon: number;
  accentColor: string;
  city: string;
  continent: string;
}

function drawMap() {
  if (!svgRef.value) return;

  const svg = svgRef.value;
  const width = svg.clientWidth || 800;
  const height = svg.clientHeight || 400;

  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));

  svgSel = d3.select(svg);
  svgSel.selectAll("*").remove();

  const projection = d3
    .geoMercator()
    .scale(width / 6.5)
    .translate([width / 2, height / 2]);

  const path = d3.geoPath().projection(projection);

  zoomBehavior = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.5, 8])
    .on("zoom", (event) => {
      if (gSel) gSel.attr("transform", event.transform);
    });

  svgSel.call(zoomBehavior);

  gSel = svgSel.append("g") as unknown as d3.Selection<SVGGraphicsElement, unknown, null, undefined>;

  gSel.append("rect").attr("class", "ocean").attr("width", width).attr("height", height);

  if (cachedWorld) {
    mapLoading.value = false;
    gSel
      .selectAll("path.land")
      .data(cachedWorld.features)
      .enter()
      .append("path")
      .attr("class", "land")
      .attr("d", path as unknown as (d: unknown) => string);
    drawNodes(projection);
  } else {
    mapLoading.value = true;
    mapError.value = false;
    const fetchPromise = d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json");
    const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Map data fetch timeout")), 10000));
    Promise.race([fetchPromise, timeoutPromise])
      .then((data: unknown) => {
        if (!gSel) return;
        const topo = data as { objects: { countries: { type: string; geometries: unknown[] } } };
        cachedWorld = topojson.feature(topo as never, topo.objects.countries as never) as unknown as { features: Array<{ type: string; geometry: unknown }> };
        gSel
          .selectAll("path.land")
          .data(cachedWorld.features)
          .enter()
          .append("path")
          .attr("class", "land")
          .attr("d", path as unknown as (d: unknown) => string);
        drawNodes(projection);
        mapLoading.value = false;
      })
      .catch(() => {
        mapError.value = true;
        mapLoading.value = false;
        drawNodes(projection);
      });
  }
}

function drawNodes(projection: d3.GeoProjection) {
  if (!gSel) return;

  const nodes: NodeData[] = BRANCHES.map((t) => ({
    id: t.id,
    name: t.name,
    lat: t.lat,
    lon: t.lon,
    accentColor: t.accentColor,
    city: t.city,
    continent: t.continent,
  }));

  interface ConnectionPair {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }
  const connectionPairs: ConnectionPair[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const c1 = projection([nodes[i].lon, nodes[i].lat]);
      const c2 = projection([nodes[j].lon, nodes[j].lat]);
      if (c1 && c2) {
        connectionPairs.push({
          x1: c1[0],
          y1: c1[1],
          x2: c2[0],
          y2: c2[1],
        });
      }
    }
  }

  gSel
    .selectAll(".connectionline")
    .data(connectionPairs)
    .enter()
    .insert("line", ".nodegroup")
    .attr("class", "connectionline")
    .attr("x1", (d) => d.x1)
    .attr("y1", (d) => d.y1)
    .attr("x2", (d) => d.x2)
    .attr("y2", (d) => d.y2);

  const nodeGroups = gSel
    .selectAll(".nodegroup")
    .data(nodes)
    .enter()
    .append("g")
    .attr("class", "nodegroup")
    .attr("transform", (d) => {
      const coords = projection([d.lon, d.lat]);
      return coords ? `translate(${coords[0]},${coords[1]})` : "";
    })
    .style("cursor", "pointer")
    .attr("tabindex", 0)
    .attr("role", "button")
    .attr("aria-label", (d) => `${d.name} — ${d.city}`);

  nodeGroups.append("circle").attr("class", "nodepulse").attr("r", 8).style("stroke", "var(--accent-gold)");

  nodeGroups.append("circle").attr("class", "nodering").attr("r", 12).style("stroke", "var(--accent-gold)");

  nodeGroups.each(function (this: SVGGElement, d: NodeData) {
    const g = d3.select(this);
    g.append("circle").attr("r", 6).attr("class", "nodecircle").style("fill", d.accentColor).style("stroke", "none");
  });

  nodeGroups.append("text").attr("dy", 3).attr("text-anchor", "middle").style("font-size", "9px").style("fill", "var(--bg-primary)").style("pointer-events", "none").text("\u2605");

  nodeGroups
    .append("text")
    .attr("class", "nodelabel")
    .attr("dy", 16)
    .attr("text-anchor", "middle")
    .style("font-size", "8px")
    .style("fill", "var(--text-dim)")
    .style("pointer-events", "none")
    .text((d) => d.name);

  nodeGroups
    .on("mouseover", function (this: SVGGElement, _, d: NodeData) {
      tooltipVisible.value = true;
      tooltipName.value = d.name;
      tooltipCity.value = d.city;
      tooltipContinent.value = d.continent;
      d3.select(this).select(".nodering").classed("visible", true);
    })
    .on("mousemove", function (event) {
      const rect = svgRef.value!.getBoundingClientRect();
      tooltipX.value = event.clientX - rect.left + 12;
      tooltipY.value = event.clientY - rect.top - 10;
    })
    .on("mouseout", function () {
      tooltipVisible.value = false;
      d3.select(this).select(".nodering").classed("visible", false);
    })
    .on("click", function (this: SVGGElement, event: MouseEvent) {
      event.stopPropagation();
    })
    .on("keydown", function (this: SVGGElement, event: KeyboardEvent) {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      event.stopPropagation();
    });
}

function zoomIn() {
  if (svgSel && zoomBehavior) svgSel.transition().call(zoomBehavior.scaleBy, 1.5);
}

function zoomOut() {
  if (svgSel && zoomBehavior) svgSel.transition().call(zoomBehavior.scaleBy, 1 / 1.5);
}

function resetZoom() {
  if (svgSel && zoomBehavior) svgSel.transition().call(zoomBehavior.transform, d3.zoomIdentity);
}

function handleResize(): void {
  if (resizeFrameId !== null) return;
  resizeFrameId = requestAnimationFrame(() => {
    resizeFrameId = null;
    drawMap();
  });
}

onMounted(() => {
  drawMap();
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  if (resizeFrameId !== null) cancelAnimationFrame(resizeFrameId);
  window.removeEventListener("resize", handleResize);
});
</script>

<template>
  <div class="map">
    <svg ref="svgRef" class="map__svg"></svg>

    <div v-if="mapLoading" class="map__status map__status--loading">Loading world map...</div>
    <div v-if="mapError" class="map__status map__status--error">Map data unavailable — showing branches only</div>

    <div class="map__controls">
      <button class="map__btn" aria-label="Zoom in" @click="zoomIn">+</button>
      <button class="map__btn" aria-label="Zoom out" @click="zoomOut">-</button>
      <button class="map__btn" aria-label="Reset zoom" @click="resetZoom">Reset</button>
    </div>

    <div class="map__legend">
      <div class="map__legend">
        <span class="map__legenddot" style="background: var(--accent-gold)"></span>
        Continental Branch
      </div>
    </div>

    <div v-if="tooltipVisible" class="map__tooltip" role="tooltip" :style="{ left: tooltipX + 'px', top: tooltipY + 'px' }">
      <div class="map__tipname">{{ tooltipName }}</div>
      <div class="map__tiprow">
        City: <span class="map__tipval">{{ tooltipCity }}</span>
      </div>
      <div class="map__tiprow">
        Region: <span class="map__tipval">{{ tooltipContinent }}</span>
      </div>
    </div>
  </div>
</template>
