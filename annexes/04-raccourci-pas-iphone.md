# Annexe 4 — Envoyer mes pas depuis l'iPhone (V2)

Une app web ne peut pas lire l'app Santé. Le chemin prévu : un raccourci iPhone qui lit mes pas chaque soir et les envoie à mon serveur.

## 1. Côté serveur (Claude Code)

- Route `POST /api/integrations/steps`, corps `{ "date": "YYYY-MM-DD", "steps": 9123 }`.
- Authentification par en-tête `Authorization: Bearer <jeton>`. Le jeton est généré dans Réglages → « Créer un jeton pour les pas », affiché **une seule fois**, stocké haché. Bouton « Révoquer ».
- La route crée ou met à jour le `quest_log` du jour pour la quête `pas-quotidiens` (`value` = pas). `held` si `steps` ≥ `settings.steps_goal`, sinon `logged` : le jour est enregistré sans XP et sans reproche.
- Limitation : 10 appels par heure. Réponse `200 { "ok": true, "day": 63 }`.
- Teste la route avec `curl` et montre-moi la commande (avec un faux jeton).

## 2. Côté iPhone (moi, guidé par Claude Code)

Dans l'app **Raccourcis** :

1. Nouveau raccourci « Dojo – Pas ».
2. Action **Rechercher des échantillons de santé** : type « Nombre de pas », date « aujourd'hui », regroupement par jour, somme.
3. Action **Calculer les statistiques** : somme (si nécessaire).
4. Action **Date actuelle**, puis **Formater la date** au format personnalisé `yyyy-MM-dd`.
5. Action **Obtenir le contenu de l'URL** :
   - URL : `https://<mon-domaine>/api/integrations/steps`
   - Méthode : POST
   - En-têtes : `Authorization` = `Bearer <mon jeton>`
   - Corps : JSON, `date` = la date formatée, `steps` = la somme.
6. Onglet **Automatisation** → Nouvelle automatisation → « Heure de la journée », 21 h 30, tous les jours → exécuter « Dojo – Pas » → choisir « Exécuter immédiatement ».

Les intitulés exacts des actions peuvent varier selon la version d'iOS : Claude Code m'aidera à ajuster au moment du test.
