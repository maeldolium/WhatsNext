type Theme = "light" | "dark" | "auto";

export function mountTheme(): void {
	const inputs = document.querySelectorAll<HTMLInputElement>('.theme-switch__input[name="theme"]');

	function applyTheme(theme: Theme): void {
		// En auto, on laisse le CSS suivre le thème du système.
		if (theme === "auto") {
			delete document.documentElement.dataset.theme;
		} else {
			document.documentElement.dataset.theme = theme;
		}

		inputs.forEach((input) => {
			input.checked = input.value === theme;
		});
	}

	// On récupère le dernier choix, sinon on reste en auto.
	const saved = localStorage.getItem("watchlist-theme");
	const initial: Theme = saved === "light" || saved === "dark" ? saved : "auto";

	applyTheme(initial);

	inputs.forEach((input) => {
		input.addEventListener("change", () => {
			const theme = input.value;

			if (theme !== "light" && theme !== "dark" && theme !== "auto") {
				return;
			}

			// On garde le choix pour les prochaines visites.
			applyTheme(theme);
			localStorage.setItem("watchlist-theme", theme);
		});
	});
}
