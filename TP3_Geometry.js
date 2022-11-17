class Node {
	constructor(parentNode) {
		this.parentNode = parentNode; //Noeud parent
		this.childNode = []; //Noeud enfants

		this.p0 = null; //Position de depart de la branche
		this.p1 = null; //Position finale de la branche

		this.a0 = null; //Rayon de la branche a p0
		this.a1 = null; //Rayon de la branche a p1

		this.transform = null; //Matrice de transformation de la branche

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

		let nodeQueue = [rootNode];
		while (nodeQueue.length > 0) {

			let node = nodeQueue[0];
			let parentRotation = new THREE.Matrix4();
			node.transform = new THREE.Matrix4();

			let h0 = new THREE.Vector3(node.p0.x, node.p0.y, node.p0.z);
			let h1 = new THREE.Vector3(node.p1.x, node.p1.y, node.p1.z);
			let v1 = new THREE.Vector3(h1.x - h0.x, h1.y - h0.y, h1.z - h0.z);
			let v0 = new THREE.Vector3(v1.x, v1.y, v1.z);
			if (node.parentNode) {
				v0 = new THREE.Vector3(node.parentNode.p1.x - node.parentNode.p0.x,
					node.parentNode.p1.y - node.parentNode.p0.y,
					node.parentNode.p1.z - node.parentNode.p0.z);
				parentRotation = node.parentNode.transform;
			}

			const radiusFactor = (node.a0 - node.a1)/(lengthDivisions - 1);
			const dt = 1/(lengthDivisions - 1);
			const dtheta = 2 * Math.PI/radialDivisions;

			node.sections = [];

			for (let i = 0; i < lengthDivisions; i++) {

				let t = i * dt;

				let [pt, vt] = this.hermite(h0, h1, v0, v1, t);
				const translation = new THREE.Matrix4().makeTranslation(pt.x, pt.y, pt.z);

				let sectionPoints = [];
				let radius = node.a0 - radiusFactor * i;
				for (let j = 0; j < radialDivisions; j++) {
					let point = new THREE.Vector3(radius * Math.sin(dtheta * j + Math.PI/2),
												  0,
												  radius * Math.cos(dtheta * j + Math.PI/2));

					point.applyMatrix4(parentRotation);
					point.applyMatrix4(node.transform);
					point.applyMatrix4(translation);
					sectionPoints.push(point);
				}

				if (i !== lengthDivisions - 1) {
					let vtdt = this.hermite(h0, h1, v0, v1, t + dt)[1];
					[axis, angle] = this.findRotation(vt, vtdt);
					const rotation = new THREE.Matrix4().makeRotationAxis(axis, angle);
					node.transform.multiplyMatrices(rotation, node.transform);
				}

				node.sections.push(sectionPoints);
			}

			node.transform.multiplyMatrices(node.transform, parentRotation);
			nodeQueue = nodeQueue.concat(node.childNode);
			nodeQueue.splice(0,1);
		}

		return rootNode;
	},

	hermite: function (h0, h1, v0, v1, t) {

		let p0 = new THREE.Vector3(h0.x, h0.y, h0.z);
		let p1 = new THREE.Vector3(h0.x + v0.x/3, h0.y + v0.y/3, h0.z + v0.z/3);
		let p2 = new THREE.Vector3(h1.x - v1.x/3, h1.y - v1.y/3, h1.z - v1.z/3);
		let p3 = new THREE.Vector3(h1.x, h1.y, h1.z);

		p0 = this.lerp(p0, p1, t);
		p1 = this.lerp(p1, p2, t);
		p2 = this.lerp(p2, p3, t);

		p0 = this.lerp(p0, p1, t);
		p1 = this.lerp(p1, p2, t);

		let p = this.lerp(p0, p1, t);
		let dp = new THREE.Vector3(p1.x - p0.x, p1.y - p0.y, p1.z - p0.z).normalize();

		return [p, dp];
	},

	lerp: function (p0, p1, t) {
		return new THREE.Vector3((1 - t) * p0.x + t * p1.x,
			                     (1 - t) * p0.y + t * p1.y,
			                     (1 - t) * p0.z + t * p1.z
		);
	},

	// Trouver l'axe et l'angle de rotation entre deux vecteurs
	findRotation: function (a, b) {

		let length = a.length() * b.length();

		const axis = new THREE.Vector3().crossVectors(a, b).normalize();

		if (length === 0) {
			return [axis, 0];
		}

		var c = a.dot(b) / length;

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