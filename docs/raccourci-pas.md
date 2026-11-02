# Envoyer mes pas depuis l'iPhone (V2)

## 1. Créer le jeton

Dans le Dojo : **Moi → Raccourci des pas → Créer un jeton pour les pas**.
Le jeton (`dojo_…`) s'affiche **une seule fois** : je le copie tout de suite dans le raccourci.
« Remplacer le jeton » ou « Révoquer » coupe l'ancien immédiatement.

## 2. Le raccourci « Dojo – Pas » (app Raccourcis)

1. **Rechercher des échantillons de santé** : Nombre de pas, date « aujourd'hui », regrouper par **jour**.
2. **Calculer les statistiques** : Somme (si besoin).
3. **Date actuelle**, puis **Formater la date** : format personnalisé `yyyy-MM-dd`.
4. **Obtenir le contenu de l'URL** :
   - URL : `https://<mon-domaine>/api/integrations/steps`
   - Méthode : **POST**
   - En-têtes : `Authorization` = `Bearer dojo_…` (mon jeton)
   - Corps : **JSON** — `date` = la date formatée, `steps` = la somme (nombre).
5. Automatisation → Nouvelle → « Heure de la journée », 21 h 30, tous les jours → exécuter « Dojo – Pas » → **Exécuter immédiatement**.

Réponse attendue : `{"ok":true,"day":12,"status":"held"}` (`held` = objectif atteint, `logged` = enregistré sous l'objectif, sans reproche).

## 3. Tester sans l'iPhone (faux jeton → réponse 401)

```bash
curl -i -X POST "https://<mon-domaine>/api/integrations/steps" \
  -H "Authorization: Bearer dojo_FAUX_JETON_POUR_TEST" \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-11-02","steps":9123}'
```

- `401 Jeton invalide.` → la route répond, le jeton est refusé (normal avec un faux jeton).
- `429` → plus de 10 envois dans l'heure.
- `400` → date ou nombre de pas invalides (date acceptée : aujourd'hui ou les 7 derniers jours).

L'objectif de pas se règle dans **Moi → Réglages → Objectif de pas**.
