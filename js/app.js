var Scene = /** @class */ (function () {
    function Scene() {
        var _this = this;
        this.materialChanged = function (parameterName, parameterValue) {
            _this._eventDispatcher.dispatchEvent({ type: 'materialChanged', message: { parameterName: parameterName, parameterValue: parameterValue } });
        };
        this.initListeners = function () {
            document.getElementById('closeMaps').addEventListener('click', function () {
                document.getElementById('maps').classList.toggle('closed');
            });
            _this._eventDispatcher.addEventListener('materialChanged', function (event) {
                var parameterValue = event.message.parameterValue;
                var material = _this._mesh.material;
                switch (event.message.parameterName) {
                    case 'BaseColorFactor':
                        material.color.set(_this.getColorFromGUI(parameterValue));
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
                        material.normalScale.set(parameterValue, parameterValue); /** bug in definitly typed, this is a Vector2 */
                        break;
                    case 'OcclusionStrength':
                        material.aoMapIntensity = parameterValue;
                        break;
                    case 'EmissiveFactor':
                        material.emissive.set(_this.getColorFromGUI(parameterValue));
                        break;
                }
                material.needsUpdate = true;
            });
        };
        this.onTextureUpload = function (event) {
            var file = event.currentTarget.files[0];
            var textureType = event.currentTarget.name;
            var material = _this._mesh.material;
            var reader = new FileReader();
            reader.onload = function (event) {
                if (!material[textureType]) {
                    material[textureType] = new THREE.Texture();
                    material[textureType].image = new Image();
                }
                material[textureType].image.src = reader.result;
                material[textureType].image.onload = function () {
                    material[textureType].needsUpdate = true;
                    material.needsUpdate = true;
                };
            };
            if (file) {
                reader.readAsDataURL(file);
            }
            else {
                /** The user can cancel it */
                if (material[textureType]) {
                    material[textureType] = null;
                    material.needsUpdate = true;
                }
            }
        };
        this.onGeometryChange = function (event) {
            var element = event.currentTarget;
            var geometry = element.name;
            for (var _i = 0, _a = _this._geometryElementsArray; _i < _a.length; _i++) {
                var element_1 = _a[_i];
                element_1.classList.remove('active');
            }
            element.classList.add('active');
            var newMesh = _this[geometry];
            _this._scene.remove(_this._mesh);
            _this._mesh = newMesh;
            _this._scene.add(_this._mesh);
        };
        this.onWindowResize = function () {
            _this._canvas.width = 0;
            _this._canvas.height = 0;
            var width = window.innerWidth;
            var height = window.innerHeight;
            _this._renderer.setSize(width, height);
            _this._camera.aspect = width / height;
            _this._camera.updateProjectionMatrix();
        };
        this.onContextLost = function (event) {
            event.preventDefault();
            alert('Unfortunately WebGL has crashed. Please reload the page to continue!');
        };
        this.update = function (time) {
            _this._controls.update();
        };
        this.animate = function (time) {
            _this.update(time);
            _this._renderer.render(_this._scene, _this._camera);
            requestAnimationFrame(_this.animate);
        };
        this._canvas = document.getElementById('myCanvas');
        this._scene = new THREE.Scene();
        this._camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 2, 10000);
        this._camera.position.set(5, 10, 20);
        this._eventDispatcher = new THREE.EventDispatcher();
        var textureElementsArray = [
            document.getElementById('uploadAlbedo'),
            document.getElementById('uploadMetalness'),
            document.getElementById('uploadRoughness'),
            document.getElementById('uploadNormal'),
            document.getElementById('uploadAO'),
            document.getElementById('uploadEmissive')
        ];
        for (var _i = 0, textureElementsArray_1 = textureElementsArray; _i < textureElementsArray_1.length; _i++) {
            var element = textureElementsArray_1[_i];
            element.addEventListener('change', this.onTextureUpload);
        }
        this._geometryElementsArray = [
            document.getElementById('box'),
            document.getElementById('sphere'),
            document.getElementById('monkey')
        ];
        for (var _a = 0, _b = this._geometryElementsArray; _a < _b.length; _a++) {
            var element = _b[_a];
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
    Scene.prototype.initLights = function () {
        var light1 = new THREE.AmbientLight(0xFFFFFF, 0.1);
        var light2 = new THREE.DirectionalLight(0xFFFFFF, 0.1);
        light2.position.set(-2, 5, -0.3);
        light2.position.normalize();
        var light3 = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.8);
        this._scene.add(light1, light2, light3);
    };
    Scene.prototype.initControls = function () {
        this._controls = new THREE.OrbitControls(this._camera, this._canvas);
        this._controls.enablePan = false;
        this._controls.enableZoom = true;
        this._controls.enableDamping = true;
        this._controls.minDistance = this._camera.near + 2;
        this._controls.maxDistance = this._controls.minDistance * 20;
        this._controls.dampingFactor = 0.07;
        this._controls.rotateSpeed = 0.2;
        this._controls.smoothZoom = true;
        this._controls.zoomDampingFactor = this._controls.dampingFactor;
        this._controls.smoothZoomSpeed = 5.0;
    };
    Scene.prototype.initSkyMap = function () {
        var geometry = new THREE.SphereBufferGeometry(3000, 60, 40);
        this._envMap = new THREE.TextureLoader().load('assets/skymap.jpg');
        var material = new THREE.MeshBasicMaterial({
            map: this._envMap,
            side: THREE.BackSide,
            depthWrite: false
        });
        var mesh = new THREE.Mesh(geometry, material);
        this._scene.add(mesh);
    };
    Scene.prototype.initGui = function () {
        var _this = this;
        this._defaultSettings = {
            BaseColorFactor: '#FFFFFF',
            BaseColorAlpha: 1.0,
            MetallicFactor: 0.9,
            RoughnessFactor: 0.1,
            NormalScale: 1.0,
            OcclusionStrength: 1.0,
            EmissiveFactor: '#000000'
        };
        var settings = this._defaultSettings;
        var gui = new dat.GUI();
        var _loop_1 = function (paramName) {
            var paramValue = settings[paramName];
            if (isNaN(paramValue)) {
                gui.addColor(settings, paramName).name(paramName).onChange(function (value) {
                    _this.materialChanged(paramName, value);
                });
            }
            else {
                gui.add(settings, paramName, 0.0, 1.0).step(0.01).name(paramName).onChange(function (value) {
                    _this.materialChanged(paramName, value);
                });
            }
        };
        for (var paramName in settings) {
            _loop_1(paramName);
        }
    };
    Scene.prototype.initMeshes = function () {
        var _this = this;
        var envMap = this._envMap;
        envMap.mapping = THREE.EquirectangularReflectionMapping;
        var sphereGeometry = new THREE.SphereBufferGeometry(2, 64, 32);
        var material = new THREE.MeshStandardMaterial({
            color: this.getColorFromGUI(this._defaultSettings.BaseColorFactor),
            metalness: this._defaultSettings.MetallicFactor,
            roughness: this._defaultSettings.RoughnessFactor,
            envMap: envMap
        });
        var boxGeometry = new THREE.BoxBufferGeometry(4, 4, 4);
        THREE.DRACOLoader.setDecoderPath('libs/draco/gltf/');
        var gltfLoader = new THREE.GLTFLoader();
        gltfLoader.setDRACOLoader(new THREE.DRACOLoader());
        gltfLoader.load('assets/monkey.glb', function (gltf) {
            var monkeyGeometry = gltf.scene.children[0].geometry;
            _this._monkey = new THREE.Mesh(monkeyGeometry, material);
        });
        this._sphere = new THREE.Mesh(sphereGeometry, material);
        this._box = new THREE.Mesh(boxGeometry, material);
        this._mesh = this._sphere;
        this._scene.add(this._mesh);
    };
    Scene.prototype.getColorFromGUI = function (colorInGui) {
        var colorAsString = colorInGui.replace('#', '0x');
        return parseInt(colorAsString, 16);
    };
    Scene.prototype.initRenderer = function () {
        this._renderer = new THREE.WebGLRenderer({
            antialias: true,
            canvas: this._canvas
        });
        this._renderer.setPixelRatio(window.devicePixelRatio);
        this._renderer.setClearColor(0xECF8FF);
        this._renderer.gammaOutput = true;
        this._renderer.context.canvas.addEventListener('webglcontextlost', this.onContextLost);
        window.addEventListener('resize', this.onWindowResize, false);
    };
    return Scene;
}());
var Model = /** @class */ (function () {
    function Model() {
    }
    return Model;
}());
///<reference path='./view/Scene.ts'/>
///<reference path='./model/Model.ts'/>
var Main = /** @class */ (function () {
    function Main() {
        Main.instance = this;
        this._model = new Model();
        this._scene = new Scene();
    }
    Main.getInstance = function () {
        return Main.instance || new Main();
    };
    Object.defineProperty(Main.prototype, "scene", {
        get: function () {
            return this._scene;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Main.prototype, "model", {
        get: function () {
            return this._model;
        },
        enumerable: true,
        configurable: true
    });
    return Main;
}());
//# sourceMappingURL=app.js.map