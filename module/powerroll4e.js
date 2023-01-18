import { PowerRollAttack4e } from './powerrolls/attack.js';
import { PowerRollDamage4e } from './powerrolls/damage.js';
import { PowerRollEffect4e } from './powerrolls/effect.js';
import { PowerRollHealing4e } from './powerrolls/healing.js';
import { PowerRollResource4e } from './powerrolls/resource.js';

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
  static createPowerRoll(fullTxt, withoutBrackets, replacementTxt) {
    const attackMatch = PowerRollAttack4e.getMatch(withoutBrackets);
    if(attackMatch) {
      return PowerRollAttack4e._createPowerRollAttack(attackMatch[0], attackMatch.groups, replacementTxt);
    }

    const damageMatch = PowerRollDamage4e.getMatch(withoutBrackets);
    if(damageMatch) {
        return PowerRollDamage4e._createPowerRollDamage(damageMatch[0], damageMatch.groups, replacementTxt);
    }

    const resourceMatch = PowerRollResource4e.getMatch(withoutBrackets);
    if(resourceMatch) {
        return PowerRollResource4e._createPowerRollResource(resourceMatch[0], resourceMatch.groups, replacementTxt);
    }

    const effectMatch = PowerRollEffect4e.getMatch(withoutBrackets);
    if(effectMatch) {
        return PowerRollEffect4e._createPowerRollEffect(effectMatch[0], effectMatch.groups, replacementTxt);
    }

    const healingMatch = PowerRollHealing4e.getMatch(withoutBrackets);
    if(healingMatch) {
        return PowerRollHealing4e._createPowerRollHealing(healingMatch[0], healingMatch.groups, replacementTxt);
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
      itemData = JSON.parse(JSON.stringify(inputItem));
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
      else if ( action === "resource" ) PowerRollResource4e._spendResource(actor, dataset, emptyActor);
      else if ( action === "effect" ) PowerRollEffect4e._addEffect({event, actor, dataset, emptyActor, sourceObj});
      else if ( action === "healing" ) await item.rollHealing({event});
      else {
        ui.notifications.error("Unrecognized Power Roll format.");
        break;
      }
    }

    button.disabled = false;
  }

  /**
   * A function called when requesting a GM to add an effect to a token.
   *
   * @param options.gmId The id of the GM that will add the effect.
   * @param options.sceneId The id of the scene that the token is in.
   * @param options.tokenId The id of the token that will gain the effect.
   * @param options.effectDefinition The effect document that will be added to
   *   the token.
   */
  static addEffectAsGM(options) {
    PowerRollEffect4e.addEffectAsGM(options);
  }

  static _createPowerRollUnknown(fullTxt, withoutBrackets) {
    const a = document.createElement('a');
    a.classList.add('power-roll');
    a.dataset['action'] = 'unknown';
    a.innerHTML = `<i class="fas fa-times-circle" style="color:red"></i> ${withoutBrackets}`;
    return a;
  }
}
