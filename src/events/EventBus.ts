import mitt, { Emitter, WildcardHandler } from 'mitt';
import logger from '@src/logger';

export type Events = Record<string, unknown>;

const EventBus: Emitter<Events> = mitt<Events>();

const wildcardHandler: WildcardHandler<Events> = (event, type) => {
  logger.debug(`Event triggered: ${String(type)}`, event);
};

EventBus.on('*', wildcardHandler);

export default EventBus;