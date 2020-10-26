import { expect } from "chai";
import { EarlySettlement } from "../../../src/cards/prelude/EarlySettlement";
import { Color } from "../../../src/Color";
import { Player } from "../../../src/Player";
import { Game } from "../../../src/Game";
import { SelectSpace } from "../../../src/inputs/SelectSpace";
import { TileType } from "../../../src/TileType";
import { Resources } from "../../../src/Resources";

describe("EarlySettlement", function () {
    it("Should play", function () {
        const card = new EarlySettlement();
        const player = new Player("test", Color.BLUE, false);
        const game = new Game("foobar", [player], player);

        card.play(player, game);
        const selectSpace = game.deferredActions[0].execute() as SelectSpace;

        expect(selectSpace).not.to.eq(undefined);
        expect(player.getProduction(Resources.PLANTS)).to.eq(1);
        expect(selectSpace.cb(selectSpace.availableSpaces[0])).to.eq(undefined);
        expect(selectSpace.availableSpaces[0].player).to.eq(player);
        expect(selectSpace.availableSpaces[0].tile).not.to.eq(undefined);
        expect(selectSpace.availableSpaces[0].tile!.tileType).to.eq(TileType.CITY);
    });
});
