function vectorFromPoints(p0, p1) {
	return new THREE.Vector3(
		p1.x - p0.x,
		p1.y - p0.y,
		p1.z - p0.z
	);
}

function lerp(a, b, t) {
	return a.multiplyScalar(1-t).add(b.multiplyScalar(t));
}

class Node {
	constructor(parentNode) {
		this.parentNode = parentNode; //Noeud parent
		this.childNode = []; //Noeud enfants

		this.p0 = null; //Position de depart de la branche
		this.p1 = null; //Position finale de la branche

		this.a0 = null; //Rayon de la branche a p0
		this.a1 = null; //Rayon de la branche a p1

		this.sections = null; //Liste contenant une liste de points representant les segments circulaires du cylindre generalise
	}
}

TP3.Geometry = {

	simplifyNode: function (node, rotationThreshold) {
		/**
		 * Checks if node need to be removed from the tree.
		 * Remove node from tree if it's the only child of a tree
		 * and its rotation angle is smaller than the threshold.
		 *
		 * @param {Node} node The actual node of the tree.
		 * @param {number} rotationThreshold Minimum angle to consider a valid new branch.
		 */

		// Calculer la rotation effective du node
		const childVector = vectorFromPoints(node.p0, node.p1);
		const parentVector = vectorFromPoints(node.parentNode.p0, node.parentNode.p1);

		if (node.parentNode.childNode.length === 1 && childVector.angleTo(parentVector) < rotationThreshold) {
			// REMOVE NODE

			// parentNode se termine maintenant à la fin du node actuel (on étire le parent)
			node.parentNode.p1 = node.p1;
			node.parentNode.a1 = node.a1;

			// les petits-enfants prennent le parent comme nouveau parent
			for (let i = 0; i < node.childNode.length; i++) {
				node.childNode[i].parentNode = node.parentNode;
			}

			// les enfants du node sont transférés au parent
			node.parentNode.childNode = node.childNode;
		}

		// appel récursif
		for (let i = 0; i < node.childNode.length; i++) {
			TP3.Geometry.simplifyNode(node.childNode[i], rotationThreshold);
		}
	},

	simplifySkeleton: function (rootNode, rotationThreshold = 0.0001) {
		/**
		 * Returns the simplified Skeleton of a given tree.
		 *
		 * @param {Node} rootNode The root of the tree.
		 * @param {number} rotationThreshold Minimum angle to consider a valid new branch.
		 * @return {Node} The root of the tree.
		 */
		for (let i = 0; i < rootNode.childNode.length; i++) {
			TP3.Geometry.simplifyNode(rootNode.childNode[i], rotationThreshold);
		}

		return rootNode
	},

	generateSegmentsHermite: function (rootNode, lengthDivisions = 4, radialDivisions = 8) {
		//TODO
	},

	hermite: function (h0, h1, v0, v1, t) {
		// noms de variable selon l'image de : https://fr.wikipedia.org/wiki/Algorithme_de_Casteljau
		// conversion : https://stackoverflow.com/questions/7880884/how-to-convert-from-an-hermite-curve-into-bezier-curve
		// conversion de courbe de Hermite en courbe de Bézier
		// vo et v1 sont les tangentes
		// h0 et h1 sont les points
		const p00 = h0
		const p01 = h0 + v0/3
		const p02 = h1 - v1/3
		const p03 = h1

		// algorithme de De Casteljau

		// premier retranchement
		const p10 = lerp(p00,p01,t)
		const p11 = lerp(p01,p02,t)
		const p12 = lerp(p02,p03,t)

		// deuxième retranchement
		const p20 = lerp(p10,p11,t)
		const p21 = lerp(p11,p12,t)

		// point et tangente
		const p = lerp(p20,p21,t)
		const dp = vectorFromPoints(p20, p21).normalize();

		return [p, dp];
	},


	// Trouver l'axe et l'angle de rotation entre deux vecteurs
	findRotation: function (a, b) {
		const axis = new THREE.Vector3().crossVectors(a, b).normalize();
		var c = a.dot(b) / (a.length() * b.length());

		if (c < -1) {
			c = -1;
		} else if (c > 1) {
			c = 1;
		}

		const angle = Math.acos(c);

		return [axis, angle];
	},

	// Projeter un vecter a sur b
	project: function (a, b) {
		return b.clone().multiplyScalar(a.dot(b) / (b.lengthSq()));
	},

	// Trouver le vecteur moyen d'une liste de vecteurs
	meanPoint: function (points) {
		var mp = new THREE.Vector3();

		for (var i = 0; i < points.length; i++) {
			mp.add(points[i]);
		}

		return mp.divideScalar(points.length);
	},
};