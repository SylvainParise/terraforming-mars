import {Card} from '../Card';
import {CardType} from '../CardType';
import {IProjectCard} from '../IProjectCard';
import {Player} from '../../Player';
import {CardName} from '../../CardName';
import {MAX_OCEAN_TILES, REDS_RULING_POLICY_COST} from '../../constants';
import {PartyHooks} from '../../turmoil/parties/PartyHooks';
import {PartyName} from '../../turmoil/parties/PartyName';
import {PlaceOceanTile} from '../../deferredActions/PlaceOceanTile';
import {CardRequirements} from '../CardRequirements';
import {CardRenderer} from '../render/CardRenderer';

export class IceCapMelting extends Card implements IProjectCard {
  constructor() {
    super({
      cardType: CardType.EVENT,
      name: CardName.ICE_CAP_MELTING,
      cost: 5,

      requirements: CardRequirements.builder((b) => b.temperature(2)),
      metadata: {
        cardNumber: '181',
        renderData: CardRenderer.builder((b) => b.oceans(1)),
        description: 'Requires +2 C or warmer. Place 1 ocean tile.',
      },
    });
  }
  public canPlay(player: Player): boolean {
    if (!super.canPlay(player)) {
      return false;
    }
    const oceansMaxed = player.game.board.getOceansOnBoard() === MAX_OCEAN_TILES;

    if (PartyHooks.shouldApplyPolicy(player, PartyName.REDS) && !oceansMaxed) {
      return player.canAfford(player.getCardCost(this) + REDS_RULING_POLICY_COST);
    }

    return true;
  }
  public play(player: Player) {
    player.game.defer(new PlaceOceanTile(player));
    return undefined;
  }
}
