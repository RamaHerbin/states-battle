<script setup>
const { $d3 } = useNuxtApp();
import * as topojson from "topojson-client";

let us = await $d3.json("/us-trimed.json");

const dealViewMinMaxData = [483000, 3234042000];

const color = $d3.scaleLinear(dealViewMinMaxData, $d3.schemePaired);

let width = ref(900);
let height = ref(550);

const svg2 = ref(null);

onMounted(() => {
  const projection = $d3
    .geoAlbersUsa()
    .scale(1200)
    .translate([width.value / 2, height.value / 2]);

  const path = $d3.geoPath();

  svg2.value = $d3
    .create("svg")
    .attr("viewbox", "0 0 700 700")
    .style("width", "100%")
    .style("height", "700px");

  const counties = svg2.value
    .selectAll("path")
    .data(topojson.feature(us, us.objects.states).features)
    .join("path")
    .attr("fill", (d) => {
      console.log("d.id :>> ", d.id);
      return "red";
    })
    .attr("id", function (d, i) {
      return d.id;
    })
    .attr("d", path)
    .attr("stroke", "white")
    .attr("stroke-linejoin", "round")
    .on("click", function (event, d) {
      $d3.select(`#${d.id}`).style("fill", "blue");
    });

  svg2.value._groups[0][0].classList.add("svg");

  document.querySelector(".game").append(svg2.value._groups[0][0]);
});
</script>

<template>
  <section class="game"></section>
</template>

<style scoped lang="scss">
.game {
  width: 100%;
  .svg {
  }
}
</style>
