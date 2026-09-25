// Délai maximum d'une requête. Sans lui, un serveur qui ne répond pas laisse
// « Chargement… » affiché jusqu'à ce que le navigateur abandonne (plusieurs minutes).
const TIMEOUT_MS = 10_000;

/** Les causes d'échec qu'on sait distinguer, chacune avec son message pour l'utilisateur */
export type ApiErrorKind =
	| "missing_key"
	| "invalid_key"
	| "rate_limited"
	| "timeout"
	| "network"
	| "server";

const ERROR_MESSAGES: Record<ApiErrorKind, string> = {
	missing_key: "Clé API manquante : vérifie ton fichier .env, puis relance le serveur.",
	invalid_key: "Clé API refusée : vérifie la valeur dans ton fichier .env.",
	rate_limited: "Trop de requêtes envoyées, réessaie dans un instant.",
	timeout: "Le service met trop de temps à répondre, réessaie plus tard.",
	network: "Impossible de joindre le service : vérifie ta connexion internet.",
	server: "Le service est indisponible pour le moment, réessaie plus tard.",
};

/** Erreur d'appel à une API externe, avec sa cause (`kind`) */
export class ApiError extends Error {
	readonly kind: ApiErrorKind;

	constructor(kind: ApiErrorKind, detail: string) {
		super(detail);
		this.name = "ApiError";
		this.kind = kind;
	}
}

/**
 * Message à afficher à l'utilisateur pour une erreur attrapée dans un catch.
 * Une erreur inattendue (bug dans notre code) reçoit le message générique.
 */
export function getErrorMessage(error: unknown): string {
	return ERROR_MESSAGES[error instanceof ApiError ? error.kind : "server"];
}

/**
 * Vérifie qu'une clé API est renseignée. Les API répondent 401 aussi bien pour une
 * clé absente que pour une clé fausse : on repère donc l'absence avant la requête.
 * Une variable absente du .env vaut undefined, une variable vide vaut "".
 */
export function requireApiKey(key: string | undefined, name: string): string {
	if (!key) throw new ApiError("missing_key", `${name} absente du fichier .env`);
	return key;
}

function kindFromStatus(status: number): ApiErrorKind {
	if (status === 401 || status === 403) return "invalid_key";
	if (status === 429) return "rate_limited";
	return "server";
}

/**
 * Fait une requête GET et renvoie le corps JSON typé en T.
 * Partagée par les clients TMDB et RAWG. Toute erreur est une ApiError.
 */
export async function fetchJson<T>(url: string): Promise<T> {
	let response: Response;
	try {
		response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
	} catch (error) {
		// fetch() rejette si la requête n'aboutit pas : délai dépassé (TimeoutError,
		// déclenché par le signal ci-dessus) ou problème réseau (hors ligne, DNS…)
		if (error instanceof DOMException && error.name === "TimeoutError") {
			throw new ApiError("timeout", `Pas de réponse après ${TIMEOUT_MS / 1000} s`);
		}
		throw new ApiError("network", String(error));
	}

	// Une réponse 401, 404 ou 500 ne fait pas rejeter fetch() : elle est considérée
	// comme « réussie ». On vérifie donc response.ok nous-mêmes.
	if (!response.ok) {
		throw new ApiError(kindFromStatus(response.status), `Erreur API (${response.status})`);
	}

	try {
		// Le "as" ne vérifie rien à l'exécution : on fait confiance à l'API
		// pour renvoyer la forme décrite par T.
		return (await response.json()) as T;
	} catch {
		throw new ApiError("server", "Réponse illisible (JSON invalide)");
	}
}
