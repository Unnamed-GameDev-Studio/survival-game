import biomes from '@src/biome/data/biomes';
import {
  SubmapItem,
  SubmapObject,
  SubmapTerrain,
  SubmapTile,
} from '@src/biome/data/interfaces';
import { generateOvermap } from '@src/biome/systems/overworldManager';
import { ECS_NULL } from '@src/core/config/constants';
import ControlSystem from '@src/core/systems/controlSystem';
import {
  getFocusTarget,
  updateFocusTarget,
} from '@src/entity/components/focus';
import EntityFactory from '@src/entity/factories/entityFactory';
import {
  getEntityType,
  getItemDetails,
  getStaticObjectDetails,
} from '@src/entity/systems/dataManager';
import FocusManager from '@src/entity/systems/focusManager';
import { healthSystem } from '@src/entity/systems/healthSystem';
import {
  getBoundingBox,
  getCollider,
  ICollider,
} from '@src/movement/components/collider';
import { movement } from '@src/movement/systems/movement';
import DebugPanel from '@src/telemetry/systems/debugPanel';
import { getLogger } from '@src/telemetry/systems/logger';
import { IWorld } from 'bitecs';
import RBush from 'rbush';

export default class EntityManager {
  private logger;
  private entityFactory!: EntityFactory;
  private focusManager!: FocusManager;
  private readonly world: IWorld;
  private playerId!: number;
  private debugPanel: DebugPanel;
  private controlSystem: ControlSystem;
  private objectSpatialIndex!: RBush<ICollider>;
  private overmap: SubmapTile[] = [];

  constructor(private scene: Phaser.Scene, world: IWorld) {
    this.logger = getLogger('entity');
    this.world = world;
    this.controlSystem = new ControlSystem();
    this.debugPanel = new DebugPanel();
  }

  initialize() {
    this.entityFactory = new EntityFactory(this.scene, this.world);
    this.objectSpatialIndex = new RBush<ICollider>();
    this.logger.debug('EntityManager initialized');
    this.controlSystem.initialize(this.scene);
    this.focusManager = new FocusManager(this.scene);
    this.overmap = generateOvermap(biomes);
  }

  update(adjustedDeltaTime: number) {
    healthSystem(this.world);
    movement(this.world, adjustedDeltaTime / 1000, this.objectSpatialIndex);
    this.focusManager.update(this.playerId, this.objectSpatialIndex);
  }

  switchFocus(entityId: number) {
    this.focusManager.findAndSetNewFocusTarget(
      entityId,
      this.objectSpatialIndex
    );
  }

  getObjectByEid(eid: number): ICollider | null {
    const allObjects = this.objectSpatialIndex.all();
    for (const obj of allObjects) {
      if (obj.entityId === eid) {
        return obj;
      }
    }
    return null;
  }

  spawnOvermap() {
    for (const overmapTile of this.overmap) {
      console.log(
        `Spawning overmap tile ${overmapTile.originX}, ${overmapTile.originY} of biome ${overmapTile.submapBiomeName}`
      );
      this.spawnSubmap(
        overmapTile.submapTerrain,
        overmapTile.submapObjects,
        overmapTile.submapItems
      );
    }
  }

  generateStaticObject(x: number, y: number, staticObjectId: string) {
    const safeCoordinates = this.getSafeCoordinates(x, y);

    const objectID = this.entityFactory.createEntity(
      'staticObject',
      safeCoordinates.x,
      safeCoordinates.y,
      staticObjectId
    );

    const objectDetails = getStaticObjectDetails(staticObjectId);

    if (!objectDetails) {
      this.logger.info(`No object details for ${objectID}`);
      return;
    }

    const bounds = getBoundingBox(objectID);
    if (!bounds) {
      this.logger.info(`No bounds for ${objectID}`);
    }

    this.objectSpatialIndex.insert({
      entityId: objectID,
      minX: bounds.minX,
      minY: bounds.minY,
      maxX: bounds.maxX,
      maxY: bounds.maxY,
    });

    this.logger.debugVerbose(
      `Added static object ${objectID} with texture ${staticObjectId} to spatial index`
    );
  }

  generateItem(x: number, y: number, itemId: string) {
    this.logger.info(`Generating item ${itemId} at ${x}, ${y}`);
    this.logger.info(`Entity factory: ${this.entityFactory}`);
    const objectID = this.entityFactory.createEntity('item', x, y, itemId);
    const itemDetails = getItemDetails(itemId);

    if (!itemDetails) {
      this.logger.info(`No item details for ${objectID}`);
      return;
    }

    const bounds = getBoundingBox(objectID);
    if (!bounds) {
      this.logger.info(`No bounds for ${objectID}`);
    }

    this.objectSpatialIndex.insert({
      entityId: objectID,
      minX: bounds.minX,
      minY: bounds.minY,
      maxX: bounds.maxX,
      maxY: bounds.maxY,
    });

    this.logger.debugVerbose(
      `Added item ${objectID} with texture ${itemId} to spatial index`
    );
  }

  getObjectSpatialIndex() {
    return this.objectSpatialIndex;
  }

  releaseEntity(entityType: string, entityId: number) {
    this.removeSpatialIndexEntry(entityId);
    this.entityFactory.releaseEntity(entityType, entityId);
    const playerId = this.getPlayerId();
    const playerFocusId = getFocusTarget(playerId);
    if (playerFocusId === entityId) {
      updateFocusTarget(playerId, ECS_NULL);
    }
  }

  spawnPlayer(x: number, y: number, playerId: string) {
    this.playerId = this.entityFactory.createEntity('creature', x, y, playerId);
    this.controlSystem.setPlayer(this.playerId);
    this.debugPanel.setPlayer(this.playerId);
  }

  getPlayerId() {
    return this.playerId;
  }

  removeSpatialIndexEntry(entityId: number) {
    const collider = getCollider(entityId);
    this.objectSpatialIndex.remove(collider, (a, b) => {
      return a.entityId === b.entityId;
    });
  }

  private getSafeCoordinates(
    initialX: number,
    initialY: number,
    mapWidth = 50,
    mapHeight = 50,
    tileSize = 32,
    maxAttempts = 1000,
    maxDistance = 10 // Maximum distance in tiles to look for a safe spot
  ): { x: number; y: number } {
    let safeX = initialX;
    let safeY = initialY;

    const tempBounds = {
      entityId: -1,
      minX: safeX,
      minY: safeY,
      maxX: safeX + tileSize,
      maxY: safeY + tileSize,
    };

    let attempts = 0;

    while (attempts < maxAttempts) {
      const collidingObjects = this.objectSpatialIndex.search(tempBounds);
      if (
        !collidingObjects.some((collider) => {
          const objectType = getEntityType(collider.entityId);
          return objectType !== 'tile' && objectType !== 'item';
        })
      ) {
        break;
      }

      const offsetX =
        Math.floor((Math.random() - 0.5) * 2 * maxDistance) * tileSize;
      const offsetY =
        Math.floor((Math.random() - 0.5) * 2 * maxDistance) * tileSize;

      safeX = Math.max(0, Math.min(mapWidth * tileSize, initialX + offsetX));
      safeY = Math.max(0, Math.min(mapHeight * tileSize, initialY + offsetY));

      tempBounds.minX = safeX;
      tempBounds.minY = safeY;
      tempBounds.maxX = safeX + tileSize;
      tempBounds.maxY = safeY + tileSize;

      attempts++;
    }

    if (attempts === maxAttempts) {
      this.logger.error(
        "Could not find a safe position after multiple attempts. Check the map's object density or increase the max attempts."
      );
    }

    return { x: safeX, y: safeY };
  }

  private spawnSubmap(
    submapTerrain: SubmapTerrain[],
    submapObjects: SubmapObject[],
    submapItems: SubmapItem[]
  ) {
    for (const tile of submapTerrain) {
      this.generateStaticObject(tile.x, tile.y, tile.id);
    }

    for (const object of submapObjects) {
      this.generateStaticObject(object.x, object.y, object.id);
    }

    for (const item of submapItems) {
      this.generateItem(item.x, item.y, item.id);
    }
  }
}
