import { Container } from 'inversify';
import { TYPES } from '../constants/types';
import PlayerInput from '../systems/playerInput';

const container = new Container();
container.bind<PlayerInput>(TYPES.PlayerInput).to(PlayerInput);
export default container;