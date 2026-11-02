// Prints a new pair of Web Push keys to paste into .env (on the server only):
//   docker compose run --rm --no-deps app node build/cli/generate-vapid.js
import { generateVapidKeys } from '../lib/server/push';

const keys = generateVapidKeys();
console.log('Lignes à ajouter dans /opt/le-dojo/.env, puis : docker compose up -d');
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log('VAPID_SUBJECT=mailto:mon-adresse@exemple.fr');
