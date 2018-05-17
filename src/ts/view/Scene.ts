class Scene
{
	private _canvas: HTMLCanvasElement;
	private _scene: THREE.Scene;
	private _camera: THREE.PerspectiveCamera;
	private _controls: THREE.OrbitControls;
	private _renderer: THREE.WebGLRenderer;

	constructor()
	{
		this._canvas = <HTMLCanvasElement>document.getElementById('myCanvas');
		this._scene = new THREE.Scene();
		this._camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.05, 70);
		this._camera.position.set(5, 10, 20);

		this.initLights();
		this.initControls();
		this.initRenderer();
		this.initMeshes();
		this.onWindowResize();
		this.animate(0);
	}

	private initLights()
	{
		const light1  = new THREE.AmbientLight(0xFFFFFF, 0.1);

		const light2  = new THREE.DirectionalLight(0xFFFFFF, 0.1);
		light2.position.set(0.5, 0, 0.866); // ~60ยบ

		const light3 = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.8);

		this._scene.add(light1, light2, light3);
	}

	private initControls()
	{
		this._controls = new THREE.OrbitControls(this._camera, this._canvas);
		this._controls.enablePan = false;
		this._controls.enableZoom = true;
		this._controls.enableDamping = true;
		this._controls.minDistance = this._camera.near*5;
		this._controls.maxDistance = this._camera.far*0.75;

		this._controls.dampingFactor = 0.07;
		this._controls.rotateSpeed = 0.2;
		this._controls.smoothZoom = true;
		this._controls.zoomDampingFactor = this._controls.dampingFactor;
		this._controls.smoothZoomSpeed = 5.0;
	}

	private initMeshes()
	{
		const boxGeometry = new THREE.BoxBufferGeometry(5, 5, 5);
		const boxMaterial = new THREE.MeshStandardMaterial({color: 0x00AABB});
		const boxMesh     = new THREE.Mesh(boxGeometry, boxMaterial);
		this._scene.add(boxMesh);
	}

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