# Annexe 2 — Les écrans

Navigation : une barre d'onglets fixe en bas, cinq onglets, toujours dans le même ordre.

| Onglet | Icône | Écran |
| --- | --- | --- |
| Aujourd'hui | Asase Ye Duru | l'écran du jour |
| Missions | Hye Wo Nhye | mes missions |
| Quêtes | Nkyinkyim | mes défis |
| Bibliothèque | Sankofa | livrets et lectures |
| Moi | Fawohodie | progression, bilans, réglages |

Largeur de référence : 390 px (iPhone). Zones tactiles d'au moins 44 × 44 px. Respect des zones sûres iOS (`env(safe-area-inset-*)`).

---

## 1. Aujourd'hui

De haut en bas :

1. **En-tête** : « Lundi 2 novembre » ; à droite, le grade (« Aspirant ») et une fine barre d'XP vers le grade suivant (« 120 / 300 »).
2. **Bandeau de la mission S** (si elle existe) : liseré rouge, « Mission S » + titre + échéance. Toucher → détail de la mission.
3. **Carte « Lecture du jour »** :
   - pilier et source en petites capitales or (« ÉPICTÈTE · MANUEL, I ») ;
   - titre ;
   - citation en italique si `quote` existe (repliable si plus de 4 lignes) ;
   - ma traduction au je ;
   - le **mantra** en grand, encadré ;
   - l'**action du jour**, avec un bouton « En faire une mission » ;
   - boutons : « Écouter » (lit titre + traduction + mantra), « Lecture suivante ».
   - Le rituel « lecture » est validé quand j'ouvre la carte plus de 10 secondes ou que j'écoute jusqu'au bout.
4. **Mes missions du jour** : liste avec case à cocher, pastille de rang, front en petit. Cocher → l'XP gagnée s'affiche 2 secondes à côté (« +50 »), sans animation envahissante. Bouton « + Mission ».
5. **Mes quêtes du jour** : une ligne par quête active. « Défi des 100 jours · Jour 63 / 100 » avec deux boutons : « Tenu » et « Incartade » (l'incartade ouvre une note facultative ; message : « Noté. Demain, je reprends. »).
6. **Mes rituels** : trois pastilles qui se remplissent dans la journée : Lecture · Serment · Bilan.
7. **Bloc du soir** (visible entre `ritual_evening_start` et minuit, en haut de l'écran pendant ce créneau) : boutons « Mon serment » et « Mon bilan du soir ».

**Le matin** (`ritual_morning_mode = mantra_only`) : à l'ouverture avant 8 h, le mantra du jour s'affiche seul, en plein écran, avec « Écouter » et « Continuer ».

## 2. Le serment

Plein écran, fond encre, texte du serment ligne par ligne (`seed/serment.json`). Bouton « Écouter » (voix ralentie à 0,9) et bouton « Je l'ai dit », qui valide le rituel.

## 3. Le bilan du soir

Trois champs de texte courts (`did_well`, `missed_principle` + `fix_tomorrow`, `kept_word` en trois boutons Oui / En partie / Non) et une énergie facultative de 1 à 5. En bas, rappel discret : « Sans me juger, comme un comptable honnête. » Historique accessible depuis l'onglet Moi.

## 4. Missions

- **Filtres en haut** : par rang (S, A, B, C, D), par front, par statut (À faire, En réserve, Tests, Faites).
- **Groupement par défaut** : par rang, S en premier.
- **Carte de mission** : pastille de rang, titre, front, échéance (en rouge discret si dépassée, sans reproche), icône « test » le cas échéant.
- **Fiche de mission** : tous les champs de l'annexe 1 ; actions : Faite, En réserve (demande la condition de départ), Abandonner (confirmation), Supprimer (confirmation).
- **Section Réserve** : chaque mission affiche sa condition de départ (« Quand ma société me rapporte mon plancher trois mois de suite »).
- **Section Tests** : chaque test affiche sa date de bilan ; le jour venu, il remonte dans « Mes missions du jour » avec la question « Je garde, j'ajuste ou j'arrête ? ».

## 5. Quêtes

- Liste des quêtes actives puis terminées.
- **Fiche de quête** : grand numéro du jour, barre de progression, paliers (30, 50, 75, 100) marqués sur la barre, calendrier en grille (un carré par jour : or = tenu, contour rouge = incartade, vide = à venir). Toucher un jour → le modifier.
- Bouton « Rattraper les jours passés » visible tant qu'il existe des jours sans log avant aujourd'hui.

## 6. Bibliothèque

- **Mes livrets** : les cinq anneaux avec leur symbole ; ceux qui n'existent pas encore sont grisés (« À venir »). Toucher → le PDF dans une visionneuse intégrée, disponible hors ligne.
- **Lectures de la phase** : liste de la phase en cours, puis des phases passées.
- **Secours** : sept gros boutons : Colère, Doute, Fatigue, Peur d'échouer, Famille, Tentation, Attente. Toucher → une lecture de secours correspondante (aléatoire parmi celles qui portent l'étiquette), avec « Écouter ».

## 7. Moi

- **Ma progression** : grade, symbole, XP total, seuil suivant, liste des grades avec le mien en surbrillance, historique des 30 derniers jours d'XP.
- **Ma Voie** : la phrase de Voie et mes cinq lignes rouges (lecture seule en V1).
- **Mes bilans** : liste par date.
- **Réglages** : horaires, mode du matin, voix (liste des voix françaises disponibles avec bouton « Tester »), vitesse, objectif de pas, export JSON, déconnexion.

## 8. Connexion

Fond encre, médaille Fawohodie, « Le Dojo », champ mot de passe, bouton « Entrer ». Message d'erreur neutre : « Mot de passe incorrect. »
