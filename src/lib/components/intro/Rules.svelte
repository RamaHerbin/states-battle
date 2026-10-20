<script lang="ts">
	import { fr } from '$lib/content/fr';

	let { open = $bindable(false) }: { open: boolean } = $props();

	let dialog: HTMLDialogElement | undefined = $state();
	let opener: Element | null = null;

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) {
			opener = document.activeElement;
			dialog.showModal();
		} else if (!open && dialog.open) {
			dialog.close();
		}
	});

	function onclose() {
		open = false;
		if (opener instanceof HTMLElement) opener.focus();
	}

	// A click on the backdrop lands on the <dialog> itself.
	function onclick(e: MouseEvent) {
		if (e.target === dialog) dialog?.close();
	}
</script>

<dialog bind:this={dialog} class="rules" aria-labelledby="rules-title" {onclose} {onclick}>
	<div class="rules__body">
		<h2 id="rules-title" class="rules__title type-screen">{fr.rules.title}</h2>
		<ol class="rules__list">
			{#each fr.rules.items as item}
				<li>{item}</li>
			{/each}
		</ol>
		<button type="button" class="rules__close btn btn--primary" onclick={() => dialog?.close()}>
			{fr.rules.close}
		</button>
	</div>
</dialog>

<style>
	.rules {
		margin: auto;
		width: min(40rem, calc(100vw - 2rem));
		max-height: calc(100dvh - 2rem);
		padding: 0;
		border: 2px solid var(--red);
		background: var(--navy);
		color: var(--paper);
		overscroll-behavior: contain;
	}
	.rules::backdrop {
		background: rgb(10 14 40 / 0.8);
	}
	.rules__body {
		padding: clamp(1.25rem, 4vw, 2.25rem);
	}
	.rules__title {
		font-size: clamp(2.5rem, 8vw, 4rem);
		color: var(--red);
		text-decoration: underline;
		text-underline-offset: 0.12em;
	}
	.rules__list {
		margin-top: 1rem;
		padding-left: 1.4em;
		list-style: decimal;
		font-size: clamp(1.1rem, 2.5vw, 1.3rem);
		line-height: 1.35;
		display: grid;
		gap: 0.6rem;
	}
	.rules__close {
		margin-top: 1.5rem;
	}
</style>
