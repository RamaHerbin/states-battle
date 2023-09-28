<script setup>
const { $d3 } = useNuxtApp();
import * as topojson from "topojson-client";

console.log("$d3 :>> ", $d3);

let us = await $d3.json("/us-trimed.json");

const dealViewMinMaxData = [483000, 3234042000];

const color = $d3.scaleLinear(dealViewMinMaxData, $d3.schemePaired);

let width = ref(1000);
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
    .attr("viewbox", "0 0 1000 700")
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
      return d.properties.name;
    })
    .attr("d", path)
    .attr("stroke", "white")
    .attr("stroke-linejoin", "round")
    .on("click", function (event, d) {
      console.log(d.properties.name);
      $d3.select(`#${d.properties.name}`).style("fill", "blue");
    });

  console.log("svg2.value :>> ", svg2.value._groups[0][0]);

  document.querySelector(".game").append(svg2.value._groups[0][0]);
});
</script>

<template>
  <section class="game">
    test
    {{ width }}
    {{ height }}

    <!-- <template v-if="svg2">
      {{ JSON.svg2.value._groups[0][0] }}
      <svg v-html="svg2._groups[0][0]"></svg
    ></template> -->
  </section>
</template>

<style scoped lang="scss"></style>
