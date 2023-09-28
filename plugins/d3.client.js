import * as d3 from "d3";

export default defineNuxtPlugin(() => {
  return {
    provide: {
      d3,
    },
  };
});
