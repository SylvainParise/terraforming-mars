import { expect } from "chai";
import { Luna } from "../../src/colonies/Luna";
import { Pluto } from "../../src/colonies/Pluto";
import { DustSeals } from "../../src/cards/DustSeals";
import { Color } from "../../src/Color";
import { Player } from "../../src/Player";
import { Game,GameOptions } from "../../src/Game";
import { Resources } from "../../src/Resources";
import { OrOptions } from "../../src/inputs/OrOptions";
import { AndOptions } from "../../src/inputs/AndOptions";
import { SelectColony } from "../../src/inputs/SelectColony";
import { SelectCard } from "../../src/inputs/SelectCard";
import { IProjectCard } from "../../src/cards/IProjectCard";
import { MAX_COLONY_TRACK_POSITION } from "../../src/constants";
import { setCustomGameOptions } from "../TestingUtils";

const gameOptions = setCustomGameOptions({coloniesExtension: true}) as GameOptions;

function isBuildColonyStandardProjectAvailable(player: Player, game: Game) {
    let buildColonyIsAvailable = false;
    const availableStandardProjects = player.getAvailableStandardProjects(game) as OrOptions;
    availableStandardProjects.options.forEach(option => {
        if (option instanceof SelectColony) {
            buildColonyIsAvailable = true;
        }
    });
    return buildColonyIsAvailable;
}

function isTradeWithColonyActionAvailable(player: Player, game: Game) {
    let tradeWithColonyIsAvailable = false;
    player.takeAction(game);
    const actions = player.getWaitingFor()! as OrOptions;
    actions.options.forEach(option => {
        if (option instanceof AndOptions && option.options.slice(-1)[0] instanceof SelectColony) {
            tradeWithColonyIsAvailable = true;
        }
    });
    return tradeWithColonyIsAvailable;
}


describe("Colony", function() {
    let luna: Luna, player: Player, player2: Player, player3: Player, player4: Player, game: Game;

    beforeEach(function() {
        luna = new Luna();
        player = new Player("test", Color.BLUE, false);
        player2 = new Player("test2", Color.RED, false);
        player3 = new Player("test3", Color.YELLOW, false);
        player4 = new Player("test4", Color.GREEN, false);
        game = new Game("foobar", [player, player2, player3, player4], player, gameOptions);
        game.colonies = [ luna ];
    });

    it("Should build and give placement bonus", function() {
        expect(luna.colonies).has.lengthOf(0);
        expect(player.getProduction(Resources.MEGACREDITS)).to.eq(0);

        luna.onColonyPlaced(player, game);
        expect(luna.colonies).has.lengthOf(1);
        expect(luna.colonies[0]).to.eq(player.id);
        expect(player.getProduction(Resources.MEGACREDITS)).to.eq(2);

        luna.onColonyPlaced(player2, game);
        expect(luna.colonies).has.lengthOf(2);
        expect(luna.colonies[1]).to.eq(player2.id);
        expect(player2.getProduction(Resources.MEGACREDITS)).to.eq(2);

        luna.onColonyPlaced(player3, game);
        expect(luna.colonies).has.lengthOf(3);
        expect(luna.colonies[2]).to.eq(player3.id);
        expect(player3.getProduction(Resources.MEGACREDITS)).to.eq(2);
    });

    it("Should start with a trackPosition at 1", function() {
        game.colonies = game.colonyDealer!.drawColonies(4, [], true, true);
        game.colonies.forEach(colony => {
            expect(colony.trackPosition).to.eq(1);
        });
    });

    it("Should increase by 1 at the end of a generation", function() {
        game.colonies = game.colonyDealer!.drawColonies(4, [], true, true);
        game.colonies.forEach(colony => {
            colony.endGeneration();
            if (colony.isActive) {
                expect(colony.trackPosition).to.eq(2);
            } else {
                expect(colony.trackPosition).to.eq(1);
            }
        });
    });

    it("Should push the trackPosition if a colony is built on it", function() {
        expect(luna.trackPosition).to.eq(1);
        luna.onColonyPlaced(player, game);
        expect(luna.trackPosition).to.eq(1);
        luna.onColonyPlaced(player2, game);
        expect(luna.trackPosition).to.eq(2);
        luna.onColonyPlaced(player3, game);
        expect(luna.trackPosition).to.eq(3);
    });

    it("Should decrease trackPosition after trade", function() {
        luna.trackPosition = MAX_COLONY_TRACK_POSITION;
        luna.trade(player, game);
        game.deferredActions.runAll(() => {});
        expect(luna.trackPosition).to.eq(0);

        luna.onColonyPlaced(player, game);
        luna.onColonyPlaced(player2, game);
        luna.trackPosition = MAX_COLONY_TRACK_POSITION;
        luna.trade(player, game);
        game.deferredActions.runAll(() => {});
        expect(luna.trackPosition).to.eq(2);
    });

    it("Shouldn't increase trackPosition above max", function() {
        luna.increaseTrack(100);
        expect(luna.trackPosition).to.eq(MAX_COLONY_TRACK_POSITION);
    });

    it("Shouldn't decrease trackPosition below 0", function() {
        luna.decreaseTrack(100);
        expect(luna.trackPosition).to.eq(0);
    });

    it("Should trade", function() {
        // TODO (Lynesth): Do this better with next colony refactor PR
        const income = [ 1, 2, 4, 7, 10, 13, 17 ];
        for (let i = 0; i <= MAX_COLONY_TRACK_POSITION; i++) {
            player.megaCredits = 0;
            luna.trackPosition = i;
            luna.trade(player, game);
            game.deferredActions.runAll(() => {});
            expect(player.megaCredits).to.eq(income[i]);
        }
    });

    it("Should give trade bonus to players with colonies only", function() {
        // No colonies
        luna.trackPosition = 3; // 7 MC
        luna.trade(player, game);
        game.deferredActions.runAll(() => {});
        expect(player.megaCredits).to.eq(7);
        expect(player2.megaCredits).to.eq(0);
        expect(player3.megaCredits).to.eq(0);
        expect(player4.megaCredits).to.eq(0);
        
        // 1 colony
        player.megaCredits = 0;
        luna.trackPosition = 3; // 7 MC
        luna.onColonyPlaced(player, game);
        luna.trade(player, game);
        game.deferredActions.runAll(() => {});
        expect(player.megaCredits).to.eq(9);
        expect(player2.megaCredits).to.eq(0);
        expect(player3.megaCredits).to.eq(0);
        expect(player4.megaCredits).to.eq(0);

        // 2 colonies
        player.megaCredits = 0;
        luna.trackPosition = 3; // 7 MC
        luna.onColonyPlaced(player2, game);
        luna.trade(player2, game);
        game.deferredActions.runAll(() => {});
        expect(player.megaCredits).to.eq(2);
        expect(player2.megaCredits).to.eq(9);
        expect(player3.megaCredits).to.eq(0);
        expect(player4.megaCredits).to.eq(0);

        // 3 colonies
        player.megaCredits = 0;
        player2.megaCredits = 0;
        luna.trackPosition = 3; // 7 MC
        luna.onColonyPlaced(player3, game);
        luna.trade(player4, game);
        game.deferredActions.runAll(() => {});
        expect(player.megaCredits).to.eq(2);
        expect(player2.megaCredits).to.eq(2);
        expect(player3.megaCredits).to.eq(2);
        expect(player4.megaCredits).to.eq(7);
    });

    it("Should give trade bonus for each colony a player has", function() {
        luna.trackPosition = 3; // 7 MC
        luna.onColonyPlaced(player, game);
        luna.onColonyPlaced(player, game);
        luna.onColonyPlaced(player, game);

        luna.trade(player2, game);
        game.deferredActions.runAll(() => {});
        expect(player.megaCredits).to.eq(6);
        expect(player2.megaCredits).to.eq(7);
        expect(player3.megaCredits).to.eq(0);
        expect(player4.megaCredits).to.eq(0);
    });

    it("Should let player build a colony only if they can afford it", function() {
        expect(isBuildColonyStandardProjectAvailable(player, game)).to.be.false;

        player.megaCredits = 17;
        expect(isBuildColonyStandardProjectAvailable(player, game)).to.be.true;
    });

    it("Shouldn't let players build a colony if they already have one", function() {
        player.megaCredits = 17;

        luna.onColonyPlaced(player2, game);
        expect(isBuildColonyStandardProjectAvailable(player, game)).to.be.true;

        luna.onColonyPlaced(player, game);
        expect(isBuildColonyStandardProjectAvailable(player, game)).to.be.false;
    });

    it("Shouldn't let players build a colony if colony tile is full", function() {
        player.megaCredits = 17;
        expect(luna.isColonyFull()).to.be.false;

        luna.onColonyPlaced(player2, game);
        expect(luna.isColonyFull()).to.be.false;
        expect(isBuildColonyStandardProjectAvailable(player, game)).to.be.true;

        luna.onColonyPlaced(player3, game);
        expect(luna.isColonyFull()).to.be.false;
        expect(isBuildColonyStandardProjectAvailable(player, game)).to.be.true;

        luna.onColonyPlaced(player4, game);
        expect(luna.isColonyFull()).to.be.true;
        expect(isBuildColonyStandardProjectAvailable(player, game)).to.be.false;
    });

    it("Should let players trade only if they can afford it", function() {
        expect(isTradeWithColonyActionAvailable(player, game)).to.be.false;

        player.megaCredits = 9;
        expect(isTradeWithColonyActionAvailable(player, game)).to.be.true;

        player.megaCredits = 0;
        player.energy = 3;
        expect(isTradeWithColonyActionAvailable(player, game)).to.be.true;

        player.energy = 0;
        player.titanium = 3;
        expect(isTradeWithColonyActionAvailable(player, game)).to.be.true;
    });

    it("Shouldn't let players trade if they have no fleet", function() {
        player.titanium = 3;

        luna.trade(player, game);
        expect(isTradeWithColonyActionAvailable(player, game)).to.be.false;
    });

    it ("Shouldn't let players trade with colonies that have already been traded with", function() {
        player.titanium = 3;
        player2.titanium = 3;

        luna.trade(player, game);
        expect(isTradeWithColonyActionAvailable(player2, game)).to.be.false;
    });

    it("Testing GiveTradeBonus Deferred Action", function() {
        const card = new DustSeals();
        player.cardsInHand.push(card);
        player2.cardsInHand.push(card);
        player3.cardsInHand.push(card);

        const pluto = new Pluto();
        pluto.onColonyPlaced(player, game);
        pluto.onColonyPlaced(player2, game);
        pluto.onColonyPlaced(player3, game);
        pluto.trade(player4, game);

        let callbackWasCalled = false;
        game.deferredActions.runAll(() => { callbackWasCalled = true });
        expect(callbackWasCalled).to.be.false;

        const input = player.getWaitingFor()! as SelectCard<IProjectCard>;
        expect(input).to.be.an.instanceof(SelectCard);
        player.process(game, [["Dust Seals"]]); // Discard a card
        expect(callbackWasCalled).to.be.false;

        const input2 = player2.getWaitingFor()! as SelectCard<IProjectCard>;
        expect(input2).to.be.an.instanceof(SelectCard);
        player2.process(game, [["Dust Seals"]]); // Discard a card
        expect(callbackWasCalled).to.be.false;

        const input3 = player3.getWaitingFor()! as SelectCard<IProjectCard>;
        expect(input3).to.be.an.instanceof(SelectCard);
        player3.process(game, [["Dust Seals"]]); // Discard a card
        expect(callbackWasCalled).to.be.true;
    });
});