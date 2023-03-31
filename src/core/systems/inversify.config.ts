// Part: src/core/systems/inversify.config.ts

import { TIME_CONTROLLER_FACTORY, TIME_SYSTEM } from "@src/core/constants";
import { ITimeController } from "@src/core/interfaces";
import { TimeController } from "@src/ecs/systems/timeController";
import { TimeSystem } from "@src/ecs/systems/timeSystem";
import { Container } from "inversify";
import { Scene } from "phaser";

const container = new Container();

container.bind<TimeSystem>(TIME_SYSTEM).to(TimeSystem);

container.bind<(scene: Scene) => ITimeController>(TIME_CONTROLLER_FACTORY).toFactory<ITimeController>((context) => {
  return (scene: Scene) => {
    return new TimeController(scene);
  };
});

export default container;
