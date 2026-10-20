/**
 * Every visible string of the game. Screens import keys from here and never
 * hard-code copy. Copy marked `2023` comes from the Nuxt version.
 */
export const fr = {
	meta: {
		title: 'States Battle',
		description:
			"La France et la Grande-Bretagne cachent leurs troupes sur le territoire américain. Démasque celles de l'ennemi en premier."
	},
	home: {
		title: 'States Battle',
		// 2023
		pitch:
			"Au XVIIIe siècle, la France et la Grande-Bretagne s'arrachent les territoires à conquérir. À toi de choisir ton camp pour aider ton pays à démasquer les troupes ennemies sur le territoire américain.",
		play: 'Jouer',
		rules: 'Règles',
		modeAi: "Contre l'ordinateur",
		modeLocal: 'À deux, même écran',
		level: { easy: 'Facile', normal: 'Normal', hard: 'Difficile' },
		modeLabel: 'Mode de jeu',
		levelLabel: "Niveau de l'ordinateur"
	},
	camp: {
		// 2023
		title: 'Prends position',
		france: 'France',
		britain: 'Grande-Bretagne',
		back: "Retour à l'accueil"
	},
	rules: {
		title: 'Règles',
		close: 'Fermer',
		items: [
			'Chaque camp cache sur sa carte trois troupes de 1, 2 et 3 États.',
			'Une troupe occupe des États voisins, formant un seul bloc. Les troupes ne se chevauchent jamais.',
			'Tu tires à tour de rôle sur un État ennemi, jamais deux fois au même.',
			"Manqué : rien à cet endroit. « Troupe à proximité » signale qu'une troupe ennemie non touchée borde cet État.",
			'Touché : une case de troupe est atteinte. Démasquée : la troupe est entièrement touchée et révélée.',
			'Tu gagnes en démasquant les trois troupes ennemies en premier.',
			"Joue contre l'ordinateur, ou à deux sur le même écran en te passant l'appareil."
		]
	},
	placement: {
		// 2023
		title: 'Définis ta stratégie',
		// 2023
		intro:
			'Maintenant que tu as choisi ton camp, à toi de positionner ton armée de soldats sur le territoire américain.',
		// 2023 (reworded for one troop of each size)
		fleet: 'Tu disposes de trois troupes, comme ton adversaire.',
		troop: { 1: 'Éclaireur', 2: 'Détachement', 3: 'Régiment' },
		hint: 'Une troupe occupe des États voisins, formant un seul bloc.',
		auto: 'Placement automatique',
		undo: 'Annuler',
		reset: 'Recommencer',
		ready: 'Prêt au combat',
		errors: {
			'unknown-state': 'Cet État ne fait pas partie des territoires jouables.',
			'size-mismatch': "La troupe ne compte pas le bon nombre d'États.",
			'not-connected': 'Les États choisis doivent se toucher et former un seul bloc.',
			overlap: 'Un de ces États est déjà occupé par une autre troupe.',
			'size-taken': 'Tu as déjà placé une troupe de cette taille.',
			'fleet-full': 'Tes trois troupes sont déjà placées.'
		}
,
		mapLabel: 'Carte des États-Unis : place tes troupes',
		trayLabel: 'Tes troupes',
		status: 'Troupe de {size} : {n}/{size} États sélectionnés',
		placedStatus: 'Troupe de {size} placée.',
		allPlaced: 'Toutes tes troupes sont en place. Tu peux valider.',
		state: { todo: 'À placer', current: 'En cours', placed: 'Placée' },
		pick: 'Choisir',
		sizeStates: '{size} États',
		campLabel: 'Camp : {camp}',
		passTitle: "Passe l'appareil à {camp}",
		passText: "Place ta stratégie en secret : l'autre joueur ne doit pas regarder l'écran.",
		passCta: "C'est moi, je commence"
	},
	battle: {
		yourMap: 'Ta carte',
		enemyMap: 'Carte ennemie',
		yourTurn: 'À toi de tirer',
		enemyTurn: "Tour de l'adversaire",
		outcome: {
			miss: 'Manqué sur {state}.',
			near: 'Manqué sur {state}. Troupe à proximité.',
			hit: 'Touché sur {state} !',
			unmasked: 'Troupe démasquée sur {state} !'
		},
		log: 'Journal des tirs',
		campTurn: 'Au tour de : {camp}',
		thinking: "L'ennemi réfléchit",
		firePrompt: 'Choisis un État de la carte ennemie.',
		shotBy: { you: 'Toi', enemy: 'Ennemi' },
		troops: { enemy: 'Troupes ennemies', yours: 'Tes troupes', size: 'taille {n}', unmasked: 'démasquée', hidden: 'cachée' },
		turnN: 'Tour {n}',
		noShots: "Aucun tir pour l'instant.",
		passDeviceTitle: "Passe l'écran à {camp}",
		passDevice: "Passe l'appareil à ton adversaire.",
		passDeviceCta: "C'est à toi",
		startTitle: '{camp} commence',
		title: 'Bataille',
		handoffCta: "Passer l'appareil",
		tabs: 'Cartes'
	},
	end: {
		win: 'Victoire ! Tu as démasqué les trois troupes ennemies.',
		lose: "Défaite. L'ennemi a démasqué tes trois troupes.",
		stats: 'Bilan des tirs',
		winCamp: 'Victoire de {camp} !',
		statShots: 'Tirs',
		statHits: 'Touchés',
		statAccuracy: 'Précision',
		statUnmasked: 'Troupes démasquées',
		maps: 'Les deux cartes dévoilées',
		replay: 'Rejouer',
		home: "Retour à l'accueil"
	},
	credits: {
		text: "Conçu par Aurore Vigneron (design) et Rama Herbin (développement), à l'origine pendant un atelier D3.js aux Gobelins en 2023.",
		link: 'Voir le dépôt original de 2023'
	}
} as const;
