// Pose la classe, attend la fin de l'animation CSS, puis retire la classe.
// Sans animation CSS, la promesse se résout immédiatement.
export async function playAnimation(element: HTMLElement, className: string): Promise<void> {
	// Retirer puis reposer la classe ne suffit pas à rejouer une animation déjà jouée :
	// lire offsetWidth force le navigateur à recalculer le style entre les deux.
	element.classList.remove(className);
	void element.offsetWidth;
	element.classList.add(className);

	const animations = element.getAnimations();
	// allSettled : on continue même si une animation est annulée (élément retiré entre-temps)
	await Promise.allSettled(animations.map((animation) => animation.finished));
	element.classList.remove(className);
}
