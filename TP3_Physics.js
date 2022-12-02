const appleMass = 0.075;

TP3.Physics = {
	initTree: function (rootNode) {

		this.computeTreeMass(rootNode);

		var stack = [];
		stack.push(rootNode);

		while (stack.length > 0) {
			var currentNode = stack.pop();
			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}

			currentNode.ip0 = currentNode.p0.clone();
			currentNode.ip1 = currentNode.p1.clone();
			currentNode.bp0 = currentNode.p0.clone();
			currentNode.bp1 = currentNode.p1.clone();
			currentNode.rp0 = currentNode.p0.clone();
			currentNode.rp1 = currentNode.p1.clone();
			currentNode.vel = new THREE.Vector3();
			currentNode.strength = currentNode.a0;
		}
	},

	computeTreeMass: function (node) {
		var mass = 0;

		for (var i = 0; i < node.childNode.length; i++) {
			mass += this.computeTreeMass(node.childNode[i]);
		}
		mass += node.a1;
		if (node.appleIndices !== null) {
			mass += appleMass;
		}
		node.mass = mass;

		return mass;
	},

	applyForces: function (node, dt, time) {

		var u = Math.sin(1 * time) * 4;
		u += Math.sin(2.5 * time) * 2;
		u += Math.sin(5 * time) * 0.4;

		var v = Math.cos(1 * time + 56485) * 4;
		v += Math.cos(2.5 * time + 56485) * 2;
		v += Math.cos(5 * time + 56485) * 0.4;

		// Ajouter le vent
		node.vel.add(new THREE.Vector3(u / Math.sqrt(node.mass), 0, v / Math.sqrt(node.mass)).multiplyScalar(dt));
		// Ajouter la gravite
		node.vel.add(new THREE.Vector3(0, -node.mass, 0).multiplyScalar(dt));

		// TODO: Projection du mouvement, force de restitution et amortissement de la velocite

		node.p0Prev = new THREE.Vector3(node.p0.x, node.p0.y, node.p0.z);

		// Apply the parent's transformation on the points of the current node
		if (node.parentNode) {

			const translation = new THREE.Matrix4().makeTranslation(-node.p0.x, -node.p0.y, -node.p0.z);
			const translationBack = new THREE.Matrix4().makeTranslation(node.parentNode.p1.x,
				                                                        node.parentNode.p1.y,
				                                                        node.parentNode.p1.z);
			//node.p0.applyMatrix4(translation);
			node.p1.applyMatrix4(translation);
			//node.p0.applyMatrix4(node.parentNode.transform);
			node.p1.applyMatrix4(node.parentNode.transform);
			//node.p0.applyMatrix4(translationBack);
			node.p1.applyMatrix4(translationBack);

			node.p0 = node.parentNode.p1.clone();
		}

		// Compute new position p_1(t + dt)
		let p1dt = new THREE.Vector3(node.p1.x + node.vel.x * dt,
			                         node.p1.y + node.vel.y * dt,
			                         node.p1.z + node.vel.z * dt);

		// Compute p_1(t + dt) - p_0 normalized
		let vector1 = new THREE.Vector3(p1dt.x - node.p0.x,
			                            p1dt.y - node.p0.y,
			                            p1dt.z - node.p0.z).normalize();

		// Compute p_1 - p_0 normalized
		let vector0 = new THREE.Vector3(node.p1.x - node.p0.x,
			                            node.p1.y - node.p0.y,
			                            node.p1.z - node.p0.z).normalize();

		// Compute angle between the two and find the rotation matrix
		const [axis, angle] = TP3.Geometry.findRotation(vector0, vector1);
		const rotation = new THREE.Matrix4().makeRotationAxis(axis, angle);

		// Set up the transform of the current node for its children to use
		if (node.parentNode) {
			node.transform = new THREE.Matrix4().multiplyMatrices(rotation, node.parentNode.transform);
		}
		else {
			node.transform = rotation;
		}

		const translation = new THREE.Matrix4().makeTranslation(-node.p0.x, -node.p0.y, -node.p0.z);
		const translationBack = new THREE.Matrix4().makeTranslation(node.p0.x, node.p0.y, node.p0.z);
		let p1Temp = new THREE.Vector3(node.p1.x, node.p1.y, node.p1.z);
		node.p1.applyMatrix4(translation);
		node.p1.applyMatrix4(rotation);
		node.p1.applyMatrix4(translationBack);


		node.vel = new THREE.Vector3((node.p1.x - p1Temp.x) / dt,
			                         (node.p1.y - p1Temp.y) / dt,
			                         (node.p1.z - p1Temp.z) / dt);

		let vectorI = new THREE.Vector3(node.ip1.x - node.ip0.x,
			                            node.ip1.y - node.ip0.y,
			                            node.ip1.z - node.ip0.z);

		let vectorF = new THREE.Vector3(node.p1.x - node.p0.x,
			                            node.p1.y - node.p0.y,
			                            node.p1.z - node.p0.z);

		const [axis2, angle2] = TP3.Geometry.findRotation(vectorF, vectorI);
		const rotation2 = new THREE.Matrix4().makeRotationAxis(axis2, angle2 ** 2);

		let pt = new THREE.Vector3(vectorF.x, vectorF.y, vectorF.z).applyMatrix4(rotation2);

		let restitution = new THREE.Vector3(pt.x - vectorF.x,
			                                pt.y - vectorF.y,
			                                pt.z - vectorF.z).multiplyScalar(node.a0 * 1000);

		node.vel.add(restitution).multiplyScalar(0.7);


		// Appel recursif sur les enfants
		for (var i = 0; i < node.childNode.length; i++) {
			this.applyForces(node.childNode[i], dt, time);
		}
	}
}