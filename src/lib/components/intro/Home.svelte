<script lang="ts">
	import { session } from '$lib/game/session.svelte';
	import { fr } from '$lib/content/fr';
	import type { AiLevel } from '$lib/game/types';
	import type { Mode } from '$lib/game/session.svelte';
	import Rules from './Rules.svelte';

	let mode = $state<Mode>(session.mode);
	let level = $state<AiLevel>(session.level);
	let rulesOpen = $state(false);

	const modes: { value: Mode; label: string }[] = [
		{ value: 'ai', label: fr.home.modeAi },
		{ value: 'local', label: fr.home.modeLocal }
	];
	const levels: AiLevel[] = ['easy', 'normal', 'hard'];
</script>

<section class="home">
	<picture class="home__bg">
		<source
			type="image/avif"
			srcset="/img/bg-960.avif 960w, /img/bg-1920.avif 1920w"
			sizes="100vw"
		/>
		<source
			type="image/webp"
			srcset="/img/bg-960.webp 960w, /img/bg-1920.webp 1920w"
			sizes="100vw"
		/>
		<img src="/img/bg-1920.webp" alt="" fetchpriority="high" />
	</picture>

	<div class="home__inner">
		<h1 class="home__title screen-heading type-hero" tabindex="-1">{fr.home.title}</h1>
		<p class="home__pitch">{fr.home.pitch}</p>

		<fieldset class="home__group">
			<legend>{fr.home.modeLabel}</legend>
			<div class="home__choices">
				{#each modes as m}
					<label class="home__choice">
						<input type="radio" name="mode" value={m.value} bind:group={mode} />
						<span>{m.label}</span>
					</label>
				{/each}
			</div>
		</fieldset>

		{#if mode === 'ai'}
			<fieldset class="home__group home__level">
				<legend>{fr.home.levelLabel}</legend>
				<div class="home__choices">
					{#each levels as l}
						<label class="home__choice">
							<input type="radio" name="level" value={l} bind:group={level} />
							<span>{fr.home.level[l]}</span>
						</label>
					{/each}
				</div>
			</fieldset>
		{/if}

		<div class="home__actions">
			<button type="button" class="home__play btn btn--primary btn--lg" onclick={() => session.start(mode, level)}>
				{fr.home.play}
			</button>
			<button type="button" class="home__rules btn btn--link" onclick={() => (rulesOpen = true)}>
				{fr.home.rules}
			</button>
		</div>
		<footer class="home__credits">
			<p>{fr.credits.text}</p>
			<a href="https://github.com/RamaHerbin/states-battle" rel="noopener" target="_blank">{fr.credits.link}</a>
		</footer>
	</div>
</section>

<Rules bind:open={rulesOpen} />

<style>
	.home {
		position: relative;
		min-height: 100dvh;
		display: grid;
		align-items: center;
		overflow: hidden;
		background: var(--navy);
	}
	.home__bg,
	.home__bg img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	/* Keeps the white text readable over the illustration. */
	.home__bg::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(rgb(20 8 24 / 0.15), rgb(20 8 24 / 0.45));
	}
	.home__inner {
		position: relative;
		z-index: 1;
		width: min(100%, 60rem);
		margin-inline: auto;
		padding: clamp(1.5rem, 5vw, 4rem) 1rem;
		display: grid;
		justify-items: center;
		gap: clamp(1rem, 2.5vw, 1.75rem);
		text-align: center;
	}
	.home__title {
		font-size: clamp(3.5rem, 17vw, 10rem);
		color: var(--red);
		text-wrap: balance;
		text-shadow: 0 2px 0 rgb(0 0 0 / 0.25);
	}
	.home__pitch {
		max-width: 40ch;
		font-size: clamp(1.15rem, 2.8vw, 1.6rem);
		line-height: 1.3;
		color: #fff;
		text-wrap: pretty;
	}
	.home__group {
		border: 0;
		padding: 0;
		margin: 0;
		display: grid;
		justify-items: center;
		gap: 0.4rem;
	}
	.home__group legend {
		padding: 0;
		font-size: 1rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--paper);
		margin-inline: auto;
		text-shadow: 0 1px 2px rgb(0 0 0 / 0.6);
	}
	.home__choices {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5rem;
	}
	.home__choice {
		position: relative;
		cursor: pointer;
	}
	.home__choice input {
		position: absolute;
		inset: 0;
		opacity: 0;
		cursor: pointer;
	}
	.home__choice span {
		display: flex;
		align-items: center;
		min-height: 2.75rem;
		padding: 0.25rem 1.1rem;
		font-size: 1.25rem;
		border: 2px solid var(--paper);
		background: rgb(33 41 92 / 0.6);
		color: var(--paper);
	}
	.home__choice input:checked + span {
		background: var(--paper);
		color: var(--navy);
	}
	.home__choice input:focus-visible + span {
		outline: 3px solid var(--focus);
		outline-offset: 3px;
	}
	.home__actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 1rem 2rem;
		margin-top: 0.5rem;
	}
	.home__rules {
		font-size: clamp(1.75rem, 4vw, 2.25rem);
	}
	.home__credits {
		display: grid;
		justify-items: center;
		gap: 0.25rem;
		max-width: 46ch;
		margin-top: clamp(0.5rem, 2vw, 1.5rem);
		font-size: 0.95rem;
		line-height: 1.35;
		color: var(--paper);
		text-shadow: 0 1px 2px rgb(0 0 0 / 0.6);
	}
	.home__credits a {
		display: inline-flex;
		align-items: center;
		min-height: 2.75rem;
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}
</style>
