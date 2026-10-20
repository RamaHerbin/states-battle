/**
 * Framework-agnostic motion layer. Finds elements by class / data attribute and
 * never touches pointer-events. Every function returns a kill function.
 */
import { gsap } from 'gsap';
import type { Screen } from '$lib/game/session.svelte';
import type { Shot, StateId } from '$lib/game/types';
import { MAP_SELECTOR, countValue, duration, impactPlan, stateSelector, type MapSide } from './helpers';

export type Kill = () => void;

const SVG_NS = 'http://www.w3.org/2000/svg';
const noop: Kill = () => {};

const q = (root: ParentNode, sel: string): Element[] => Array.from(root.querySelectorAll(sel));

/** Run `build` in a gsap context scoped to root; returns its revert. */
function scoped(root: Element, build: () => void): Kill {
	const ctx = gsap.context(build, root);
	return () => ctx.revert();
}

/** Opacity-only fade used under reduced motion. */
function fade(targets: Element[], reduced: boolean): gsap.core.Tween | null {
	if (!targets.length) return null;
	return gsap.fromTo(targets, { opacity: 0 }, { opacity: 1, duration: duration(0.15, reduced), clearProps: 'opacity' });
}

export function enterScreen(screen: Screen, root: Element, reduced = false): Kill {
	return scoped(root, () => {
		const all = (sel: string) => q(root, sel);
		if (reduced) {
			fade(all(SCREEN_FADE[screen]), true);
			return;
		}
		const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
		const from = (sel: string, vars: gsap.TweenVars, at?: string | number, stagger = 0) => {
			const t = all(sel);
			if (t.length) tl.from(t, { ...vars, stagger, clearProps: 'transform,opacity,clipPath' }, at);
		};
		switch (screen) {
			case 'home':
				from('.home__title', { clipPath: 'inset(0 0 100% 0)', yPercent: 30, opacity: 0, duration: 0.5 });
				from('.home__pitch', { y: 14, opacity: 0, duration: 0.35 }, '-=0.25');
				from('.home__play, .home__rules', { y: 12, opacity: 0, duration: 0.3 }, '-=0.2', 0.08);
				break;
			case 'camp':
				from('.camp__title', { y: -12, opacity: 0, duration: 0.3 });
				from('.camp__choice--france', { y: 24, opacity: 0, duration: 0.45 }, '-=0.1');
				from('.camp__choice--britain', { y: 24, opacity: 0, duration: 0.45 }, '<');
				from('.camp__emblem', { scale: 0.8, opacity: 0, duration: 0.35 }, '-=0.25', 0.06);
				break;
			case 'placement':
				from('.sb-placement__map', { y: 16, opacity: 0, duration: 0.4 });
				from('.sb-tray', { y: 20, opacity: 0, duration: 0.35 }, '-=0.15');
				from('.sb-troop', { scale: 0.85, opacity: 0, duration: 0.25 }, '-=0.2', 0.06);
				break;
			case 'battle':
				from('.turn-banner', { y: -20, opacity: 0, duration: 0.3 });
				from('.enemy-pane, .my-map', { y: 16, opacity: 0, duration: 0.4 }, '-=0.1', 0.12);
				from('.tracker', { opacity: 0, duration: 0.25 }, '-=0.2');
				break;
			case 'end':
				from('.end-title', { scale: 1.25, opacity: 0, duration: 0.4, ease: 'back.out(1.6)' });
				from('.player-stats', { y: 14, opacity: 0, duration: 0.3 }, '-=0.1', 0.1);
				from('.end-map', { y: 14, opacity: 0, duration: 0.3 }, '-=0.1', 0.1);
				for (const dd of all('.player-stats dd')) countUp(dd, tl);
				break;
		}
	});
}

const SCREEN_FADE: Record<Screen, string> = {
	home: '.home__title, .home__pitch, .home__play',
	camp: '.camp__choice',
	placement: '.sb-placement__map, .sb-tray',
	battle: '.turn-banner, .enemy-map, .my-map',
	end: '.end-title, .player-stats, .end-map'
};

/** Animate the first number in a stat element (keeps suffix such as "%" or "/3"). */
function countUp(el: Element, tl: gsap.core.Timeline) {
	const text = el.textContent ?? '';
	const m = text.match(/^(\d+(?:[.,]\d+)?)(.*)$/);
	if (!m) return;
	const decimals = (m[1].split(/[.,]/)[1] ?? '').length;
	const sep = m[1].includes(',') ? ',' : '.';
	const target = parseFloat(m[1].replace(',', '.'));
	if (!target) return;
	const state = { p: 0 };
	tl.to(state, {
		p: 1,
		duration: 0.5,
		ease: 'power1.out',
		onUpdate: () => {
			el.textContent = countValue(target, state.p, decimals).toFixed(decimals).replace('.', sep) + m[2];
		},
		onComplete: () => {
			el.textContent = text;
		}
	}, 0.35);
}

export function shotImpact(root: Element, shot: Shot, side: MapSide, reduced = false): Kill {
	const wrap = root.querySelector(MAP_SELECTOR[side]);
	const path = wrap?.querySelector<SVGGraphicsElement>(stateSelector(shot.target));
	if (!wrap || !path) return noop;
	const plan = impactPlan(shot.outcome, shot.near, reduced);
	const els: Element[] = [];
	const tweens: gsap.core.Tween[] = [];

	if (reduced) {
		tweens.push(gsap.fromTo(path, { opacity: 0.4 }, { opacity: 1, duration: 0.15, clearProps: 'opacity' }));
	} else {
		if (plan.pulse) {
			gsap.set(path, { transformBox: 'fill-box', transformOrigin: 'center' });
			tweens.push(
				gsap.fromTo(path, { scale: 1.18 }, { scale: 1, duration: 0.4, ease: 'elastic.out(1,0.5)', clearProps: 'transform,transformBox,transformOrigin' })
			);
		}
		const svg = path.ownerSVGElement;
		if (plan.ripple && svg) {
			const b = path.getBBox();
			const c = document.createElementNS(SVG_NS, 'circle');
			c.setAttribute('cx', String(b.x + b.width / 2));
			c.setAttribute('cy', String(b.y + b.height / 2));
			c.setAttribute('r', String(Math.max(6, Math.min(b.width, b.height) / 2)));
			c.setAttribute('fill', 'none');
			c.setAttribute('stroke', plan.kind === 'near' ? '#f0b44c' : '#ffffff');
			c.setAttribute('stroke-width', plan.kind === 'near' ? '3' : '4');
			c.setAttribute('pointer-events', 'none');
			c.setAttribute('aria-hidden', 'true');
			c.style.transformBox = 'fill-box';
			c.style.transformOrigin = 'center';
			svg.appendChild(c);
			els.push(c);
			tweens.push(
				gsap.fromTo(c, { scale: 0.4, opacity: 0.9 }, { scale: plan.kind === 'near' ? 2 : 3, opacity: 0, duration: 0.45, ease: 'power2.out', onComplete: () => c.remove() })
			);
		}
		if (plan.shake) {
			tweens.push(gsap.fromTo(wrap, { x: 0 }, { x: 0, duration: 0.3, ease: 'none', keyframes: { x: [-6, 6, -4, 4, -2, 0] }, clearProps: 'transform' }));
		}
	}
	return () => {
		for (const t of tweens) t.revert();
		for (const e of els) e.remove();
	};
}

/** Flash the given cells one after another on a map wrapper. */
export function troopUnmasked(root: Element, cells: readonly StateId[], side: MapSide, reduced = false): Kill {
	const wrap = root.querySelector(MAP_SELECTOR[side]);
	if (!wrap) return noop;
	const paths = cells
		.map((id) => wrap.querySelector<SVGGraphicsElement>(stateSelector(id)))
		.filter((p): p is SVGGraphicsElement => !!p);
	if (!paths.length) return noop;
	const tl = gsap.timeline();
	paths.forEach((p, i) => {
		tl.fromTo(
			p,
			{ opacity: reduced ? 0.4 : 0.2 },
			{ opacity: 1, duration: reduced ? 0.15 : 0.18, clearProps: 'opacity' },
			reduced ? 0 : i * 0.1
		);
	});
	return () => {
		tl.revert();
	};
}

export function turnChange(root: Element, reduced = false): Kill {
	const els = q(root, '.turn-banner .banner-title, .last-outcome');
	if (!els.length) return noop;
	const t = reduced
		? gsap.fromTo(els, { opacity: 0 }, { opacity: 1, duration: 0.15, clearProps: 'opacity' })
		: gsap.fromTo(els, { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out', clearProps: 'transform,opacity' });
	return () => {
		t.revert();
	};
}

export function passCover(root: Element, reduced = false): Kill {
	const els = q(root, '.sb-pass');
	if (!els.length) return noop;
	const t = gsap.fromTo(els, { opacity: 0 }, { opacity: 1, duration: duration(0.25, reduced), clearProps: 'opacity' });
	return () => {
		t.revert();
	};
}
