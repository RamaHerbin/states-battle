<script setup></script>

<template>
  <main class="index">
    <div class="index__container">
      <h1>STATES-BATTLE<br />GAME</h1>

      <div class="index__textContainer">
        <div class="index__description">
          Au XVIIIe siècle, la France et la Grande Bretagne s’arrachent les
          territoires à conquérir. À toi de choisir ton camp pour aider ton pays
          à démasquer les troupes alliées sur le territoire américain.
        </div>
        <Button>
          <NuxtLink to="/play"> JOUER </NuxtLink>
        </Button>
      </div>
    </div>
  </main>
</template>

<style scoped lang="scss">
.index {
  position: absolute;
  height: 100%;
  width: 100%;
  background-image: url(/bg_index.png);
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;

  &__container {
    max-width: 1200px;
    height: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
  }

  &__textContainer {
  }

  &__description {
    color: #fff;
    font-size: 3rem;
    font-style: normal;
    font-weight: 400;
    line-height: normal;
    margin-bottom: 2rem;
  }

  h1 {
    color: #f53c1b;
    font-size: 160px;
    font-style: normal;
    font-weight: 400;
    line-height: normal;
  }
}
</style>
