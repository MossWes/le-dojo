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

	missions: {
		title: 'Mes missions',
		views: { todo: 'À faire', reserve: 'En réserve', tests: 'Tests', done: 'Faites' },
		allRanks: 'Tous',
		allFronts: 'Tous les fronts',
		rankGroup: (rank: string) => `Rang ${rank}`,
		empty: 'Aucune mission ici.',
		newMission: '+ Mission',
		newTitle: 'Nouvelle mission',
		newSub: 'Nouvelle sous-mission',
		subOf: (title: string) => `Sous-mission de ${nb}« ${title}${nb}»`,
		dropped: 'Abandonnée',
		reserveCondition: (c: string) => `Condition de départ${nb}: ${c}`,
		review: (label: string) => `Bilan${nb}: ${label}`,
		testBadge: 'Test',
		fields: {
			title: 'Titre',
			rank: 'Rang',
			front: 'Front',
			noFront: 'Aucun front',
			frontReserve: (name: string) => `${name} (en réserve)`,
			dueDate: 'Échéance',
			plannedDate: 'Jour prévu',
			notes: 'Notes',
			isTest: 'C’est un test (une voie testée à petit coût)',
			reviewDate: 'Date de bilan',
			startCondition: 'Condition de départ'
		},
		clearDate: 'Effacer',
		save: 'Enregistrer',
		saved: 'Enregistré.',
		create: 'Créer la mission',
		actions: {
			done: 'Faite',
			undo: 'À refaire',
			reserve: 'En réserve',
			reserveConfirm: 'Mettre en réserve',
			resume: 'Reprendre',
			drop: 'Abandonner',
			dropConfirm: `J’abandonne cette mission${nb}? Je ne perds aucune expérience.`,
			delete: 'Supprimer',
			deleteConfirm: `Je supprime définitivement cette mission${nb}?`,
			deleteSubs: (n: number) => (n === 1 ? ' Sa sous-mission sera supprimée aussi.' : ` Ses ${n} sous-missions seront supprimées aussi.`)
		},
		doneGain: (xp: number) => `Faite. +${xp}${nb}XP`,
		status: { todo: 'À faire', doing: 'En cours', done: 'Faite', dropped: 'Abandonnée', reserve: 'En réserve' },
		subMissions: 'Sous-missions',
		addSub: '+ Sous-mission',
		parent: 'Mission principale'
	},

	quests: {
		title: 'Mes quêtes',
		active: 'En cours',
		finished: 'Terminées',
		none: 'Aucune quête.',
		day: 'Jour',
		of: (n: number | null) => (n ? `sur ${n}` : ''),
		held: (n: number) => `${n} tenu${n > 1 ? 's' : ''}`,
		slips: (n: number) => `${n} incartade${n > 1 ? 's' : ''}`,
		milestones: 'Paliers',
		milestone: (day: number, xp: number) => `Jour ${day} · +${xp}${nb}XP`,
		calendar: 'Calendrier',
		legend: { held: 'Tenu', slip: 'Incartade', empty: 'Sans réponse', future: 'À venir' },
		ends: (label: string) => `Fin${nb}: ${label}`,
		over: 'Quête terminée.',
		editDay: (n: number, label: string) => `Jour ${n} · ${label}`,
		close: 'Fermer'
	},

	review: {
		title: 'Mon bilan du soir',
		questionOfDay: 'La question de ma lecture',
		q1: `Qu’ai-je bien fait aujourd’hui${nb}?`,
		q2a: `Où ai-je manqué à un principe${nb}?`,
		q2b: `Qu’est-ce que je corrige demain${nb}?`,
		q3: `Ai-je gardé ma parole, envers les autres et envers moi${nb}?`,
		keptWord: { oui: 'Oui', en_partie: 'En partie', non: 'Non' },
		keptShort: (answer: string) => `Ma parole${nb}: ${answer}`,
		energy: 'Mon énergie (facultatif)',
		footer: 'Sans me juger, comme un comptable honnête.',
		save: 'Enregistrer mon bilan',
		saved: 'Bilan enregistré.',
		history: 'Mes bilans',
		none: 'Aucun bilan pour l’instant.',
		edit: 'Modifier',
		of: (label: string) => `Bilan du ${label}`
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
