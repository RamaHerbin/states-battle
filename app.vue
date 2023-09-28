<template>
  <NuxtPage />
</template>

<style lang="scss">
@import url("https://fonts.googleapis.com/css2?family=Karantina:wght@300;400;700&family=Oswald:wght@200&display=swap");

body {
  font-family: "Karantina", sans-serif;
}

@import url("https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Karantina:wght@300;400;700&family=Khand:wght@300;400;500;600;700&family=Oswald:wght@200&display=swap");

*,
*:before,
*:after {
  box-sizing: inherit;
}

html {
  height: 100%;
  box-sizing: border-box;
}

#__nuxt {
  width: 100%;
  height: 100%;
  min-height: 100%;
}
body {
  min-height: 100%;
  height: 100%;
  width: 100%;

  &.blockScroll {
    overflow: hidden;
  }
}

a {
  text-decoration: none;
}

ul,
ul li,
ul ul li {
  margin: 0;
  text-indent: 0;
  list-style-type: none;
}

ul {
  padding-left: 0;
}

h1 {
  margin: 0;
}
</style>
