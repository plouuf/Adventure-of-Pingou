interface IState {
  name?: string;
  onEnter?: () => void;
  onUpdate?: (dt: number) => void;
  onExit?: () => void;
}

let idCount = 0;

export default class StateMachine {
  private id = (++idCount).toString();
  private states = new Map<string, IState>();
  private context?: object;

  private previousState?: IState;
  private currentState?: IState;
  private changeStateQueue: string[] = [];

  private isSwitchingState = false;

  get previousStateName() {
    if (!this.previousState) {
      return "";
    }

    return this.previousState.name;
  }

  constructor(context?: object, id?: string) {
    this.id = id ?? this.id;
    this.context = context;
  }

  isCurrentState(name: string) {
    if (!this.currentState) {
      return false;
    }

    return this.currentState.name === name;
  }

  addState(name: string, config?: IState) {
    this.states.set(name, {
      name,
      onEnter: config?.onEnter?.bind(this.context),
      onUpdate: config?.onUpdate?.bind(this.context),
      onExit: config?.onExit?.bind(this.context),
    });

    return this;
  }

  setState(name: string) {
    if (!this.states.has(name)) {
      console.warn(`Tried to change to unknown state: ${name}`);
      return;
    }

    if (this.isCurrentState(name)) {
      return;
    }

    if (this.isSwitchingState) {
      this.changeStateQueue.push(name);
      return;
    }

    this.isSwitchingState = true;

    // console.log(
    //   `[StateMachine (${this.id}) from ${
    //     this.currentState?.name ?? "none"
    //   } to ${name}]`
    // );

    if (this.currentState && this.currentState.onExit) {
      this.currentState.onExit();
    }

    this.previousState = this.currentState;
    this.currentState = this.states.get(name)!;

    if (this.currentState.onEnter) {
      this.currentState.onEnter();
    }

    this.isSwitchingState = false;
  }

  update(dt: number) {
    if (this.changeStateQueue.length > 0) {
      this.setState(this.changeStateQueue.shift()!);
      return;
    }

    if (this.currentState && this.currentState.onUpdate) {
      this.currentState.onUpdate(dt);
    }
  }
}
