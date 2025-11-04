declare global {
	interface Window {
		SC: {
			Widget: {
				Events: {
					READY: string;
					PLAY: string;
					PAUSE: string;
					PLAY_PROGRESS: string;
					SEEK: string;
					FINISH: string;
					ERROR: string;
				};
			} & ((iframe: HTMLIFrameElement) => {
				bind: (event: string, callback: (data: unknown) => void) => void;
				unbind: (event: string) => void;
				getPosition: (callback: (position: number) => void) => void;
				getDuration: (callback: (duration: number) => void) => void;
				seekTo: (position: number) => void;
				play: () => void;
				pause: () => void;
				toggle: () => void;
				skip: (index: number) => void;
				getSounds: (callback: (sounds: any[]) => void) => void;
			});
		};
		onSoundCloudReady: () => void;
	}
}

export {};
