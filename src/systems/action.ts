import { Actor, Interactable } from '../entities';
import { log } from '../utilities';

export enum Actions {
  attack = 'attack',
  moveUp = 'moveUp',
  moveLeft = 'moveLeft',
  moveDown = 'moveDown',
  moveRight = 'moveRight'
}

export enum Directions {
  up = 'up',
  left = 'left',
  down = 'down',
  right = 'right'
}

export class Action {
  static interact(action: Actions, interactable?: Interactable) {
    log.debug(
      `Action: ${action} |  Focus: ${interactable?.thing.id || 'no focus'}`
    );
    switch (action) {
      case Actions.attack:
        if (interactable) {
          interactable.thing.takeDamage(1);
        } else {
          log.debug('Nothing to attack');
        }
        break;
      case Actions.moveUp:
    }
  }

  static performAction(action: Actions, actor: Actor) {
    switch (action) {
      case Actions.attack:
        this.attack(actor);
        break;
      case Actions.moveUp:
        this.move(actor, Directions.up);
        break;
      case Actions.moveDown:
        this.move(actor, Directions.down);
        break;
      case Actions.moveLeft:
        this.move(actor, Directions.left);
        break;
      case Actions.moveRight:
        this.move(actor, Directions.right);
        break;
    }
  }

  static takeDamage(interactable: Interactable, damage = 1) {
    interactable.health -= damage;
    log.info(
      `${interactable.id} took ${damage} damage, health is now ${interactable.health}`
    );
  }

  static attack(attacker: Actor) {
    const focusInteractable = attacker.getFocus();
    if (focusInteractable) {
      this.takeDamage(focusInteractable, attacker.getDamage());
      attacker.sprite?.play(`action-${attacker.getDirection()}`);
    } else {
      log.debug(`${attacker.id} has no focus to attack`);
    }
  }

  static move(interactable: Interactable, direction: Directions) {
    if (interactable.sprite) {
      const normalizedVelocity = this.calcVelocity(direction);
      interactable.sprite.setVelocity(
        normalizedVelocity.x * interactable.getSpeed(),
        normalizedVelocity.y * interactable.getSpeed()
      );
      interactable.setDirection(direction);
      interactable.sprite.play(`walk-${direction}`, true);
      if (interactable instanceof Actor) {
        interactable.clearFocus();
      }
    }
  }

  static calcVelocity(direction: string) {
    const velocity = new Phaser.Math.Vector2(0, 0);
    switch (direction) {
      case 'up':
        velocity.y -= 1;
        break;
      case 'down':
        velocity.y += 1;
        break;
      case 'left':
        velocity.x -= 1;
        break;
      case 'right':
        velocity.x += 1;
        break;
    }
    return velocity.normalize();
  }

  stop(interactable: Interactable) {
    if (interactable.sprite) {
      interactable.sprite.setVelocity(0, 0);
      interactable.sprite.play(`idle-${this.direction}`, true);
    }
  }
}