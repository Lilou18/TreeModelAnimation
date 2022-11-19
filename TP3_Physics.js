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

		if (node.parent) {
			node.p0.applyMatrix4(node.parent.transform);
			node.p1.applyMatrix4(node.parent.transform);
		}

		let p1dt = new THREE.Vector3(node.p1.x + node.vel.x * dt,
			                         node.p1.y + node.vel.y * dt,
			                         node.p1.z + node.vel.z * dt);

		let vector1 = new THREE.Vector3(p1dt.x - node.p0.x,
			                            p1dt.y - node.p0.y,
			                            p1dt.z - node.p0.z).normalize();

		let vector0 = new THREE.Vector3(node.p1.x - node.p0.x,
			                            node.p1.y - node.p0.y,
			                            node.p1.z - node.p0.z).normalize();

		[axis, angle] = TP3.Geometry.findRotation(vector1, vector0);
		const rotation = new THREE.Matrix4().makeRotationAxis(axis, angle);

		let p1Temp = node.p1;

		node.transform = new THREE.Matrix4();
		if (node.parent) {
			node.p1.applyMatrix4(rotation);
			node.transform.multiplyMatrices(rotation, node.parent.transform);
		}

		else {
			node.p1.applyMatrix4(rotation);
			node.transform.multiplyMatrices(rotation, node.transform);
		}

		let newVel = new THREE.Vector3((node.p1.x - p1Temp.x) / dt,
			                           (node.p1.y - p1Temp.y) / dt,
				                       (node.p1.z - p1Temp.z) / dt);

		node.vel = newVel;

		// Appel recursif sur les enfants
		for (var i = 0; i < node.childNode.length; i++) {
			//this.applyForces(node.childNode[i], dt, time);
		}
	}
}