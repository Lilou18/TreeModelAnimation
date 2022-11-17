function vectorFromPoints(p0, p1) {
	return new THREE.Vector3(
		p1.x - p0.x,
		p1.y - p0.y,
		p1.z - p0.z
	);
}

function getRandomInsideInterval(min, max) {
	return (Math.random() * (max - min) + min);
}

function getRandomInsideDisk(radius) {
	while (true) {
		const x = getRandomInsideInterval(-radius, radius);
		const z = getRandomInsideInterval(-radius, radius);
		if ( Math.sqrt(x**2 + z**2) < radius ) {
			return {x, z};
		}
	}
}

TP3.Render = {
	drawTreeRough: function (rootNode, scene, alpha, radialDivisions = 8, leavesCutoff = 0.1, leavesDensity = 10, applesProbability = 0.05, matrix = new THREE.Matrix4()) {

		// Material
		const leafMaterial = new THREE.MeshPhongMaterial({color: 0x3A5F0B});
		leafMaterial.side = THREE.DoubleSide;
		const appleMaterial = new THREE.MeshPhongMaterial({color: 0x5F0B0B});
		const branchMaterial = new THREE.MeshLambertMaterial({color: 0x8B5A2B});

		// Mesh arrays
		let branches = [];
		let apples = [];
		let leaves = [];

		let nodeQueue = [rootNode];
		while (nodeQueue.length > 0) {

			node = nodeQueue[0];
			const nodeVector = vectorFromPoints(node.p0, node.p1);

			const radiusTop = node.a1;
			const radiusBottom = node.a0;
			const height = nodeVector.length();
			const radialSegments = radialDivisions;
			const heightSegments = 1;

			const branchGeometry = new THREE.CylinderBufferGeometry(
				radiusTop,
				radiusBottom,
				height,
				radialSegments,
				heightSegments
			);

			let angle = 0;
			let axis = new THREE.Vector3(1, 0, 0);
			let parentVector = new THREE.Vector3(0,0,0);
			let parentTransform = matrix;

			if (node.parentNode) {

				parentVector = new THREE.Vector3(
					node.parentNode.p1.x - node.parentNode.p0.x,
					node.parentNode.p1.y - node.parentNode.p0.y,
					node.parentNode.p1.z - node.parentNode.p0.z
				);
				angle = nodeVector.angleTo(parentVector);
				axis.crossVectors(nodeVector, parentVector).normalize();
				parentTransform = node.parentNode.transform;
			}

			const translationAboveGround = new THREE.Matrix4();
			translationAboveGround.makeTranslation(0, height/2, 0);

			const rotation = new THREE.Matrix4();
			rotation.makeRotationAxis(axis, angle);

			const translationAboveParent = new THREE.Matrix4();
			translationAboveParent.makeTranslation(0, parentVector.length()/2, 0);

			let transform = new THREE.Matrix4();
			transform.multiplyMatrices(translationAboveGround,transform);
			transform.multiplyMatrices(rotation,transform);
			transform.multiplyMatrices(translationAboveParent,transform);
			transform.multiplyMatrices(parentTransform,transform);

			node.transform = transform;
			branchGeometry.applyMatrix4(transform);
			branches.push(branchGeometry);

			// LEAVES (PlaneBufferGeometry)
			if (node.a0 < alpha * leavesCutoff) {

				// for (let i = 0; i < 1; i++) { // FIXME REMOVE LATER : TEST AVEC UNE FEUILLE PAR NOEUD
				for (let i = 0; i < leavesDensity; i++) {
					// N.B. LES FEUILLES SONT INITIALISÉES AU MILIEU DE LA BRANCHE (origine)

					// rotation aléatoire sur elle-même
					// choix d'un axe aléatoire et d'un angle aléatoire
					let rand_axis = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize();
					let rand_angle = Math.random()*2*Math.PI;
					let rotation_itself = new THREE.Matrix4();
					rotation_itself.makeRotationAxis(rand_axis, rand_angle);

					// position aléatoire relative au noeud sur l'axe de la branche
					let rand_axial;
					let axial_translation = new THREE.Matrix4();

					if (node.childNode.length === 0) {
						//	branche terminale : (-height à +height+alpha)
						// console.log("Branche terminale")
						rand_axial = getRandomInsideInterval(-height, height+alpha);
					} else {
						//  branche non terminale : (-height à +height)
						// console.log("Branche non-terminale")
						rand_axial = getRandomInsideInterval(-height, height);
						axial_translation.makeTranslation(0, rand_axial,0);
					}

					// éloignement de la branche de 0 à alpha/2
					let {x, z} = getRandomInsideDisk(alpha/2);
					let radial_translation = new THREE.Matrix4();
					radial_translation.makeTranslation(x, 0,z);

					let plane_geometry = new THREE.PlaneBufferGeometry(alpha, alpha);

					// Transformation matrix to apply on plane_geometry
					const leave_matrix = new THREE.Matrix4();
					leave_matrix.multiplyMatrices(rotation_itself,leave_matrix);
					leave_matrix.multiplyMatrices(axial_translation,leave_matrix);
					leave_matrix.multiplyMatrices(radial_translation,leave_matrix);
					leave_matrix.multiplyMatrices(transform,leave_matrix);

					plane_geometry.applyMatrix4(leave_matrix);

					leaves.push(plane_geometry);
				}

			}

			// APPLE (CubeBufferGeometry)
			if (node.a0 < alpha * leavesCutoff) {
				// N.B. LES POMMES SONT INITIALISÉES AU MILIEU DE LA BRANCHE (origine)

				if (applesProbability > Math.random()) {
					// rotation aléatoire sur elle-même
					// choix d'un axe aléatoire et d'un angle aléatoire
					let rand_axis = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize();
					let rand_angle = Math.random()*2*Math.PI;
					let rotation_itself = new THREE.Matrix4();
					rotation_itself.makeRotationAxis(rand_axis, rand_angle);

					// position aléatoire relative au noeud sur l'axe de la branche
					const rand_axial = getRandomInsideInterval(-height, height);
					let axial_translation = new THREE.Matrix4();
					axial_translation.makeTranslation(0, rand_axial,0);

					// éloignement de la branche de 0 à alpha/2
					let {x, z} = getRandomInsideDisk(alpha/2);
					let radial_translation = new THREE.Matrix4();
					radial_translation.makeTranslation(x, 0,z);

					const cube_geometry = new THREE.BoxBufferGeometry(alpha, alpha, alpha);

					// Transformation matrix to apply on plane_geometry
					const apple_matrix = new THREE.Matrix4();
					apple_matrix.multiplyMatrices(rotation_itself,apple_matrix);
					apple_matrix.multiplyMatrices(axial_translation,apple_matrix);
					apple_matrix.multiplyMatrices(radial_translation,apple_matrix);
					apple_matrix.multiplyMatrices(transform,apple_matrix);

					cube_geometry.applyMatrix4(apple_matrix);

					apples.push(cube_geometry);
				}

			}

			nodeQueue = nodeQueue.concat(nodeQueue[0].childNode);
			nodeQueue.splice(0,1);
		}

		// mergeBufferGeometries
		const mergedBranches = THREE.BufferGeometryUtils.mergeBufferGeometries(branches, false);
		const branchesMesh = new THREE.Mesh(mergedBranches, branchMaterial);
		branchesMesh.castShadow = true;

		const mergedApples = THREE.BufferGeometryUtils.mergeBufferGeometries(apples, false);
		const applesMesh = new THREE.Mesh(mergedApples, appleMaterial);
		applesMesh.castShadow = true;

		const mergedLeaves = THREE.BufferGeometryUtils.mergeBufferGeometries(leaves, false);
		const leavesMesh = new THREE.Mesh(mergedLeaves, leafMaterial);
		leavesMesh.castShadow = true;

		// Add to scene
		scene.add(branchesMesh);
		scene.add(applesMesh);
		scene.add(leavesMesh);
	},

	drawTreeHermite: function (rootNode, scene, alpha, leavesCutoff = 0.1, leavesDensity = 10, applesProbability = 0.05, matrix = new THREE.Matrix4()) {

		const branchMaterial = new THREE.MeshLambertMaterial({color: 0x8B5A2B});

		let branches = [];

		let nodeQueue = [rootNode];
		while (nodeQueue.length > 0) {

			let node = nodeQueue[0];
			const sectionsNum = node.sections.length;
			const sectionLen = node.sections[0].length;
			const f32vertices = new Float32Array(sectionsNum * sectionLen * 3);

			for (let i = 0; i < sectionsNum; i++) {
				let section = node.sections[i];
				for (let j = 0; j < sectionLen; j++) {
					f32vertices[i * sectionLen * 3 + j * 3] = section[j].x;
					f32vertices[i * sectionLen * 3 + j * 3 + 1] = section[j].y;
					f32vertices[i * sectionLen * 3 + j * 3 + 2] = section[j].z;
				}
			}

			const geometry = new THREE.BufferGeometry();
			geometry.setAttribute("position", new THREE.BufferAttribute(f32vertices, 3));
			const facesIdx = [];

			let v1Idx = 0;
			let v2Idx = 1;
			let v3Idx = 1 + sectionLen;

			for (let i = 1; i < sectionsNum; i++) {
				for (let j = 0; j < sectionLen; j++) {
					facesIdx.push(v1Idx, v2Idx, v3Idx);
					facesIdx.push(v1Idx, v3Idx, v1Idx + sectionLen);
					v2Idx = v1Idx;
					v1Idx = sectionLen - 1 - j + sectionLen * (i - 1);
					v3Idx = v2Idx + sectionLen;
				}
				v1Idx += sectionLen;
				v2Idx += sectionLen;
				v3Idx += sectionLen;
			}

			if (!node.parentNode) {

				v1Idx = 0;
				v2Idx = 1;
				v3Idx = 2;

				for (let i = 0; i < sectionLen - 2; i++) {
					facesIdx.push(v1Idx, v2Idx, v3Idx);
					v2Idx = v1Idx;
					v1Idx = sectionLen - 1 - i;
				}
			}

			if (node.childNode.length === 0) {

				v1Idx = (sectionsNum - 1) * sectionLen;
				v2Idx = (sectionsNum - 1) * sectionLen  + 1;
				v3Idx = (sectionsNum - 1) * sectionLen + 2;

				for (let i = 0; i < sectionLen - 2; i++) {
					facesIdx.push(v1Idx, v2Idx, v3Idx);
					v2Idx = v1Idx;
					v1Idx = (sectionsNum - 1) * sectionLen + sectionLen - 1 - i;
				}
			}

			geometry.setIndex(facesIdx);
			geometry.computeVertexNormals();
			branches.push(geometry)
			const branchesMesh = new THREE.Mesh(geometry, branchMaterial);
			branchesMesh.castShadow = true;
			scene.add(branchesMesh);

			nodeQueue = nodeQueue.concat(nodeQueue[0].childNode);
			nodeQueue.splice(0,1);
		}
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