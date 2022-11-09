
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

	simplifySkeleton: function (rootNode, rotationThreshold = 0.0001) {
		//TODO
		let nodeQueue = [rootNode];
		while (nodeQueue.length > 0) {

			let oneChild = nodeQueue[0].childNode.length === 1;
			if (oneChild) {

				let parentVector = new THREE.Vector3(nodeQueue[0].p1.x - nodeQueue[0].p0.x,
					                                 nodeQueue[0].p1.y - nodeQueue[0].p0.y,
					                                 nodeQueue[0].p1.z - nodeQueue[0].p0.z
				);
				let childVector = new THREE.Vector3(nodeQueue[0].childNode[0].p1.x - nodeQueue[0].childNode[0].p0.x,
					                                nodeQueue[0].childNode[0].p1.y - nodeQueue[0].childNode[0].p0.y,
					                                nodeQueue[0].childNode[0].p1.z - nodeQueue[0].childNode[0].p0.z
				);

				let thresholdMet = childVector.angleTo(parentVector) < rotationThreshold;
				while (oneChild && thresholdMet) {

					let parent = nodeQueue[0];
					let child = nodeQueue[0].childNode[0];
					let grandChildren = nodeQueue[0].childNode[0].childNode;

					for (let j = 0; j < grandChildren.length; j++) {
						grandChildren[j].parentNode = parent;
					}
					child.parent = child;
					child.childNode = [];
					parent.childNode = grandChildren;

					parent.p1 = child.p1;
					parent.a1 = child.a1;

					oneChild = parent.childNode.length === 1;
					if (oneChild) {
						parentVector = new THREE.Vector3(parent.p1.x - parent.p0.x,
													 parent.p1.y - parent.p0.y,
													 parent.p1.z - parent.p0.z
						);

						childVector = new THREE.Vector3(grandChildren[0].p1.x - grandChildren[0].p0.x,
													grandChildren[0].p1.y - grandChildren[0].p0.y,
													grandChildren[0].p1.z - grandChildren[0].p0.z
						);
						thresholdMet = childVector.angleTo(parentVector) < rotationThreshold;
					}
				}
			}

			nodeQueue = nodeQueue.concat(nodeQueue[0].childNode);
			nodeQueue.splice(0,1);
		}

		return rootNode;
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