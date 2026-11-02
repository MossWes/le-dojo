// Text-to-speech with the device's French voice (Web Speech API, free and local).

export type VoicePrefs = { name: string | null; rate: number };

class Speech {
	state = $state<'idle' | 'speaking' | 'paused'>('idle');
	owner = $state<string | null>(null);

	get supported(): boolean {
		return typeof window !== 'undefined' && 'speechSynthesis' in window;
	}

	frenchVoices(): SpeechSynthesisVoice[] {
		if (!this.supported) return [];
		return speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('fr'));
	}

	private pickVoice(name: string | null): SpeechSynthesisVoice | undefined {
		const voices = this.frenchVoices();
		return voices.find((v) => v.name === name) ?? voices.find((v) => v.lang === 'fr-FR') ?? voices[0];
	}

	/** Reads `text`. `owner` identifies which button started it; `onEnd` runs only if read to the end. */
	speak(owner: string, text: string, prefs: VoicePrefs, onEnd?: () => void): void {
		if (!this.supported) return;
		speechSynthesis.cancel();
		const u = new SpeechSynthesisUtterance(text);
		u.lang = 'fr-FR';
		u.rate = prefs.rate;
		const voice = this.pickVoice(prefs.name);
		if (voice) u.voice = voice;
		u.onend = () => {
			if (this.owner !== owner) return;
			this.state = 'idle';
			this.owner = null;
			onEnd?.();
		};
		u.onerror = () => {
			if (this.owner !== owner) return;
			this.state = 'idle';
			this.owner = null;
		};
		this.owner = owner;
		this.state = 'speaking';
		speechSynthesis.speak(u);
	}

	pause(): void {
		if (!this.supported) return;
		speechSynthesis.pause();
		this.state = 'paused';
	}

	resume(): void {
		if (!this.supported) return;
		speechSynthesis.resume();
		this.state = 'speaking';
	}

	stop(): void {
		if (!this.supported) return;
		this.owner = null;
		this.state = 'idle';
		speechSynthesis.cancel();
	}
}

export const speech = new Speech();
