interface GUISettings {
    BaseColorFactor: string;
    BaseColorAlpha: number;
    MetallicFactor: number;
    RoughnessFactor: number;
    NormalScale: number;
    OcclusionStrength: number;
    EmissiveFactor: string;
}
declare class Scene {
    private _canvas;
    private _scene;
    private _mesh;
    private _box;
    private _sphere;
    private _monkey;
    private _envMap;
    private _camera;
    private _controls;
    private _defaultSettings;
    private _renderer;
    private _eventDispatcher;
    private _geometryElementsArray;
    constructor();
    private initLights();
    private initControls();
    private initSkyMap();
    private initGui();
    private materialChanged;
    private initMeshes();
    private getColorFromGUI(colorInGui);
    private initListeners;
    private onTextureUpload;
    private onGeometryChange;
    private initRenderer();
    private onWindowResize;
    private onContextLost;
    private update;
    private animate;
}
declare class Model {
    constructor();
}
declare class Main {
    static instance: Main;
    static getInstance(): Main;
    private _model;
    private _scene;
    constructor();
    readonly scene: Scene;
    readonly model: Model;
}
