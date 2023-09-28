<script setup></script>

<template>
  <button>
    <slot></slot>
  </button>
</template>

<style scoped lang="scss">
button {
  position: relative;
  border-radius: 15px;
  background: #ffd4d4;

  padding: 1rem 2rem;
  border: none;
  border-bottom: 2px solid #f53c1b;

  //   text

  color: #121ce4;
  font-size: 3rem;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
  letter-spacing: 3px;

  // &:after {
  //   pointer-events: none;
  //   position: absolute;
  //   top: 2px;
  //   left: 2px;
  //   display: block;
  //   content: "";
  //   border-radius: 15px;
  //   width: 100%;
  //   height: 100%;
  //   border: 1px solid #f53c1b;
  // }

  // Reset default style

  margin: 0;
  width: auto;
  overflow: visible;

  /* Normalize `line-height`. Cannot be changed from `normal` in Firefox 4+. */
  line-height: normal;

  /* Corrects font smoothing for webkit */
  -webkit-font-smoothing: inherit;
  -moz-osx-font-smoothing: inherit;

  /* Corrects inability to style clickable `input` types in iOS */
  -webkit-appearance: none;
}
</style>
