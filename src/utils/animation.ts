// Joue une animation CSS en posant une classe, attend sa fin, puis retire la classe.
// La classe (ex. "card--entering") est stylée par D avec une @keyframes ou une transition.
// Sans animation CSS (pas encore de style, ou prefers-reduced-motion), la promesse se résout
// immédiatement : le code qui attend la fin (ex. retirer la carte du DOM) n'est jamais bloqué.
export async function playAnimation(element: HTMLElement, className: string): Promise<void> {
	// Retirer puis reposer la classe ne suffit pas à rejouer une animation déjà jouée :
	// lire offsetWidth force le navigateur à recalculer le style entre les deux.
	element.classList.remove(className);
	void element.offsetWidth;
	element.classList.add(className);

	// getAnimations() renvoie les animations et transitions CSS en cours sur l'élément
	const animations = element.getAnimations();
	// allSettled : on continue même si une animation est annulée (élément retiré entre-temps)
	await Promise.allSettled(animations.map((animation) => animation.finished));
	element.classList.remove(className);
}
