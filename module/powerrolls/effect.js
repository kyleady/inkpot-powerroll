import { Config } from '../config.js';

export class PowerRollEffect4e {
  static getMatch(withoutBrackets) {
    const effects = Object.keys(Config.EFFECT).join('|');
    const commonEffects = Object.keys(Config.COMMON_EFFECTS).join('|');
    const effectRgx = new RegExp(`^\\s*(?:(?<commonEffectTxt>${commonEffects}|)\\s*(?<effectTxt>${effects})|(?<commonEffectAloneTxt>${commonEffects}))\\s*$`, 'i');
    return withoutBrackets.match(effectRgx);
  }

  static _createPowerRollEffect(withoutBrackets, {commonEffectTxt, effectTxt, commonEffectAloneTxt}, replacementTxt) {
    let durationType = 'endOfEncounter';
    let altDurationType;
    let endsOnInit;
    let statusId;
    if (commonEffectAloneTxt) {
      const commonEffectKey = Object.keys(Config.COMMON_EFFECTS).find(rgxKey => commonEffectAloneTxt.match(new RegExp(`^${rgxKey}$`, 'i')));
      statusId = Config.COMMON_EFFECTS[commonEffectKey].id;
    } else {
      const effectKey = Object.keys(Config.EFFECT).find(rgxKey => effectTxt.match(new RegExp(`^${rgxKey}$`, 'i')));
      durationType = Config.EFFECT[effectKey].durationType;
      altDurationType = Config.EFFECT[effectKey].altDurationType;
      endsOnInit = Config.EFFECT[effectKey].endsOnInit;
      if (commonEffectTxt) {
        const commonEffectKey = Object.keys(Config.COMMON_EFFECTS).find(rgxKey => commonEffectTxt.match(new RegExp(`^${rgxKey}$`, 'i')));
        statusId = Config.COMMON_EFFECTS[commonEffectKey].id;
      }
    }

    const a = document.createElement('a');
    a.classList.add('power-roll');
    a.title = durationType;
    a.dataset['action'] = 'effect';
    a.dataset['durationType'] = durationType;
    if(altDurationType) a.dataset['altDurationType'] = altDurationType;
    if(endsOnInit) a.dataset['endsOnInit'] = endsOnInit;
    if(statusId) a.dataset['statusId'] = statusId;

    a.innerHTML = `<i class="fa-${statusId ? 'solid' : 'regular'} fa-bolt-lightning"></i>`;
    a.appendChild(document.createTextNode(replacementTxt || withoutBrackets));
    return a;
  }

  static _addEffect({event, actor, dataset, emptyActor, sourceObj}) {
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
      const durationType = endsOnTarget ? dataset.altDurationType : dataset.durationType;
      const effectDefinition = {
        "label": effectLabel,
        "icon": sourceObj?.img || "icons/svg/aura.svg",
        "origin": emptyActor || !actor?.uuid ? target.actor.uuid : actor.uuid,
        "duration.duration": duration,
        "duration.remaining": duration,
        "duration.rounds": duration,
        "duration.startRound": startRound,
        "duration.startTime": 0,
        "duration.startTurn": startTurn,
        "duration.label": game.i18n.localize(isNewerVersion(game.system.version, "0.4.43") ? "DND4E" : "DND4EBETA" + Config.DURATION_LABEL[durationType]),
        "disabled": false,
        "flags.dnd4e.effectData.durationType": durationType,
        "flags.dnd4e.effectData.startTurnInit": startTurnInit,
        "flags.dnd4e.effectData.durationTurnInit": durationTurnInit
      };

      if(dataset.statusId) {
        const commonEffect = (
          CONFIG.statusEffects.find(e => e.id.split('.')[1] === dataset.statusId)
          ||
          CONFIG.statusEffects.find(e => e.id === dataset.statusId)
        );
        if ("flags" in commonEffect) {
          Object.entries(commonEffect.flags).forEach(([k, v]) => effectDefinition['flags.' + k] = v);
        } else {
          effectDefinition["flags.core.statusId"] = dataset.statusId;
        }

        effectDefinition['icon'] = commonEffect.icon;
        effectDefinition['label'] = game.i18n.localize(commonEffect.label);
      } else {
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
      }

      if (target.isOwner) {
        //directly update the effects if the current user owns the token
        target.actor.createEmbeddedDocuments("ActiveEffect", [effectDefinition]);
      } else {
        // Request an active GM to perform the update
        const activeGMs = game.users.filter(u => u.isGM && u.active);
        if (activeGMs.length == 0) {
          ui.notifications.warn("Warning: Other tokens cannot be updated while the GM is away.");
          return;
        }

        game.socket.emit('module.inkpot-powerroll', {
          gmId: activeGMs[0].id,
          effectDefinition,
          tokenId: target.id,
          sceneId: target.scene.id
        });
      }
    });
  }

  static addEffectAsGM({gmId, sceneId, tokenId, effectDefinition}) {
    if(game.user.id !== gmId) return;
    const actor = game.scenes.get(sceneId).tokens.get(tokenId).actor;
    actor.createEmbeddedDocuments("ActiveEffect", [effectDefinition]);
  }
}
