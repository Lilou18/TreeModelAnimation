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
		const leavesMaterial = new THREE.MeshPhongMaterial({color: 0x3A5F0B});
		leavesMaterial.side = THREE.DoubleSide;

		const sectionsNum = rootNode.sections.length - 1;
		const sectionLen = rootNode.sections[0].length;

		const geometry = new THREE.BufferGeometry();
		let [f32vertices,f32Leaves] = this.initializeF32Vertex(rootNode,alpha,leavesCutoff,leavesDensity);
		geometry.setAttribute("position", new THREE.BufferAttribute(f32vertices, 3));
		const facesIdx = [];
		let compteur = 0;

		const leaves = new THREE.BufferGeometry();
		leaves.setAttribute("position", new THREE.BufferAttribute(f32Leaves,3));
		const leavesIDx = [];



		for (let i = 0; i < sectionLen - 2; i++) {
			let v1Idx = rootNode.verticesIDs[0][i];
			let v2Idx = rootNode.verticesIDs[0][i + 1];
			let v3Idx = rootNode.verticesIDs[0][sectionLen - 1];
			facesIdx.push(v1Idx, v2Idx, v3Idx);
		}

		let v1Idx = rootNode.verticesIDs[0][sectionLen - 1];
		let v2Idx = rootNode.verticesIDs[0][0];
		let v3Idx = rootNode.verticesIDs[1][0];
		let v4Idx = rootNode.verticesIDs[1][sectionLen - 1];

		for (let i = 0; i < sectionsNum; i++) {
			for (let j = 0; j < sectionLen; j++) {

				facesIdx.push(v1Idx, v2Idx, v3Idx);
				facesIdx.push(v1Idx, v3Idx, v4Idx);

				if (j !== sectionLen - 1) {
					v1Idx = rootNode.verticesIDs[i][j];
					v2Idx = rootNode.verticesIDs[i][j + 1];
					v3Idx = rootNode.verticesIDs[i + 1][j + 1];
					v4Idx = rootNode.verticesIDs[i + 1][j];
				}
			}

			if (i !== sectionsNum - 1) {
				v1Idx = rootNode.verticesIDs[i + 1][sectionLen - 1];
				v2Idx = rootNode.verticesIDs[i + 1][0];
				v3Idx = rootNode.verticesIDs[i + 2][0];
				v4Idx = rootNode.verticesIDs[i + 2][sectionLen - 1];
			}
		}

		let nodeQueue = rootNode.childNode;
		while (nodeQueue.length > 0) {

			let node = nodeQueue[0];
			let parentVertices = node.parentNode.verticesIDs[node.parentNode.verticesIDs.length - 1];

			let v1Idx = parentVertices[sectionLen - 1];
			let v2Idx = parentVertices[0];
			let v3Idx = node.verticesIDs[0][0];
			let v4Idx = node.verticesIDs[0][sectionLen - 1];

			for (let i = 0; i < sectionLen; i++) {

				facesIdx.push(v1Idx, v2Idx, v3Idx);
				facesIdx.push(v1Idx, v3Idx, v4Idx);

				if (i !== sectionLen - 1) {
					v1Idx = parentVertices[i];
					v2Idx = parentVertices[i + 1];
					v3Idx = node.verticesIDs[0][i + 1];
					v4Idx = node.verticesIDs[0][i];
				}
			}

			v1Idx = node.verticesIDs[0][sectionLen - 1];
			v2Idx = node.verticesIDs[0][0];
			v3Idx = node.verticesIDs[1][0];
			v4Idx = node.verticesIDs[1][sectionLen - 1];

			for (let i = 0; i < sectionsNum - 1; i++) {
				for (let j = 0; j < sectionLen; j++) {

					facesIdx.push(v1Idx, v2Idx, v3Idx);
					facesIdx.push(v1Idx, v3Idx, v4Idx);

					if (j !== sectionLen - 1) {
						v1Idx = node.verticesIDs[i][j];
						v2Idx = node.verticesIDs[i][j + 1];
						v3Idx = node.verticesIDs[i + 1][j + 1];
						v4Idx = node.verticesIDs[i + 1][j];
					}
				}

				if (i !== sectionsNum - 2) {
					v1Idx = node.verticesIDs[i + 1][sectionLen - 1];
					v2Idx = node.verticesIDs[i + 1][0];
					v3Idx = node.verticesIDs[i + 2][0];
					v4Idx = node.verticesIDs[i + 2][sectionLen - 1];
				}
			}

			if (node.childNode.length === 0) {
				for (let i = 0; i < sectionLen - 2; i++) {
					v1Idx = node.verticesIDs[sectionsNum - 1][i];
					v2Idx = node.verticesIDs[sectionsNum - 1][i + 1];
					v3Idx = node.verticesIDs[sectionsNum - 1][sectionLen - 1];
					facesIdx.push(v1Idx, v2Idx, v3Idx);
				}
			}

			// for(let h = 0; h < leavesDensity; h++){
			// 	for(let g = 0; g < 3; g++){
			// 		let indexPoint = h*3+g;
			// 		leavesIDx.push(indexPoint);
			// 	}
			//
			// }

			if(node.childNode.length === 0){

				compteur++;

				for(let h = 0; h < leavesDensity; h++){

					for(let g = 0; g < 3; g++){
						let leaveFirstPoint = node.leavesIDs[h*3+g];
						leavesIDx.push(leaveFirstPoint);
					}

				}
			}

			nodeQueue = nodeQueue.concat(nodeQueue[0].childNode);
			nodeQueue.splice(0,1);
		}

		console.log(leavesIDx);

		geometry.setIndex(facesIdx);
		geometry.computeVertexNormals();
		const branchesMesh = new THREE.Mesh(geometry, branchMaterial);
		branchesMesh.castShadow = true;
		scene.add(branchesMesh);

		leaves.setIndex(leavesIDx);
		leaves.computeVertexNormals();
		const leavesMesh = new THREE.Mesh(leaves,leavesMaterial);
		leavesMesh.castShadow = true;
		scene.add(leavesMesh);


	},

	initializeF32Vertex: function(rootNode,alpha,leavesCutoff,leavesDensity) {

		let compteur = 0;
		let compteur2 = 0;
		let leavesCounting = 0;

		let nodeQueue = [rootNode];
		let nodeNum = 0;
		while (nodeQueue.length > 0) {
			nodeNum++;
			nodeQueue = nodeQueue.concat(nodeQueue[0].childNode);
			nodeQueue.splice(0,1);
		}

		nodeQueue = [rootNode];

		const sectionsNum = rootNode.sections.length;
		const sectionLen = rootNode.sections[0].length;
		const f32vertices = new Float32Array(nodeNum * sectionsNum * sectionLen * 3);

		const f32VerticesLeaves = new Float32Array(nodeNum*leavesDensity*3*3);
		let test = nodeNum*leavesDensity*5;
		const verticesLeaves = [];

		let startVIdx = 0;
		let startLeaves = 0;
		while (nodeQueue.length > 0) {

			nodeQueue[0].verticesIDs = [];

			if (!nodeQueue[0].parentNode) {
				for (let i = 0; i < sectionsNum; i++) {

					let sectionIDs = [];
					for (let j = 0; j < sectionLen; j++) {

						let verticesIdx = startVIdx + (i * sectionLen + j) * 3;
						f32vertices[verticesIdx] = nodeQueue[0].sections[i][j].x;
						f32vertices[verticesIdx + 1] = nodeQueue[0].sections[i][j].y;
						f32vertices[verticesIdx + 2] = nodeQueue[0].sections[i][j].z;

						sectionIDs.push(verticesIdx/3);
					}
					nodeQueue[0].verticesIDs.push(sectionIDs);
				}

			}
			else{

				if(nodeQueue[0].childNode.length === 0){
					compteur2++;
				}
				for (let i = 0; i < sectionsNum - 1; i++) {

					let sectionIDs = [];
					for (let j = 0; j < sectionLen; j++) {

						let verticesIdx = startVIdx + (i * sectionLen + j) * 3;
						f32vertices[verticesIdx] = nodeQueue[0].sections[i][j].x;
						f32vertices[verticesIdx + 1] = nodeQueue[0].sections[i][j].y;
						f32vertices[verticesIdx + 2] = nodeQueue[0].sections[i][j].z;

						sectionIDs.push(verticesIdx/3);
					}
					nodeQueue[0].verticesIDs.push(sectionIDs);
				}
			}

			// Si la branche est assez petite pour contenir des feuilles on crée
			// les points de c'est feuilles.
			if(nodeQueue[0].a0 < alpha * leavesCutoff){
				const nodeVector = vectorFromPoints(nodeQueue[0].p0,nodeQueue[0].p1)
				const height = nodeVector.length();
				let leavesID = [];

				// Nous devons créer leavesDensity de feuilles. Afin d'avoir un triangle équilatéral nous prenons les
				// coordonnées (0,0,0) (alpha,0,0) et (alpha/2,L,0) ou L est calculé grâce à pythagore et nous avons
				// ainsi un triangle équilatéral. Nous appliquons par la suite une translation et rotation
				// aléatoire.
				for(let  k = 0; k < leavesDensity;k++) {
					const firstPoint = new THREE.Vector3(0, 0, 0);
					// alpha*alpha??????
					const secundPoint = new THREE.Vector3(alpha, 0, 0);

					// Calcul de la valeur en Y du troisième point grâce à pythagore.
					const thirdPointY = Math.sqrt((Math.pow(alpha, 2) - Math.pow(alpha / 2, 2)));
					const thirdPoint = new THREE.Vector3(alpha / 2, thirdPointY, 0);

					// Rotation aléatoire
					let randAxis = new THREE.Vector3(Math.random(),Math.random(),Math.random());
					let randAngle = Math.random()*2*Math.PI;

					let matriceRotation = new THREE.Matrix4();
					matriceRotation.makeRotationAxis(randAxis, randAngle);

					firstPoint.applyMatrix4(matriceRotation);
					secundPoint.applyMatrix4(matriceRotation);
					thirdPoint.applyMatrix4(matriceRotation);


					let randY;
					// Si la branche n'a pas d'enfants, les feuilles doivent dépasser la longueur de la branche et
					// doit être aléatoire.
					if(nodeQueue[0].childNode.length === 0){
						randY = getRandomInsideInterval(-height,height+alpha);
					}
					else{
						randY = getRandomInsideInterval(-height,height)
					}

					// Translation aléatoire en x et en z.
					let {x, z} = getRandomInsideDisk(alpha/2);

					 let translationY = new THREE.Matrix4();
					 translationY.makeTranslation(0,randY,0);

					firstPoint.applyMatrix4(translationY);
					secundPoint.applyMatrix4(translationY);
					thirdPoint.applyMatrix4(translationY);

					 let translationMatrix = new THREE.Matrix4();
					 translationMatrix.makeTranslation(x,0,z);

					 firstPoint.applyMatrix4(translationMatrix);
					 secundPoint.applyMatrix4(translationMatrix);
					 thirdPoint.applyMatrix4(translationMatrix);



					// Nous déplaçons la feuille afin qu'elle soit bien positionner par rapport à sa branche
					let translationToBranch = new THREE.Matrix4();
					translationToBranch.makeTranslation(nodeQueue[0].p0.x + nodeVector.x / 2, nodeQueue[0].p0.y + nodeVector.y / 2, nodeQueue[0].p0.z + nodeVector.z / 2)

					firstPoint.applyMatrix4(translationToBranch);
					secundPoint.applyMatrix4(translationToBranch);
					thirdPoint.applyMatrix4(translationToBranch);

					// Nous ajoutons les points qui formeront la feuille à notre tableau.
					f32VerticesLeaves[startLeaves] = firstPoint.x
					f32VerticesLeaves[startLeaves + 1] = firstPoint.y;
					f32VerticesLeaves[startLeaves + 2] = firstPoint.z;
					nodeQueue[0].leavesIDs.push(leavesCounting);
					leavesCounting++;

					f32VerticesLeaves[startLeaves + 3] = secundPoint.x;
					f32VerticesLeaves[startLeaves + 4] = secundPoint.y;
					f32VerticesLeaves[startLeaves + 5] = secundPoint.z;
					nodeQueue[0].leavesIDs.push(leavesCounting);
					leavesCounting++

					f32VerticesLeaves[startLeaves + 6] = thirdPoint.x;
					f32VerticesLeaves[startLeaves + 7] = thirdPoint.y;
					f32VerticesLeaves[startLeaves + 8] = thirdPoint.z;
					nodeQueue[0].leavesIDs.push(leavesCounting);
					leavesCounting++
					startLeaves += 9
				}

			}

			startVIdx += nodeQueue[0].verticesIDs.length * sectionLen * 3;
			nodeQueue = nodeQueue.concat(nodeQueue[0].childNode);
			nodeQueue.splice(0,1);
		}

		console.log(f32VerticesLeaves);

		return [f32vertices,f32VerticesLeaves];
	},

	drawTreeHermiteRec: function(node, f32vertices, facesIdx, geometry, sectionsNum, sectionLen, startIdx, parentIdx) {
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