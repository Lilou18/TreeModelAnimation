/**
 * Retourne le vecteur entre entre nos points p0 et p1
 * Retourne donc le vecteur de notre branche
 * @param {vector} p0 Premier vecteur
 * @param {vector} p1 Deuxième vecteur
 */
function vectorFromPoints(p0, p1) {
	return new THREE.Vector3(
		p1.x - p0.x,
		p1.y - p0.y,
		p1.z - p0.z
	);
}

/**
 * Retourne un nombre aléatoire dans un intervalle donné
 * @param {number} min Borne inférieure
 * @param {number} max Borne supérieure
 */
function getRandomInsideInterval(min, max) {
	return (Math.random() * (max - min) + min);
}

/**
 * Retourne un x et un z aléatoire dans une zone délimitée par un rayon
 * @param {number} radius Rayon dans lequel les feuilles doivent être générées
 */
function getRandomInsideDisk(radius) {
	while (true) {
		const x = getRandomInsideInterval(-radius, radius);
		const z = getRandomInsideInterval(-radius, radius);
		if ( Math.sqrt(x**2 + z**2) < radius ) {
			return {x, z};
		}
	}
}

/**
 * Retourne une matrice de transformation 4x4 qui est une translation aléatoire
 * @param {node} node Noeud où nous sommes rendu dans l'arbre
 * @param {number} alpha Valeur alpha de la branche
 * @param {node} nodeVector Vecteur de la branche/noeud
 * @param {boolean} isAnApple Valeur booléenne qui nous permet de déterminer si ce sera la matrice de
 *                            transformation d'une pomme.
 */
function getRandomTranslation(node,alpha,nodeVector,isAnApple){

	// La moitié de la longueur de notre branche (point milieu de la branche)
	const halfHeight = nodeVector.length()/2;

	let randY;
	// Si la branche n'a pas d'enfants, les feuilles doivent dépasser la longueur de la branche et
	// doivent être aléatoire.
	if(node.childNode.length === 0 && isAnApple === false){
		randY = getRandomInsideInterval(-halfHeight, halfHeight + alpha);
	}
	else{
		// Si la branche a des enfants ses feuilles ne doivent pas dépasser la longueur de la branche et
		// doivent être aléatoire
		randY = getRandomInsideInterval(-halfHeight, halfHeight)
	}

	// Valeur de x et z aléatoire dans un rayon de alpha/2 selon les contraintes
	let {x, z} = getRandomInsideDisk(alpha/2);

	// Matrice de translation aléatoire
	let randomTranslationMatrix = new THREE.Matrix4();
	randomTranslationMatrix.makeTranslation(x,randY,z);

	return randomTranslationMatrix;
}

/**
 * Retourne une matrice de rotation aléatoire
 */
function getRandomRotationMatrix(){

	// Crée un axe aléatoire
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.random() * Math.PI;
	const randAxis = new THREE.Vector3(Math.sin(phi) * Math.sin(theta),
                                       Math.cos(phi),
                                       Math.sin(phi) * Math.cos(theta));

	// Crée un angle aléatoire
	const randAngle = Math.random() * 2 * Math.PI;

	// Crée la matrice de rotation avec les composants aléatoires
	const rotationMatrix = new THREE.Matrix4();
	rotationMatrix.makeRotationAxis(randAxis, randAngle);

	return rotationMatrix;
}

TP3.Render = {
	/**
	 * Cette fonction permettra de créer la version rough de notre arbre
	 * @param {node} rootNode Noeud de départ de l'arbre
	 * @param {scene} scene Scene où sera notre TreeRough
	 * @param {number} alpha Valeur alpha des branches
	 * @param {number} radialDivisions Nombre de subdivisions radiales des cylindres
	 * @param {number} leavesCutoff Le facteur de coupure des feuilles
	 * @param {number} leavesDensity Le nombre de feuilles par branche
	 * @param {number} applesProbability Probabilité qu'une branche ait une pomme
	 * @param {matrix} matrix Matrice identité
	 *
	 */
	drawTreeRough: function (rootNode, scene, alpha, radialDivisions = 8, leavesCutoff = 0.1, leavesDensity = 10, applesProbability = 0.05, matrix = new THREE.Matrix4()) {

		// Matériaux utilisés afin de créer nos branches, feuilles et pommes
		const leafMaterial = new THREE.MeshPhongMaterial({color: 0x3A5F0B});
		leafMaterial.side = THREE.DoubleSide;
		const appleMaterial = new THREE.MeshPhongMaterial({color: 0x5F0B0B});
		const branchMaterial = new THREE.MeshLambertMaterial({color: 0x8B5A2B});

		// Tableau de nos différents Mesh
		let branches = [];
		let apples = [];
		let leaves = [];

		// On commence à parcourir notre arbre à partir de la racine
		let nodeQueue = [rootNode];
		// Tant que l'on n'a pas traversé tous les noeuds de l'arbre
		while (nodeQueue.length > 0) {

			node = nodeQueue[0];
			// Vecteur de la branche
			const nodeVector = vectorFromPoints(node.p0, node.p1);

			// Paramètres afin de générer les cylindres qui seront nos branches
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

			// Si le nœud a un parent, nous devons utiliser l'axe et l'angle de celui-ci
			// Aussi, on doit utiliser le vecteur qui représente la branche du parent et
			// la matrice de transformation de celui-ci
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

			// Translation qui sera appliquée au cylindre et qui permet à celui-ci d'être au niveau du sol
			// puisqu'il est initialisé à (0,0,0) et donc la moitié inférieure du cylindre est dans le sol
			const translationAboveGround = new THREE.Matrix4();
			translationAboveGround.makeTranslation(0, height/2, 0);

			// Rotation qui sera appliquer au cylindre/branche
			const rotation = new THREE.Matrix4();
			rotation.makeRotationAxis(axis, angle);

			// Translation qui permettra à notre branche/cylindre d'être juste en haut du parent
			const translationAboveParent = new THREE.Matrix4();
			translationAboveParent.makeTranslation(0, parentVector.length()/2, 0);

			// Application de toutes, c'est transformations afin que notre branche soit bien placée dans l'arbre
			let transform = new THREE.Matrix4();
			transform.multiplyMatrices(translationAboveGround,transform);
			transform.multiplyMatrices(rotation,transform);
			transform.multiplyMatrices(translationAboveParent,transform);
			transform.multiplyMatrices(parentTransform,transform);

			node.transform = transform;
			branchGeometry.applyMatrix4(transform);
			// Ajoute notre branche au tableau de Mesh de branches
			branches.push(branchGeometry);

			// Si la branche est assez petite afin d'avoir des feuilles, on lui en ajoute
			if (node.a0 < alpha * leavesCutoff) {

				// On doit ajouter leavesDensity feuilles à la branche
				for (let i = 0; i < leavesDensity; i++) {
					// N.B. Les feuilles sont initialisées au milieu de la branche (origine)

					// Crée une matrice de rotation aléatoire pour la feuille
					let rotation_itself = getRandomRotationMatrix();

					// Crée une matrice de transformation qui est une translation aléatoire pour la feuille
					let translationLeaf = getRandomTranslation(node,alpha,nodeVector,false)

					let plane_geometry = new THREE.PlaneBufferGeometry(alpha, alpha);

					// Application de toutes, c'est transformations afin que nos feuilles soient bien placées
					// aléatoirement
					const leave_matrix = new THREE.Matrix4();
					leave_matrix.multiplyMatrices(rotation_itself,leave_matrix);
					leave_matrix.multiplyMatrices(translationLeaf,leave_matrix);
					leave_matrix.multiplyMatrices(transform,leave_matrix);

					plane_geometry.applyMatrix4(leave_matrix);

					// Ajoute notre feuille au tableau de Mesh de feuilles
					leaves.push(plane_geometry);
				}

			}
			// Si notre branche est assez petite pour avoir des feuilles
			if (node.a0 < alpha * leavesCutoff) {
				// N.B. Les pommes sont initialisées au milieu de la branche (origine)

				// On vérifie la probabilité qu'une pomme sois sur la branche
				if (applesProbability > Math.random()) {

					// Crée une matrice de rotation aléatoire pour la pomme
					let rotation_itself = getRandomRotationMatrix();

					// Position aléatoire de la pomme relative au nœud sur l'axe de la branche
					let randomTranslation = getRandomTranslation(node,alpha,nodeVector,true);

					const cube_geometry = new THREE.BoxBufferGeometry(alpha, alpha, alpha);

					// Application de toutes, c'est transformations afin que nos pommes soient bien placées
					// aléatoirement
					const apple_matrix = new THREE.Matrix4();
					apple_matrix.multiplyMatrices(rotation_itself,apple_matrix);
					apple_matrix.multiplyMatrices(randomTranslation,apple_matrix);
					apple_matrix.multiplyMatrices(transform,apple_matrix);

					cube_geometry.applyMatrix4(apple_matrix);

					// Ajoute notre pomme au tableau de Mesh de pommes
					apples.push(cube_geometry);
				}

			}

			nodeQueue = nodeQueue.concat(nodeQueue[0].childNode);
			nodeQueue.splice(0,1);
		}

		// Merge les différents mesh des branches, feuilles et pommes
		const mergedBranches = THREE.BufferGeometryUtils.mergeBufferGeometries(branches, false);
		const branchesMesh = new THREE.Mesh(mergedBranches, branchMaterial);
		branchesMesh.castShadow = true;

		const mergedApples = THREE.BufferGeometryUtils.mergeBufferGeometries(apples, false);
		const applesMesh = new THREE.Mesh(mergedApples, appleMaterial);
		applesMesh.castShadow = true;

		const mergedLeaves = THREE.BufferGeometryUtils.mergeBufferGeometries(leaves, false);
		const leavesMesh = new THREE.Mesh(mergedLeaves, leafMaterial);
		leavesMesh.castShadow = true;

		// Ajoute les mesh à la scène
		scene.add(branchesMesh);
		scene.add(applesMesh);
		scene.add(leavesMesh);
	},

	/**
	 * Cette fonction permettra de créer la version rough de notre arbre
	 * @param {node} rootNode Noeud de départ de l'arbre
	 * @param {scene} scene Scene où sera notre TreeRough
	 * @param {number} alpha Valeur alpha des branches
	 * @param {number} leavesCutoff Le facteur de coupure des feuilles
	 * @param {number} leavesDensity Le nombre de feuilles par branche
	 * @param {number} applesProbability Probabilité qu'une branche ait une pomme
	 * @param {matrix} matrix Matrice identité
	 *
	 */
	drawTreeHermite: function (rootNode, scene, alpha, leavesCutoff = 0.1, leavesDensity = 10, applesProbability = 0.05, matrix = new THREE.Matrix4()) {

		const branchMaterial = new THREE.MeshLambertMaterial({color: 0x8B5A2B});
		const leafMaterial = new THREE.MeshPhongMaterial({color: 0x3A5F0B});
		leafMaterial.side = THREE.DoubleSide;
		const apples_material = new THREE.MeshPhongMaterial({color: 0x5F0B0B});

		const sectionsNum = rootNode.sections.length - 1;
		const sectionLen = rootNode.sections[0].length;

		const geometry = new THREE.BufferGeometry();
		let [f32vertices,f32Leaves] = this.initializeF32Vertex(rootNode,alpha,leavesCutoff,leavesDensity);
		geometry.setAttribute("position", new THREE.BufferAttribute(f32vertices, 3));
		const facesIdx = [];


		const leaf = new THREE.BufferGeometry();
		leaf.setAttribute("position", new THREE.BufferAttribute(f32Leaves,3));
		const leavesIDx = [];

		// Mesh arrays
		let apples = [];
		let numberOfApples = 0;


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

			// Si la branche possède des feuilles nous initialisons l'index des positions des feuilles
			if(node.leavesIDs.length !== 0){

				for(let h = 0; h < leavesDensity; h++){

					for(let g = 0; g < 3; g++){
						let leaveFirstPoint = node.leavesIDs[h*3+g];
						leavesIDx.push(leaveFirstPoint);
					}

				}
			}

			// Si la branche est assez petite
			if(node.a0 < alpha * leavesCutoff){
				// Si la probabilité d'avoir une pomme est assez grande
				if(applesProbability > Math.random()){
					// Création d'une pomme ayant un rayon de alpha/2
					let apple = new THREE.SphereBufferGeometry(alpha/2);

					// Vecteur de la branche
					const nodeVector = vectorFromPoints(node.p0,node.p1)

					// Crée une matrice de translation aléatoire qu'on applique ensuite sur la pomme
					let randomTranslationMatrix = getRandomTranslation(node,alpha,nodeVector,true);
					apple.applyMatrix4(randomTranslationMatrix);

					// Nous déplaçons la feuille afin qu'elle soit bien positionner par rapport à sa branche
					let translationToBranch = new THREE.Matrix4();
					translationToBranch.makeTranslation(nodeQueue[0].p0.x + nodeVector.x / 2, nodeQueue[0].p0.y + nodeVector.y / 2, nodeQueue[0].p0.z + nodeVector.z / 2)

					apple.applyMatrix4(translationToBranch);

					apple.computeVertexNormals();

					// Ajoute notre pomme au tableau de Mesh de pommes
					apples.push(apple);

					node.applesIds.push(numberOfApples);
					numberOfApples++;

					// Nombre de points dont sont formée la pomme
					node.numberOfPOintsApples = apple.attributes.position.length /3;

				}
			}

			nodeQueue = nodeQueue.concat(nodeQueue[0].childNode);
			nodeQueue.splice(0,1);
		}

		geometry.setIndex(facesIdx);
		geometry.computeVertexNormals();
		const branchesMesh = new THREE.Mesh(geometry, branchMaterial);
		branchesMesh.castShadow = true;
		scene.add(branchesMesh);

		leaf.setIndex(leavesIDx);
		leaf.computeVertexNormals();
		const leavesMesh = new THREE.Mesh(leaf,leafMaterial);
		leavesMesh.castShadow = true;
		scene.add(leavesMesh);

		// Merge les différents mesh des pommes
		const mergedApples = THREE.BufferGeometryUtils.mergeBufferGeometries(apples,false);
		const applesMesh = new THREE.Mesh(mergedApples,apples_material);
		applesMesh.castShadow = true;
		scene.add(applesMesh);

		return [branchesMesh.geometry,leavesMesh.geometry,applesMesh.geometry]
	},

	initializeF32Vertex: function(rootNode,alpha,leavesCutoff,leavesDensity) {

		// Compteur qui permet de bien indexer les différents points des feuilles
		let leavesCounting = 0;

		let nodeQueue = [rootNode];
		let nodeNum = 0;

		// TODO est-ce que c'est vraiment utile?????
		while (nodeQueue.length > 0) {
			nodeNum++;
			nodeQueue = nodeQueue.concat(nodeQueue[0].childNode);
			nodeQueue.splice(0,1);
		}

		nodeQueue = [rootNode];

		const sectionsNum = rootNode.sections.length;
		const sectionLen = rootNode.sections[0].length;
		const f32vertices = new Float32Array(nodeNum * sectionsNum * sectionLen * 3);

		// Tableau qui contient toutes les coordonnées x,y,z des différentes feuilles
		const f32VerticesLeaves = new Float32Array(nodeNum*leavesDensity*3*3);

		let startVIdx = 0;
		// Compteur qui permet de bien indexer les différentes coordonnées des feuilles
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

				// Nous devons créer leavesDensity de feuilles. Afin d'avoir un triangle équilatéral nous prenons les
				// coordonnées (-alpha/2,-H/2,0) (0,H/2,0) et (alpha/2,-H/2,0) ou H est calculé grâce à pythagore et nous avons
				// ainsi un triangle équilatéral centré en (0,0,0). Nous appliquons par la suite une translation et rotation
				// aléatoire.

				// Calcul la hauteur de notre triangle équilatéral grâce à pythagore.
				const triangleHeight = Math.sqrt((Math.pow(alpha, 2) - Math.pow(alpha / 2, 2)));

				for(let  k = 0; k < leavesDensity;k++) {

					// Voici les 3 vecteurs utilisés afin de créer notre triangle
					const firstPoint = new THREE.Vector3(-alpha/2,-triangleHeight/2,0);
					const secondPoint = new THREE.Vector3(0,triangleHeight/2,0);
					const thirdPoint = new THREE.Vector3(alpha/2,-triangleHeight/2,0);

					// Crée une matrice de rotation aléatoire
					let rotationMatrix = getRandomRotationMatrix();

					firstPoint.applyMatrix4(rotationMatrix);
					secondPoint.applyMatrix4(rotationMatrix);
					thirdPoint.applyMatrix4(rotationMatrix);

					// Crée une matrice de translation aléatoire
					let randomTranslationMatrix = new THREE.Matrix4();
					randomTranslationMatrix = getRandomTranslation(nodeQueue[0],alpha,nodeVector,false);

					firstPoint.applyMatrix4(randomTranslationMatrix);
					secondPoint.applyMatrix4(randomTranslationMatrix);
					thirdPoint.applyMatrix4(randomTranslationMatrix);

					firstPoint.applyMatrix4(nodeQueue[0].transform);
					secondPoint.applyMatrix4(nodeQueue[0].transform);
					thirdPoint.applyMatrix4(nodeQueue[0].transform);

					// Nous déplaçons la feuille afin qu'elle soit bien positionner par rapport à sa branche
					let translationToBranch = new THREE.Matrix4();
					translationToBranch.makeTranslation(nodeQueue[0].p0.x + nodeVector.x / 2, nodeQueue[0].p0.y + nodeVector.y / 2, nodeQueue[0].p0.z + nodeVector.z / 2)

					firstPoint.applyMatrix4(translationToBranch);
					secondPoint.applyMatrix4(translationToBranch);
					thirdPoint.applyMatrix4(translationToBranch);

					// Nous ajoutons les points qui formeront la feuille à notre tableau et ajoutons c'est points
					// dans notre tableau d'indexer des feuilles.
					f32VerticesLeaves[startLeaves] = firstPoint.x
					f32VerticesLeaves[startLeaves + 1] = firstPoint.y;
					f32VerticesLeaves[startLeaves + 2] = firstPoint.z;
					nodeQueue[0].leavesIDs.push(leavesCounting);
					leavesCounting++;

					f32VerticesLeaves[startLeaves + 3] = secondPoint.x;
					f32VerticesLeaves[startLeaves + 4] = secondPoint.y;
					f32VerticesLeaves[startLeaves + 5] = secondPoint.z;
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


		return [f32vertices,f32VerticesLeaves];
	},

	/**
	 * Cette fonction permettra de mettre à jour notre arbre après l'application de forces
	 * @param {Mesh} trunkGeometryBuffer Mesh de toutes nos branches
	 * @param {Mesh} leavesGeometryBuffer Mesh de toutes nos feuilles
	 * @param {Mesh} applesGeometryBuffer Mesh de toutes nos pommes
	 * @param {node} rootNode Noeud de départ de l'arbre
	 *
	 */
	updateTreeHermite: function (trunkGeometryBuffer, leavesGeometryBuffer, applesGeometryBuffer, rootNode) {

		const sectionsNum = rootNode.sections.length - 1;
		const sectionLen = rootNode.sections[0].length;

		let applesIndex = 0;

		let nodeQueue = rootNode.childNode;
		while (nodeQueue.length > 0) {

			let node = nodeQueue[0];

			for (let i = 0; i < sectionsNum; i++) {
				for (let j = 0; j < sectionLen; j++) {

					const vertexXIdx = node.verticesIDs[i][j] * 3;
					const vertexYIdx = vertexXIdx + 1;
					const vertexZIdx = vertexXIdx + 2;

					let vertex = new THREE.Vector3(trunkGeometryBuffer[vertexXIdx],
						                           trunkGeometryBuffer[vertexYIdx],
						                           trunkGeometryBuffer[vertexZIdx]);

					const translation = new THREE.Matrix4().makeTranslation(-node.p0Prev.x,
						                                                    -node.p0Prev.y,
						                                                    -node.p0Prev.z);
					const translationBack = new THREE.Matrix4().makeTranslation(node.p0.x,
						                                                        node.p0.y,
						                                                        node.p0.z);

					vertex.applyMatrix4(translation);
					vertex.applyMatrix4(node.transform);
					vertex.applyMatrix4(translationBack);

					trunkGeometryBuffer[vertexXIdx] = vertex.x;
					trunkGeometryBuffer[vertexYIdx] = vertex.y;
					trunkGeometryBuffer[vertexZIdx] = vertex.z;

				}
			}

			// Si notre branche à des feuilles
			if(node.leavesIDs.length !== 0){

				    // Pour chacune de c'est feuilles il faut modifier les coordonnées de leurs points
					for(let h = 0; h < leavesDensity * 3; h++){

						// Index des coordonnées x,y,z d'un point d'une feuille
						const leavesVertexXIdX = node.leavesIDs[h]*3;
						const leavesVertexXIdY = leavesVertexXIdX + 1;
						const leavesVertexXIdZ = leavesVertexXIdX + 2;

						// Vecteur représentant la position d'un point d'une feuille dans la scène
						let leavesVertex =  new THREE.Vector3(leavesGeometryBuffer[leavesVertexXIdX],
							                                  leavesGeometryBuffer[leavesVertexXIdY],
							                                  leavesGeometryBuffer[leavesVertexXIdZ]);

						const translation = new THREE.Matrix4().makeTranslation(-node.p0Prev.x,
																				-node.p0Prev.y,
																				-node.p0Prev.z);
						const translationBack = new THREE.Matrix4().makeTranslation(node.p0.x,
																					node.p0.y,
																					node.p0.z);


						// Transformation appliquée à la position du point de la feuille afin qu'elle suive
						// le mouvement de force
						leavesVertex.applyMatrix4(translation);
						leavesVertex.applyMatrix4(node.transform);
						leavesVertex.applyMatrix4(translationBack);

						leavesGeometryBuffer[leavesVertexXIdX] = leavesVertex.x;
						leavesGeometryBuffer[leavesVertexXIdY] = leavesVertex.y;
						leavesGeometryBuffer[leavesVertexXIdZ] = leavesVertex.z;

					}

			}

			// Si notre branche à des pommes
			if(node.applesIds.length !== 0){
				// Pour chacune de c'est pommes il faut modifier les coordonnées de leurs points
				for(let g = 0; g < node.numberOfPOintsApples;g++){

					// Index des coordonnées x,y,z d'un point d'une pomme
					const applesVertexXIdX = applesIndex
					const applesVertexXIdY = applesVertexXIdX + 1;
					const applesVertexXIdZ = applesVertexXIdX + 2;
					applesIndex += 3

					// Vecteur représentant la position d'un point d'une pomme dans la scène
					let applesVertex =  new THREE.Vector3(applesGeometryBuffer[applesVertexXIdX],
														  applesGeometryBuffer[applesVertexXIdY],
														  applesGeometryBuffer[applesVertexXIdZ]);

					const translation = new THREE.Matrix4().makeTranslation(-node.p0Prev.x,
																			-node.p0Prev.y,
																			-node.p0Prev.z);
					const translationBack = new THREE.Matrix4().makeTranslation(node.p0.x,
																				node.p0.y,
																				node.p0.z);

					// Transformation appliquée à la position du point de la pomme afin qu'elle suive
					// le mouvement de force
					applesVertex.applyMatrix4(translation);
					applesVertex.applyMatrix4(node.transform);
					applesVertex.applyMatrix4(translationBack);

					applesGeometryBuffer[applesVertexXIdX] = applesVertex.x;
					applesGeometryBuffer[applesVertexXIdY] = applesVertex.y;
					applesGeometryBuffer[applesVertexXIdZ] = applesVertex.z;


				}

			}

			nodeQueue = nodeQueue.concat(nodeQueue[0].childNode);
			nodeQueue.splice(0,1);
		}
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