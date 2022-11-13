// import * as BufferGeometryUtils from "./js/BufferGeometryUtils";

TP3.Render = {
	drawTreeRough: function (rootNode, scene, alpha, radialDivisions = 8, leavesCutoff = 0.1, leavesDensity = 10, applesProbability = 0.05, matrix = new THREE.Matrix4()) {

		// Material
		const leaves_material = new THREE.MeshPhongMaterial({color: 0x3A5F0B});
		const apples_material = new THREE.MeshPhongMaterial({color: 0x5F0B0B});
		const branches_material = new THREE.MeshLambertMaterial({color: 0x8B5A2B});

		// Mesh arrays
		let branches = []
		let apples = []
		let leaves = []

		// Fonction récursive à utiliser pour le parcours de l'arbre
		function drawNodeRough(node, matrix) {
			/**
			 * Function that generates meshes and saves them to appropriate array.
			 * Three elements to generates : branch, apple, leaves
			 *
			 * @param {Node} node The actual node of the tree.
			 * @param {THREE.Matrix4} matrix Transformation matrix up to this node
			 */

			// APPLE (CubeBufferGeometry)
			// TODO

			// LEAVES (PlaneBufferGeometry)
			// TODO

			// BRANCH (CylinderBufferGeometry)
			const radiusTop = node.a1;
			const radiusBottom = node.a0;

			const height_vector = new THREE.Vector3(
				node.p1.x - node.p0.x,
				node.p1.y - node.p0.y,
				node.p1.z - node.p0.z
			);

			const height = height_vector.length();
			const radialSegments = radialDivisions;
			const heightSegments = 1;
			// const openEnded = true;
			// const thetaStart = 0;
			// const thetaLength = 6.283185307179586;

			const geometry = new THREE.CylinderBufferGeometry(
				radiusTop,
				radiusBottom,
				height,
				radialSegments,
				heightSegments,
				// openEnded,
				// thetaStart,
				// thetaLength
			)

			// Calcul des facteurs de translation et rotation
			const childVector = new THREE.Vector3(
				node.p1.x - node.p0.x,
				node.p1.y - node.p0.y,
			 	node.p1.z - node.p0.z,
			)

			// values for rootNode
			let angle = 0
			let axis = new THREE.Vector3(1, 0, 0);
			let parentVector = new THREE.Vector3(0,0,0);

			if (node.parentNode) {
				// not rootNode
				    parentVector = new THREE.Vector3(
					node.parentNode.p1.x - node.parentNode.p0.x,
					node.parentNode.p1.y - node.parentNode.p0.y,
					node.parentNode.p1.z - node.parentNode.p0.z
				);
				angle = childVector.angleTo(parentVector);
				axis.crossVectors(childVector, parentVector).normalize();
			}

			// Matrices de transformation
			const translation = new THREE.Matrix4();
			translation.makeTranslation(0, childVector.length()/2 + parentVector.length()/2, 0);

			let translationToPivot = new THREE.Matrix4();
			translationToPivot.makeTranslation(0,-childVector.length()/2,0);

			let translationBack = new THREE.Matrix4();
			translationBack.makeTranslation(0,childVector.length()/2,0);

			const rotation = new THREE.Matrix4();
			rotation.makeRotationAxis(axis, angle);

			// Transformation matrix
			const new_matrix = new THREE.Matrix4();
			new_matrix.multiplyMatrices(matrix,translation);
			new_matrix.multiplyMatrices(new_matrix,translationToPivot);
			new_matrix.multiplyMatrices(new_matrix,rotation);
			new_matrix.multiplyMatrices(new_matrix,translationBack);


			geometry.applyMatrix4(new_matrix);
			branches.push(geometry);

			// Recursion
			for (let i = 0; i < node.childNode.length; i++) {
				drawNodeRough(node.childNode[i], new_matrix);
			}

		}

		// Parcours de l'arbre à partir de la racine
		drawNodeRough(rootNode, matrix);

		// mergeBufferGeometries
		const merged_branches = THREE.BufferGeometryUtils.mergeBufferGeometries(branches, false);
		const branches_mesh = new THREE.Mesh(merged_branches, branches_material);

		// const merged_apples = THREE.BufferGeometryUtils.mergeBufferGeometries(apples, false);
		// const apples_mesh = new THREE.Mesh(merged_apples, apples_material);

		// const merged_leaves = THREE.BufferGeometryUtils.mergeBufferGeometries(leaves, false);
		// const leaves_mesh = new THREE.Mesh(merged_leaves, leaves_material);

		// Add to scene
		scene.add(branches_mesh)
		// scene.add(apples_mesh)
		// scene.add(leaves_mesh)

	},

	drawTreeHermite: function (rootNode, scene, alpha, leavesCutoff = 0.1, leavesDensity = 10, applesProbability = 0.05, matrix = new THREE.Matrix4()) {
		//TODO
	},

	updateTreeHermite: function (trunkGeometryBuffer, leavesGeometryBuffer, rootNode) {
		//TODO
	},

	drawTreeSkeleton: function (rootNode, scene, color = 0xffffff, matrix = new THREE.Matrix4()) {

		var stack = [];
		stack.push(rootNode);

		var points = [];

		while (stack.length > 0) {
			var currentNode = stack.pop();

			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}

			points.push(currentNode.p0);
			points.push(currentNode.p1);

		}

		var geometry = new THREE.BufferGeometry().setFromPoints(points);
		var material = new THREE.LineBasicMaterial({ color: color });
		var line = new THREE.LineSegments(geometry, material);
		line.applyMatrix4(matrix);
		scene.add(line);

		return line.geometry;
	},

	updateTreeSkeleton: function (geometryBuffer, rootNode) {

		var stack = [];
		stack.push(rootNode);

		var idx = 0;
		while (stack.length > 0) {
			var currentNode = stack.pop();

			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}
			geometryBuffer[idx * 6] = currentNode.p0.x;
			geometryBuffer[idx * 6 + 1] = currentNode.p0.y;
			geometryBuffer[idx * 6 + 2] = currentNode.p0.z;
			geometryBuffer[idx * 6 + 3] = currentNode.p1.x;
			geometryBuffer[idx * 6 + 4] = currentNode.p1.y;
			geometryBuffer[idx * 6 + 5] = currentNode.p1.z;

			idx++;
		}
	},


	drawTreeNodes: function (rootNode, scene, color = 0x00ff00, size = 0.05, matrix = new THREE.Matrix4()) {

		var stack = [];
		stack.push(rootNode);

		var points = [];

		while (stack.length > 0) {
			var currentNode = stack.pop();

			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}

			points.push(currentNode.p0);
			points.push(currentNode.p1);

		}

		var geometry = new THREE.BufferGeometry().setFromPoints(points);
		var material = new THREE.PointsMaterial({ color: color, size: size });
		var points = new THREE.Points(geometry, material);
		points.applyMatrix4(matrix);
		scene.add(points);

	},


	drawTreeSegments: function (rootNode, scene, lineColor = 0xff0000, segmentColor = 0xffffff, orientationColor = 0x00ff00, matrix = new THREE.Matrix4()) {

		var stack = [];
		stack.push(rootNode);

		var points = [];
		var pointsS = [];
		var pointsT = [];

		while (stack.length > 0) {
			var currentNode = stack.pop();

			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}

			const segments = currentNode.sections;
			for (var i = 0; i < segments.length - 1; i++) {
				points.push(TP3.Geometry.meanPoint(segments[i]));
				points.push(TP3.Geometry.meanPoint(segments[i + 1]));
			}
			for (var i = 0; i < segments.length; i++) {
				pointsT.push(TP3.Geometry.meanPoint(segments[i]));
				pointsT.push(segments[i][0]);
			}

			for (var i = 0; i < segments.length; i++) {

				for (var j = 0; j < segments[i].length - 1; j++) {
					pointsS.push(segments[i][j]);
					pointsS.push(segments[i][j + 1]);
				}
				pointsS.push(segments[i][0]);
				pointsS.push(segments[i][segments[i].length - 1]);
			}
		}

		var geometry = new THREE.BufferGeometry().setFromPoints(points);
		var geometryS = new THREE.BufferGeometry().setFromPoints(pointsS);
		var geometryT = new THREE.BufferGeometry().setFromPoints(pointsT);

		var material = new THREE.LineBasicMaterial({ color: lineColor });
		var materialS = new THREE.LineBasicMaterial({ color: segmentColor });
		var materialT = new THREE.LineBasicMaterial({ color: orientationColor });

		var line = new THREE.LineSegments(geometry, material);
		var lineS = new THREE.LineSegments(geometryS, materialS);
		var lineT = new THREE.LineSegments(geometryT, materialT);

		line.applyMatrix4(matrix);
		lineS.applyMatrix4(matrix);
		lineT.applyMatrix4(matrix);

		scene.add(line);
		scene.add(lineS);
		scene.add(lineT);

	}
}