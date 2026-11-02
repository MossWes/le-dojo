// Every user-facing text lives here, in French.
// Typography: non-breaking space ( ) before « : ; ! ? » and inside « ».
const nb = ' ';

export const labels = {
	appName: 'Le Dojo',
	myWay: 'Ma Voie',
	way: 'Je mène les miens vers la liberté sans jamais les mettre en danger, en me battant d’abord contre qui j’étais hier.',
	adinkraCredit: `Icônes Adinkra${nb}: Adinkra Icons, licence Apache 2.0`,

	tabs: {
		today: 'Aujourd’hui',
		missions: 'Missions',
		quests: 'Quêtes',
		library: 'Bibliothèque',
		me: 'Moi'
	},
	comingSoon: (step: number) => `À venir (étape ${step}).`,
	back: 'Retour',

	today: {
		missionS: 'Mission S',
		due: (label: string) => `Échéance${nb}: ${label}`,
		readingTitle: 'Lecture du jour',
		phaseToUpdate: 'Phase à mettre à jour',
		mantra: 'Mantra',
		action: 'Action du jour',
		toMission: 'En faire une mission',
		addedToMissions: 'Ajoutée à mes missions du jour.',
		listen: 'Écouter',
		pause: 'Pause',
		resume: 'Reprendre',
		nextReading: 'Lecture suivante',
		readMore: 'Lire la suite',
		readLess: 'Replier',
		myMissions: 'Mes missions du jour',
		noMission: 'Rien de prévu aujourd’hui.',
		addMission: '+ Mission',
		newMissionPlaceholder: 'Ma mission',
		add: 'Ajouter',
		cancel: 'Annuler',
		testQuestion: `Je garde, j’ajuste ou j’arrête${nb}?`,
		myQuests: 'Mes quêtes du jour',
		dayOf: (n: number, total: number | null) => (total ? `Jour ${n} / ${total}` : `Jour ${n}`),
		held: 'Tenu',
		slip: 'Incartade',
		slipNote: 'Une note, si je veux.',
		slipSave: 'Noter',
		slipDone: 'Noté. Demain, je reprends.',
		heldDone: 'Tenu.',
		missing: (n: number) => (n === 1 ? '1 jour passé sans réponse.' : `${n} jours passés sans réponse.`),
		backfill: 'Rattraper les jours passés',
		backfillConfirm: (n: number) => `Je marque ${n === 1 ? 'ce jour' : `ces ${n} jours`} comme tenus${nb}?`,
		yes: 'Oui',
		no: 'Non',
		myRituals: 'Mes rituels',
		rituals: { reading: 'Lecture', oath: 'Serment', evening_review: 'Bilan' },
		evening: 'Le soir',
		myOath: 'Mon serment',
		myReview: 'Mon bilan du soir',
		morningContinue: 'Continuer',
		newGrade: (name: string) => `Nouveau grade${nb}: ${name}. Je me bats contre qui j’étais hier.`,
		xpOf: 'XP'
	},

	oath: {
		title: 'Mon serment',
		said: 'Je l’ai dit',
		done: 'Serment tenu pour aujourd’hui.'
	},

	pillars: {
		musashi: 'Musashi',
		tolteques: 'Accords toltèques',
		'sun-tzu': 'Sun Tzu',
		stoicisme: 'Stoïcisme',
		bushido: 'Bushido'
	} as Record<string, string>,

	errors: {
		offline: 'Pas de réseau. Je peux lire, mais pas enregistrer pour l’instant.',
		generic: 'Ça n’a pas marché. Je réessaie dans un instant.'
	}
} as const;
