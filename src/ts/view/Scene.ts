interface GUISettings
{
	BaseColorFactor: string;
	BaseColorAlpha: number;
	MetallicFactor: number;
	RoughnessFactor: number;
	NormalScale: number;
	OcclusionStrength: number;
	EmissiveFactor: string;
}

class Scene
{
	private _canvas: HTMLCanvasElement;
	private _scene: THREE.Scene;
	private _mesh: THREE.Mesh; /** The currently chosen mesh*/
	private _box: THREE.Mesh;
	private _sphere: THREE.Mesh;
	private _monkey: THREE.Mesh;
	private _envMap: THREE.Texture;
	private _camera: THREE.PerspectiveCamera;
	private _controls: THREE.OrbitControls;
	private _defaultSettings: GUISettings;
	private _renderer: THREE.WebGLRenderer;

	private _eventDispatcher: THREE.EventDispatcher;

	private _geometryElementsArray: HTMLImageElement[];

	constructor()
	{
		this._canvas = <HTMLCanvasElement>document.getElementById('myCanvas');
		this._scene = new THREE.Scene();
		this._camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 2, 10000);
		this._camera.position.set(5, 10, 20);

		this._eventDispatcher = new THREE.EventDispatcher();

		const textureElementsArray = [
			document.getElementById('uploadAlbedo'),
			document.getElementById('uploadMetalness'),
			document.getElementById('uploadRoughness'),
			document.getElementById('uploadNormal'),
			document.getElementById('uploadAO'),
			document.getElementById('uploadEmissive')
		];

		for (const element of textureElementsArray)
		{
			element.addEventListener('change', this.onTextureUpload);
		}

		this._geometryElementsArray = [
			<HTMLImageElement>document.getElementById('box'),
			<HTMLImageElement>document.getElementById('sphere'),
			<HTMLImageElement>document.getElementById('monkey')
		];

		for (const element of this._geometryElementsArray)
		{
			element.addEventListener('click', this.onGeometryChange);
		}

		this.initLights();
		this.initControls();
		this.initRenderer();
		this.initSkyMap();
		this.initGui();
		this.initMeshes();
		this.initListeners();
		this.onWindowResize();
		this.animate(0);
	}

	private initLights()
	{
		const light1  = new THREE.AmbientLight(0xFFFFFF, 0.1);

		const light2  = new THREE.DirectionalLight(0xFFFFFF, 0.1);
		light2.position.set(-2, 5, -0.3);
		light2.position.normalize();

		const light3 = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.8);

		this._scene.add(light1, light2, light3);
	}

	private initControls()
	{
		this._controls = new THREE.OrbitControls(this._camera, this._canvas);
		this._controls.enablePan = false;
		this._controls.enableZoom = true;
		this._controls.enableDamping = true;
		this._controls.minDistance = this._camera.near + 2;
		this._controls.maxDistance = this._controls.minDistance*20;

		this._controls.dampingFactor = 0.07;
		this._controls.rotateSpeed = 0.2;
		this._controls.smoothZoom = true;
		this._controls.zoomDampingFactor = this._controls.dampingFactor;
		this._controls.smoothZoomSpeed = 5.0;
	}

	private initSkyMap()
	{
		const geometry = new THREE.SphereBufferGeometry(3000, 60, 40);

		this._envMap = new THREE.TextureLoader().load('assets/skymap.jpg');

		const material = new THREE.MeshBasicMaterial({
			map: this._envMap,
			side: THREE.BackSide,
			depthWrite: false
		});

		const mesh = new THREE.Mesh(geometry, material);

		this._scene.add(mesh);
	}

	private initGui()
	{
		this._defaultSettings = {
			BaseColorFactor: '#FFFFFF',
			BaseColorAlpha: 1.0,
			MetallicFactor: 0.9,
			RoughnessFactor: 0.1,
			NormalScale: 1.0,
			OcclusionStrength: 1.0,
			EmissiveFactor: '#000000'
		};

		const settings = this._defaultSettings;

		const gui = new dat.GUI();

		for (const paramName in settings)
		{
			const paramValue = settings[paramName];

			if (isNaN(paramValue))
			{
				gui.addColor(settings, paramName).name(paramName).onChange((value) =>
				{
					this.materialChanged(paramName, value);
				});
			}
			else
			{
				gui.add(settings, paramName, 0.0, 1.0).step(0.01).name(paramName).onChange((value) =>
				{
					this.materialChanged(paramName, value);
				});
			}
		}
	}

	private materialChanged = (parameterName: string, parameterValue: string | number) =>
	{
		this._eventDispatcher.dispatchEvent({type: 'materialChanged', message: {parameterName: parameterName, parameterValue: parameterValue}});
	};

	private initMeshes()
	{
		const envMap = this._envMap;
		envMap.mapping = THREE.EquirectangularReflectionMapping;
		const sphereGeometry = new THREE.SphereBufferGeometry(2, 64, 32);
		const material = new THREE.MeshStandardMaterial({
			color: this.getColorFromGUI(this._defaultSettings.BaseColorFactor),
			metalness: this._defaultSettings.MetallicFactor,
			roughness: this._defaultSettings.RoughnessFactor,
			envMap: envMap
		});

		const boxGeometry = new THREE.BoxBufferGeometry(4, 4, 4);


		THREE.DRACOLoader.setDecoderPath('libs/draco/gltf/');
		const gltfLoader = new THREE.GLTFLoader();
		gltfLoader.setDRACOLoader(new THREE.DRACOLoader());

		gltfLoader.load('assets/monkey.glb', (gltf: any) =>
		{
			const monkeyGeometry = gltf.scene.children[0].geometry;
			this._monkey = new THREE.Mesh(monkeyGeometry, material);
		});


		this._sphere = new THREE.Mesh(sphereGeometry, material);
		this._box = new THREE.Mesh(boxGeometry, material);

		this._mesh = this._sphere;
		this._scene.add(this._mesh);
	}

	private getColorFromGUI(colorInGui: string): number
	{
		const colorAsString = colorInGui.replace('#', '0x');

		return parseInt(colorAsString, 16);
	}

	private initListeners = () =>
	{
		document.getElementById('closeMaps').addEventListener('click', () =>
		{
			document.getElementById('maps').classList.toggle('closed');
		});

		this._eventDispatcher.addEventListener('materialChanged', (event: any) =>
		{
			const parameterValue = event.message.parameterValue;
			const material = <THREE.MeshStandardMaterial>this._mesh.material;
			switch (event.message.parameterName)
			{
				case 'BaseColorFactor':
					material.color.set(this.getColorFromGUI(parameterValue));
					break;

				case 'BaseColorAlpha':
					material.transparent = parameterValue < 1;
					material.opacity = parameterValue;

					break;

				case 'MetallicFactor':
					material.metalness = parameterValue;
					break;

				case 'RoughnessFactor':
					material.roughness = parameterValue;
					break;

				case 'NormalScale':
					(<any>material.normalScale).set(parameterValue, parameterValue); /** bug in definitly typed, this is a Vector2 */
					break;

				case 'OcclusionStrength':
					material.aoMapIntensity = parameterValue;
					break;

				case 'EmissiveFactor':
					material.emissive.set(this.getColorFromGUI(parameterValue));
					break;
			}

			material.needsUpdate = true;
		});
	};

	private onTextureUpload = (event: Event) =>
	{
		const file = (<any>event.currentTarget).files[0];
		const textureType = (<any>event.currentTarget).name;
		const material = <THREE.MeshStandardMaterial>this._mesh.material;

		const reader = new FileReader();

		reader.onload = (event) =>
		{
			if (!material[textureType])
			{
				material[textureType] = new THREE.Texture();
				material[textureType].image = new Image();
			}

			material[textureType].image.src = reader.result;
			material[textureType].image.onload = () =>
			{
				material[textureType].needsUpdate = true;
				material.needsUpdate = true;
			};

		};

		if (file)
		{
			reader.readAsDataURL(file);
		}
		else
		{
			/** The user can cancel it */
			if (material[textureType])
			{
				material[textureType] = null;
				material.needsUpdate = true;
			}
		}
	};

	private onGeometryChange = (event: Event) =>
	{
		const element = <any>event.currentTarget;
		const geometry = element.name;

		for (const element of this._geometryElementsArray)
		{
			element.classList.remove('active');
		}
		element.classList.add('active');

		const newMesh = this[geometry];

		this._scene.remove(this._mesh);
		this._mesh = newMesh;
		this._scene.add(this._mesh);
	};

	private initRenderer()
	{
		this._renderer = new THREE.WebGLRenderer({
			antialias: true,
			canvas: this._canvas
		});
		this._renderer.setPixelRatio(window.devicePixelRatio);
		this._renderer.setClearColor(0xECF8FF);
		this._renderer.gammaOutput = true;

		this._renderer.context.canvas.addEventListener('webglcontextlost', this.onContextLost);

		window.addEventListener('resize', this.onWindowResize, false);
	}

	private onWindowResize = () =>
	{
		this._canvas.width = 0;
		this._canvas.height = 0;

		const width = window.innerWidth;
		const height = window.innerHeight;

		this._renderer.setSize(width, height);
		this._camera.aspect = width / height;
		this._camera.updateProjectionMatrix();
	};

	private onContextLost = (event: Event) =>
	{
		event.preventDefault();

		alert('Unfortunately WebGL has crashed. Please reload the page to continue!');
	};

	private update = (time: number) =>
	{
		this._controls.update();
	};

	private animate = (time: number) =>
	{
		this.update(time);

		this._renderer.render(this._scene, this._camera);

		requestAnimationFrame(this.animate);
	};
}