// Sets the account password, typed by me (hidden). Run on the server:
//   docker compose exec app node build/cli/create-user.js
// Running it again changes the password and signs out every device.
import { openDatabase } from '../lib/server/db/client';
import { MIN_PASSWORD_LENGTH, setPassword } from '../lib/server/auth-core';

function ask(question: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const input = process.stdin;
		process.stdout.write(question);
		if (!input.isTTY) {
			// Piped input (tests): read one line.
			let data = '';
			input.setEncoding('utf8');
			const onData = (chunk: string) => {
				data += chunk;
				const nl = data.indexOf('\n');
				if (nl >= 0) {
					input.off('data', onData);
					input.pause();
					process.stdout.write('\n');
					resolve(data.slice(0, nl).replace(/\r$/, ''));
					data = data.slice(nl + 1);
					input.unshift(data);
				}
			};
			input.on('data', onData);
			input.resume();
			return;
		}
		let value = '';
		input.setRawMode(true);
		input.setEncoding('utf8');
		input.resume();
		const onKey = (key: string) => {
			for (const ch of key) {
				if (ch === '\u0003') {
					input.setRawMode(false);
					process.stdout.write('\n');
					reject(new Error('Annulé.'));
					return;
				}
				if (ch === '\r' || ch === '\n') {
					input.setRawMode(false);
					input.pause();
					input.off('data', onKey);
					process.stdout.write('\n');
					resolve(value);
					return;
				}
				if (ch === '\u007f' || ch === '\b') {
					if (value.length) {
						value = value.slice(0, -1);
						process.stdout.write('\b \b');
					}
				} else {
					value += ch;
					process.stdout.write('*');
				}
			}
		};
		input.on('data', onKey);
	});
}

const { db, sqlite } = openDatabase(process.env.DATABASE_PATH ?? './data/dojo.sqlite');
try {
	console.log(`Mot de passe du Dojo (${MIN_PASSWORD_LENGTH} caractères minimum, saisie masquée).`);
	const first = await ask('Mot de passe : ');
	const second = await ask('Encore une fois : ');
	if (first !== second) throw new Error('Les deux saisies sont différentes. Rien n’a changé.');
	await setPassword(db, first);
	console.log('Mot de passe enregistré. Les autres appareils sont déconnectés.');
} catch (e) {
	console.error((e as Error).message);
	process.exitCode = 1;
} finally {
	sqlite.close();
}
