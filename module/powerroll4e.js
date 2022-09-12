import { Config } from './config.js';
export class PowerRoll4e {
  /**
   * Replace [[/p ...]] text with Power Roll links <a class="power-roll">. Use
   * the contents of the text to determine the type of power roll and what
   * overrides the power roll should use.
   *
   * To expand what is recognized and how it is interpreted, see config.js.
   *
   * Types
   * - Attack: Takes the form [[/p <ATTACK> vs <DEF>]]
   * - Damage: Takes the form [[/p <DAMAGE> <TYPE> damage]]
   * - Resource: Takes the form [[/p <RESOURCE> \d+]]
   * - Unknown: All others
   * @param {str} fullTxt Full text matching [[/p ...]]
   * @param {str} withoutBrackets Text, without the enclosing square brackets or '/p '
   * @returns {Element} The HTML element that will replace the matched text.
   */
  static createPowerRoll(fullTxt, withoutBrackets) {
    const attacks = `(?:${Object.keys(Config.ATTACK).join('|')})`;
    const defs = `(${Object.keys(Config.DEFENSE).join('|')})`;
    const weapons = `(\\(\\s*(?:${Object.keys(Config.WEAPON).join('|')})\\s*\\))?`;
    const attackRgx = new RegExp(`^\\s*((?:\\+|\\-|)\\s*${attacks}\\s*(?:(?:\\+|\\-)\\s*${attacks}\\s*)*)vs.?\\s*${defs}\\s*${weapons}\\s*$`, 'i');
    const attackMatch = withoutBrackets.match(attackRgx);
    if(attackMatch) {
      return PowerRoll4e._createPowerRollAttack(fullTxt, ...attackMatch);
    }

    const damages = `(?:${Object.keys(Config.DAMAGE).join('|')})`;
    const damage_types = `(?:${Config.DAMAGE_TYPES.join('|')})`;
    const damageRgx = new RegExp(`^\\s*((?:\\+|\\-|)\\s*${damages}\\s*(?:(?:\\+|\\-)\\s*${damages}\\s*)*)(?:extra|)\\s*((?:${damage_types}\\s*(?:,|)\\s*(?:and|or|)\\s*)*)\\s*damage\\s*${weapons}\\s*$`, 'i');
    const damageMatch = withoutBrackets.match(damageRgx);
    if(damageMatch) {
        return PowerRoll4e._createPowerRollDamage(fullTxt, ...damageMatch);
    }

    const resources = `(${Object.keys(Config.RESOURCE).join('|')})`;
    const resourceRgx = new RegExp(`^\\s*${resources}\\s*(\\d+)\\s*$`, 'i');
    const resourceMatch = withoutBrackets.match(resourceRgx);
    if(resourceMatch) {
        return PowerRoll4e._createPowerRollResource(fullTxt, ...resourceMatch);
    }

    const effects = `(?:${Object.keys(Config.EFFECT).join('|')})`;
    const effectRgx = new RegExp(`^\\s*(${effects})\\s*$`, 'i');
    const effectMatch = withoutBrackets.match(effectRgx);
    if(effectMatch) {
        return PowerRoll4e._createPowerRollEffect(fullTxt, ...effectMatch);
    }

    return PowerRoll4e._createPowerRollUnknown(fullTxt, withoutBrackets);
  }

  /**
   * Executed when a Power Roll link is clicked. Given an actor and an item, it
   * will excute the Power Roll's action on the item as if the actor owned it.
   *
   * The Power Roll can specify arbitrary overrides to override any Item data.
   *
   * If the actor is not defined, it will default to user selected actors. If no
   * actors are selected, it will default to the user's default character. If the
   * user does not have a default character, a new blank character is used.
   *
   * If the item is not defined, it will default to a new blank item. Keep in
   * mind that the Power Roll will often be overriding the item.
   *
   * @param event Click event
   * @param {Actor4e} inputActor The actor owning the context of the clicked power roll.
   * @param {Item4e} inputItem The item owning the context of the clicked power roll.
   * @param {(Actor4e|Item4e|JournalEntry)} sourceObj The entity that contains the Power Roll.
   */
  static async onPowerRoll(event, inputActor, inputItem, sourceObj) {
    event.stopImmediatePropagation();
    const button = event.currentTarget;
    const action = button.dataset.action;
    button.disabled = true;

    let actors;
    let emptyActor = false;
    if (!inputActor) {
      actors = canvas.tokens.controlled.map(x => x.actor);
      if (!actors.length) {
        actors = [new game.dnd4eBeta.entities.Actor4e({'name': 'PowerRoll', 'type': 'NPC'})];
        emptyActor = true;
      }
    } else {
      actors = [inputActor];
    }

    let itemData;
    if(inputItem?.type != 'power') {
      itemData = {'name': 'PowerRoll', 'type': 'power', 'system': {'weaponType': 'any'}};
    } else {
      itemData = inputItem
    }

    const overridesStr = button.dataset.overrides;
    if(overridesStr) {
      const overrides = JSON.parse(overridesStr);
      for (let keysStr in overrides) {
        const keys = keysStr.split('.');
        let ref = itemData.system;
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          if (i < keys.length - 1) {
            if (!(key in ref)) ref[key] = {};
            ref = ref[key];
          } else {
            ref[key] = overrides[keysStr];
          }
        }
      }
    }

    const dataset = button.dataset;
    for (let actor of actors) {
      const item = new game.dnd4eBeta.entities.Item4e(itemData, {'parent': actor});
      if ( action === "attack" ) await item.rollAttack({event});
      else if ( action === "damage" ) await item.rollDamage({event});
      else if ( action === "resource" ) PowerRoll4e._spendResource(actor, dataset, emptyActor);
      else if ( action === "effect" ) PowerRoll4e._addEffect({event, actor, dataset, sourceObj});
      else {
        ui.notifications.error("Unrecognized Power Roll format.");
        break;
      }
    }

    button.disabled = false;
  }

  static _createPowerRollAttack(fullTxt, withoutBrackets, atkTxt, defTxt, weaponTxt) {
    const parsedAtk = PowerRoll4e._toParsedData(atkTxt, '(\\+|\\-|)\\s*({})(?=(?:\\+|\\-|\\s|$))', Config.ATTACK);
    let formula = parsedAtk.map(data => `${data.match[1]}${PowerRoll4e._replaceWithMatches(data.data.form, data.match, 2)}`).join('');
    if (parsedAtk.some(data => data.data.type == Config.TYPES.ABILITY)) formula += '+@lvhalf';
    formula += '+@atkMod+@wepAttack';

    const parsedDef = PowerRoll4e._toParsedData(defTxt, '{}', Config.DEFENSE);
    const def = parsedDef[0].data.form;

    const a = document.createElement('a');
    a.classList.add('power-roll');
    a.title = `${formula} vs. ${def}`;
    a.dataset['action'] = 'attack';
    a.dataset['overrides'] = JSON.stringify({
      'attack.formula': formula,
      'attack.def': def,
      ...PowerRoll4e._weaponOverride(weaponTxt)
    });
    a.innerHTML = `<i class="fas fa-crosshairs"></i> ${withoutBrackets}`;
    return a;
  }

  static _createPowerRollDamage(fullTxt, withoutBrackets, dmgTxt, ...matches) {
    const weaponTxt = matches.pop();
    const typeTxt = matches.pop();

    const parsedDmg = PowerRoll4e._toParsedData(dmgTxt, '(\\+|\\-|)\\s*({})(?=(?:\\+|\\-|\\s|$))', Config.DAMAGE);
    const weapons = parsedDmg
                      .map(data => PowerRoll4e._replaceWithMatches(data.data.baseQuantity, data.match, 2))
                      .filter(baseQuantity => baseQuantity);
    if(weapons.length > 1) ui.notifications.warn(`Too many weapons in: ${withoutBrackets}`);
    const baseQuantity = weapons[0] || "";

    const formula = '@dmgMod' + parsedDmg
                    .map(data => [data.match[1] || '+', PowerRoll4e._replaceWithMatches(data.data.form, data.match, 2)])
                    .filter(signAndPart => signAndPart[1])
                    .map(signAndPart => signAndPart.join(''))
                    .join('');
    const crit = '@dmgMod' + parsedDmg
                    .map(data => [data.match[1] || '+', PowerRoll4e._replaceWithMatches(data.data.type == Config.TYPES.FLAT ? data.data.form : data.data.crit, data.match, 2)])
                    .filter(signAndPart => signAndPart[1])
                    .map(signAndPart => signAndPart.join(''))
                    .join('');

    const damageType = Config.DAMAGE_TYPES
                        .filter(dmgType => typeTxt.match(new RegExp(dmgType, 'i')))
                        .reduce((obj, dmgType) => ({ ...obj, [dmgType]: true}), {});
    const typesTag = Object.keys(damageType).length ? `[${Object.keys(damageType).join()}]` : '';

    const a = document.createElement('a');
    a.classList.add('power-roll');
    a.title = `${formula}${typesTag}`;
    a.dataset['action'] = 'damage';
    a.dataset['overrides'] = JSON.stringify({
      'damage.parts': [],
      'damageCrit.parts': [],
      'damageType': damageType,
      'hit.baseQuantity': baseQuantity,
      'hit.formula': formula,
      'miss.formula': '',
      'hit.critFormula': crit,
      ...PowerRoll4e._weaponOverride(weaponTxt)
    });
    a.innerHTML = `<i class="fas fa-heart-broken"></i> ${withoutBrackets}`;
    return a;
  }

  static _createPowerRollResource(fullTxt, withoutBrackets, resourceTxt, digitTxt) {
    const resourceKey = Object.keys(Config.RESOURCE).filter(rgxKey => resourceTxt.match(new RegExp(`^${rgxKey}$`, 'i')))[0];
    const resource = Config.RESOURCE[resourceKey].name;
    const amount = Number(digitTxt);

    const a = document.createElement('a');
    a.classList.add('power-roll');
    a.title = `${resource} -= ${digitTxt}`;
    a.dataset['action'] = 'resource';
    a.dataset['resource'] = resource;
    a.dataset['amount'] = amount;
    a.innerHTML = `<i class="fas fa-arrow-alt-circle-right"></i> ${withoutBrackets}`;
    return a;
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

  static _createPowerRollUnknown(fullTxt, withoutBrackets) {
    const a = document.createElement('a');
    a.classList.add('power-roll');
    a.dataset['action'] = 'unknown';
    a.innerHTML = `<i class="fas fa-times-circle" style="color:red"></i> ${withoutBrackets}`;
    return a;
  }

  static _toParsedData(input, rgx, parsingData) {
    const parsedData = [];
    const anyOption = `(?:${Object.keys(parsingData).join('|')})`;
    const globalRgx = new RegExp(rgx.replace('{}', anyOption), 'gi');
    const allParts = input.match(globalRgx);
    for (let part of allParts) {
      for (let rgxTxt in parsingData) {
        const match = part.match(new RegExp('^' + rgx.replace('{}', rgxTxt) + '$', 'i'));
        if (match) {
          parsedData.push({
            'match': match,
            'txt': part,
            'data': parsingData[rgxTxt]
          });
          break;
        }
      }
    }

    return parsedData;
  }

  static _replaceWithMatches(txt, match, offset=0) {
    if (!txt) return undefined;
    let output = txt;
    const replaceRgx = new RegExp('(?<!\\$)\\$(\\d+)', 'i');
    let replaceMatch = output.match(replaceRgx);
    while(replaceMatch) {
      const startIndex = replaceMatch.index;
      const stopIndex = startIndex + replaceMatch[0].length;
      const replaceTxt = match[Number(replaceMatch[1]) + offset];
      output = output.substring(0, startIndex) + replaceTxt + output.substring(stopIndex);
      replaceMatch = output.match(replaceRgx);
    }

    return output;
  }

  static _weaponOverride(weaponTxt) {
    if (!weaponTxt) return {};
    const weaponParsed = PowerRoll4e._toParsedData(weaponTxt, '\\(\\s*{}\\s*\\)', Config.WEAPON);
    return {
      'weaponType': weaponParsed[0].data.form
    }
  }

  static _spendResource(actor, dataset, emptyActor) {
    if (emptyActor) {
      ui.notifications.error("Please select a token");
      return;
    }

    const actorData = actor.system;
    const resourceKey = Object
                          .keys(actorData.resources)
                          .filter(key => actorData.resources[key].label == dataset.resource)[0];
    if (resourceKey === undefined) {
      ui.notifications.error(`${actor.name} does not have a "${dataset.resource}" resource.`);
      return;
    }

    const resourceObj = actorData.resources[resourceKey];
    const originalValue = Number(resourceObj.value);
    const maxValue = Number(resourceObj.max);
    const cost = Number(dataset.amount)
    const newValue = originalValue - cost;
    if (newValue < 0) {
      ui.notifications.error(`${actor.name} has no remaining "${dataset.resource}" charges.`);
      return;
    }

    const asRoll = new Roll(`min(@resource[current] - @cost[cost], @max[max])`, {resource: originalValue, cost: cost, max: maxValue}, {});
    asRoll.toMessage({
      speaker: ChatMessage.getSpeaker({token: actor}),
      flavor: `Resource: ${dataset.resource}`,
    });

    actor.update({[`system.resources.${resourceKey}.value`]: Math.min(newValue, maxValue)});
  }

  static _addEffect({event, actor, dataset, sourceObj}) {
    if (game.user.targets.length) {
      ui.notifications.error("Please target at least one token.");
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
