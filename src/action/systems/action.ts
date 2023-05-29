export interface ActionResult {
  message: string;
}

export interface ActionComponent {
  name: string;
  execute(entity: number): ActionResult;
}

export default class Action implements ActionComponent {
  constructor(
    public name: string,
    public execute: (entity: number) => ActionResult
  ) {}
}
