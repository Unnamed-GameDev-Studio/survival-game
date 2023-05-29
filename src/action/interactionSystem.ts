import { getInteractionComponent } from '@src/action/interactionComponent';
import { getLogger } from '@src/telemetry/logger';

export function interactionSystem(eid: number, interactionName: string): void {
  const interactionComponent = getInteractionComponent(eid);
  const logger = getLogger('action');
  if (interactionComponent) {
    logger.debug(`Executing interaction ${interactionName} on entity ${eid}`);
    interactionComponent.executeInteraction(interactionName, { eid });
  } else {
    logger.error(`No interaction component found for entity ${eid}`);
  }
}
