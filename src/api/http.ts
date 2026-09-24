/**
 * Fait une requête GET et renvoie le corps JSON typé en T.
 * Partagée par les clients TMDB et RAWG.
 *
 * fetch() ne rejette la promesse qu'en cas d'erreur réseau : une réponse
 * 401, 404 ou 500 est considérée comme « réussie ». On vérifie donc
 * response.ok nous-mêmes pour transformer ces cas en erreur.
 */
export async function fetchJson<T>(url: string): Promise<T> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Erreur API (${response.status})`);
	}
	// Le "as" ne vérifie rien à l'exécution : on fait confiance à l'API
	// pour renvoyer la forme décrite par T.
	return response.json() as Promise<T>;
}
