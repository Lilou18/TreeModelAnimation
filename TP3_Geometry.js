
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
		const childVector = new THREE.Vector3(
			node.p1.x - node.p0.x,
			node.p1.y - node.p0.y,
			node.p1.z - node.p0.z
		);

		const parentVector = new THREE.Vector3(
			node.p1.x - node.p0.x,
			node.p1.y - node.p0.y,
			node.p1.z - node.p0.z
		);

		if (node.childNode.length === 1 && childVector.angleTo(parentVector)) {
			// REMOVE NODE
			// le parent se termine au debut du prochain enfant
			node.parentNode.p1 = node.childNode.p0
			node.parentNode.a1 = node.childNode.a0
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
		for (let node in rootNode.childNode) {
			TP3.Geometry.simplifyNode(node, rotationThreshold)
		}

		return rootNode
	},

	generateSegmentsHermite: function (rootNode, lengthDivisions = 4, radialDivisions = 8) {
		//TODO
	},

	hermite: function (h0, h1, v0, v1, t) {
		//TODO
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