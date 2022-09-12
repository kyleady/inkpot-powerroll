import { Config } from '../config.js';

export class PowerRollEffect4e {
  static getMatch(withoutBrackets) {
    const effects = `(?:${Object.keys(Config.EFFECT).join('|')})`;
    const effectRgx = new RegExp(`^\\s*(${effects})\\s*$`, 'i');
    return withoutBrackets.match(effectRgx);
  }

  static _createPowerRollEffect(fullTxt, withoutBrackets, effectTxt) {
    const effectKey = Object.keys(Config.EFFECT).find(rgxKey => effectTxt.match(new RegExp(`^${rgxKey}$`, 'i')));
    const durationType = Config.EFFECT[effectKey].durationType;
    const altDurationType = Config.EFFECT[effectKey].altDurationType;

    const a = document.createElement('a');
    a.classList.add('power-roll');
    a.title = durationType;
    a.dataset['action'] = 'effect';
    a.dataset['durationType'] = durationType;
    if(altDurationType) a.dataset['altDurationType'] = altDurationType;
    a.dataset['endsOnInit'] = Config.EFFECT[effectKey].endsOnInit;
    a.innerHTML = `<i class="fa-solid fa-bolt-lightning"></i> ${withoutBrackets}`;
    return a;
  }

  static _addEffect({event, actor, dataset, sourceObj}) {
    if (game.user.targets.length) {
      ui.notifications.error("Please target at least one token.");
      return;
    }

    const endsOnTarget = dataset.altDurationType && (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey);
    game.user.targets.forEach( target => {
      const combat = target?.combatant?.combat;
      const startRound = combat?.current?.round;
      const startTurn = combat?.current?.turn;
      const startTurnInit = combat?.turns?.[startTurn]?.initiative;

      let durationTurnInit = null;
      let duration = null;
      if (dataset.endsOnInit) {
        if (!endsOnTarget) {
          durationTurnInit = combat?.turns?.find(turn => turn.actorId == actor?.id)?.initiative;
        }

        if (endsOnTarget || durationTurnInit === undefined) {
          durationTurnInit = target?.combatant?.initiative;
        }

        if (durationTurnInit !== undefined) {
          duration = startRound;
          if (durationTurnInit >= startTurnInit) duration++;
        } else {
          durationTurnInit = null;
        }
      }

      const effectLabel = sourceObj?.name || "PowerRoll";
      target.actor.createEmbeddedDocuments("ActiveEffect", [{
        "label": effectLabel,
        "icon": sourceObj?.img || "icons/svg/aura.svg",
        "origin": actor?.uuid || target.actor.uuid,
        "duration.duration": duration,
        "duration.remaining": duration,
        "duration.rounds": duration,
        "duration.startRound": startRound,
        "duration.startTime": 0,
        "duration.startTurn": startTurn,
        "disabled": false,
        "flags.dnd4e.effectData.durationType": endsOnTarget ? dataset.altDurationType : dataset.durationType,
        "flags.dnd4e.effectData.startTurnInit": startTurnInit,
        "flags.dnd4e.effectData.durationTurnInit": durationTurnInit
      }]);

      const endsOnTargetTxt = endsOnTarget ? " (ends on target turn)" : "";
      canvas.interface.createScrollingText(target.center, `+ ${effectLabel}${endsOnTargetTxt}`, {
        anchor: CONST.TEXT_ANCHOR_POINTS.CENTER,
        direction: CONST.TEXT_ANCHOR_POINTS.TOP,
        distance: (2 * target.h),
        fontSize: 28,
        stroke: 0x000000,
        strokeThickness: 4,
        jitter: 0.25
      });
    });
  }
}
