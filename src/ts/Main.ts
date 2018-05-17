///<reference path='./view/Scene.ts'/>
///<reference path='./model/Model.ts'/>

class Main
{
	public static instance: Main;
	public static getInstance(): Main
	{
		return Main.instance || new Main();
	}

	private _model: Model;
	private _scene: Scene;

	constructor()
	{
		Main.instance = this;

		this._model = new Model();
		this._scene = new Scene();
	}

	public get scene(): Scene
	{
		return this._scene;
	}

	public get model(): Model
	{
		return this._model;
	}
}