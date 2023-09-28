<script setup></script>

<template>
  <article class="card">
    <p class="card__text">
      <slot name="text"></slot>
    </p>
    <slot name="extra"></slot>
  </article>
</template>

<style lang="scss" scoped>
.card {
  padding: 1rem;
  border-radius: 15px;
  background: rgba(18, 28, 228, 0.1);
  &__text {
    color: #f53c1b;
    font-family: "Khand", sans-serif;
    font-size: 2rem;
    font-weight: 500;
    line-height: 40px;
  }
}
</style>
