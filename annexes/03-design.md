# Annexe 3 — Le design

Référence visuelle : `assets/reference/Le_Dojo_Livret1_Terre_P1_La_Voie.pdf`. L'app doit donner la même impression : encre sombre, texte parchemin, filets or, un seul accent rouge, beaucoup d'air.

## 1. Couleurs (thème sombre uniquement)

```css
:root {
  --ink: #15110d;          /* fond principal */
  --ink-raised: #1e1813;   /* cartes */
  --ink-sunken: #0e0b08;   /* barre d'onglets, champs */
  --parch: #ecdfc3;        /* texte principal */
  --parch-soft: #c9b993;   /* texte secondaire, italiques */
  --dim: #9a8b6d;          /* métadonnées, libellés */
  --gold: #c8a25a;         /* filets, icônes, titres de section */
  --gold-bright: #f3dca6;  /* élément actif */
  --red: #b3412e;          /* rang S, mission S, accent unique */
  --line: rgba(200, 162, 90, 0.35);
  --line-soft: rgba(200, 162, 90, 0.18);
  --ok: #8fa86a;           /* confirmation discrète, rarement */
}
body { background: radial-gradient(ellipse at 50% 0%, #2a2119 0%, var(--ink) 55%) fixed, var(--ink); }
```

Contraste : le texte `--parch` sur `--ink` dépasse 12:1. Ne jamais mettre de texte `--dim` en dessous de 14 px.

## 2. Typographie

- **Lora** (licence SIL OFL), hébergée localement (paquet `@fontsource/lora` ou fichiers woff2) : graisses 400, 600, italique 400.
- Corps : 17 px, interligne 1,5. Petit texte : 14 px minimum.
- Titres d'écran : 26 px, graisse 600.
- Surtitres : 11 px, petites capitales, espacement 0,25 em, couleur `--gold`.
- Mantra : 20 px, italique, couleur `#f6ead0`.
- Typographie française : espace insécable avant `: ; ! ?` et à l'intérieur des guillemets « ».

## 3. Icônes

- Les 6 symboles Adinkra de `assets/icons/` (SVG 24 × 24, remplissage `currentColor`) :

| Fichier | Symbole | Sens | Usage |
| --- | --- | --- | --- |
| `fawohodie.svg` | Fawohodie | l'indépendance | sceau du Dojo, icône de l'app, onglet Moi |
| `asase-ye-duru.svg` | Asase Ye Duru | la terre a du poids | Livret 1 Terre, onglet Aujourd'hui |
| `nkyinkyim.svg` | Nkyinkyim | le chemin sinueux | Livret 2 Eau, onglet Quêtes |
| `mframadan.svg` | Mframadan | la maison qui résiste au vent | Livret 3 Vent |
| `hye-won-hye.svg` | Hye Wo Nhye | ce qui ne brûle pas | Livret 4 Feu, onglet Missions |
| `sankofa-two.svg` | Sankofa | retourne chercher ce que tu as appris | Livret 5 Vide, onglet Bibliothèque |

- Pour les icônes utilitaires (cocher, plus, lecture, pause, réglages), utilise un jeu au trait fin, local (par exemple Lucide), en `--gold` ou `--parch-soft`.
- La licence Apache 2.0 des icônes Adinkra doit être conservée : copie `LICENSE-adinkra-icons` dans le dépôt et mentionne-la dans l'écran Réglages (« Icônes Adinkra : Adinkra Icons, licence Apache 2.0 »).
- **Aucun caractère japonais ou chinois dans l'interface.**

## 4. Icône de l'app (iOS)

Médaille Fawohodie : disque or en dégradé (`#dcb86c` → `#a9843f` → `#7a5d29`), symbole en `#1b150f`, sur fond `--ink`. Formats : 180 × 180 (`apple-touch-icon`), 192 et 512 (manifeste), version masquable.

## 5. Composants

- **Carte** : fond `--ink-raised`, filet 1 px `--line-soft`, rayon 4 px (angles presque droits), marge interne 16 px.
- **Pastilles de rang** (carré de 24 px, lettre centrée en 600) :
  - S : fond `--red`, lettre `#f6ead0` ;
  - A : fond `--gold`, lettre `--ink` ;
  - B : contour `--gold`, lettre `--gold` ;
  - C : contour `--parch-soft`, lettre `--parch-soft` ;
  - D : contour `--dim`, lettre `--dim`.
- **Bouton principal** : fond `--gold`, texte `--ink`, rayon 4 px, hauteur 48 px.
- **Bouton secondaire** : contour `--line`, texte `--parch`.
- **Case à cocher** : carré de 22 px, contour `--gold` ; cochée = fond `--gold` et coche `--ink`.
- **Séparateur** : filet `--line` avec un petit losange or au centre, comme dans le PDF.
- **Mantra** : encadré, fond `rgba(179, 65, 46, 0.16)`, filet `rgba(179, 65, 46, 0.55)`, surtitre « MANTRA » en rouge.
- **Barre d'onglets** : fond `--ink-sunken`, filet supérieur `--line-soft`, onglet actif en `--gold-bright` avec un fin trait au-dessus.

## 6. Mouvement

Transitions courtes (150 ms, fondu ou glissement léger). Aucune animation en boucle. Respect de `prefers-reduced-motion`. Pas de son, pas de vibration.
