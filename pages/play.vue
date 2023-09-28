<script setup>
let startTeam = ref("");

const { $gsap } = useNuxtApp();

const setStartTeam = (team) => {
  startTeam.value = team;
  $gsap
    .to(".play__introOverlay__choiceContainer", {
      duration: 0.5,
      autoAlpha: 0,
      ease: "power3.inOut",
    })
    .then(() => {
      $gsap.set(".play__introOverlay__choiceContainer", {
        display: "none",
      });
    });

  $gsap.to(".play__introOverlay__placementContainer", {
    delay: 0.5,
    duration: 0.5,
    autoAlpha: 1,
    ease: "power3.inOut",
  });
};

const hideOverlay = () => {
  $gsap.to(".play__introOverlay", {
    duration: 0.5,
    autoAlpha: 0,
    ease: "power4.inOut",
  });
};
</script>

<template>
  <main class="play">
    <div class="play__container">
      <Game />
    </div>

    <aside class="play__introOverlay">
      <div class="play__introOverlay__choiceContainer">
        <h2>Prends position</h2>
        <div class="play__introOverlay__choices">
          <ButtonUnderline @click="setStartTeam('france')"
            >France</ButtonUnderline
          >
          <ButtonUnderline @click="setStartTeam('grandeBretagne')"
            >Grande Bretagne</ButtonUnderline
          >
        </div>
      </div>
      <div class="play__introOverlay__placementContainer">
        <h2>Définis ta stratégie</h2>
        <div class="play__introOverlay__placement">
          <Card>
            <template #text>
              Maintenant que tu as choisi ton camp, à toi de positionner ton
              armée de soldats sur le territoire américain.</template
            >
            <template #extra> fdlsfsd fsdfdsf </template>
          </Card>
          <Card>
            <template #text
              >Tu détiens autant de soldats que ton adversaire avec trois
              troupes.</template
            >
            <template #extra> fdlsfsd fsdfdsf </template>
          </Card>
        </div>
        <ButtonUnderline @click="hideOverlay">Suite</ButtonUnderline>
      </div>
    </aside>
  </main>
</template>

<style scoped lang="scss">
.play {
  width: 100%;
  height: 100%;
  background: #21295c;

  h2 {
    color: #600;
    font-size: 110px;
    font-style: normal;
    font-weight: 400;
    line-height: normal;
    text-decoration-line: underline;
  }

  &__container {
    width: 100%;
    height: 100%;
    max-width: 1200px;
    margin: 0 auto;

    display: flex;
    align-items: center;
  }

  &__introOverlay {
    position: absolute;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    width: 100%;
    height: 100%;
    background-color: rgba(240, 248, 255, 0.9);

    &__choiceContainer {
      margin: 4rem;
    }

    &__choices {
      display: flex;
      gap: 1.5rem;
    }

    &__placementContainer {
      // display: none;
      opacity: 0;
      visibility: hidden;
    }

    &__placement {
      display: flex;
      gap: 1.5rem;
    }
  }
}
</style>
