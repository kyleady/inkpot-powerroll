import { Actor4e } from '../../../systems/dnd4e/module/actor/actor.js';
import { Config } from './config.js';
import Item4e from '../../../systems/dnd4e/module/item/entity.js';
import { MultiAttackRoll } from '../../../systems/dnd4e/module/roll/multi-attack-roll.js';
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
    const attackRgx = new RegExp(`^\\s*((?:\\+|\\-|)\\s*${attacks}\\s*(?:(?:\\+|\\-)\\s*${attacks}\\s*)*)vs.?\\s*${defs}\\s*$`, 'i');
    const attackMatch = withoutBrackets.match(attackRgx);
    if(attackMatch) {
      return PowerRoll4e._createPowerRollAttack(fullTxt, ...attackMatch);
    }
    
    const damages = `(?:${Object.keys(Config.DAMAGE).join('|')})`;
    const damage_types = `(?:${Config.DAMAGE_TYPES.join('|')})`;
    const damageRgx = new RegExp(`^\\s*((?:\\+|\\-|)\\s*${damages}\\s*(?:(?:\\+|\\-)\\s*${damages}\\s*)*)(?:extra|)\\s*((?:${damage_types}\\s*(?:,|)\\s*(?:and|or|)\\s*)*)\\s*damage\\s*$`, 'i');
    const damageMatch = withoutBrackets.match(damageRgx);
    if(damageMatch) {
        return PowerRoll4e._createPowerRollDamage(fullTxt, ...damageMatch);
    }
    
    const resources = `(${Object.keys(Config.RESOURCE).join('|')})`;
    const resourceRgx = new RegExp(`${resources}\\s*(\\d+)`, 'i');
    const resourceMatch = withoutBrackets.match(resourceRgx);
    if(resourceMatch) {
        return PowerRoll4e._createPowerRollResource(fullTxt, ...resourceMatch);
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
   * @param {Actor4e} actor The actor owning the context of the clicked power roll. 
   * @param {Item4e} item The item owning the context of the clicked power roll.
   */
  static async onPowerRoll(event, actor, item) {
    const button = event.currentTarget;
    const action = button.dataset.action;
		button.disabled = true;
    
    let actors;
    let emptyActor = false;
    if (!actor) {
      actors = canvas.tokens.controlled.map(x => x.actor);
      if (!actors.length) actors = [game.user.character];
      if (!actors[0]) {
        actors = [new Actor4e()];
        emptyActor = true;
      }
    } else {
      actors = [actor];
    }
    
    let itemData;
    if(!item || item.type != 'power') {
      itemData = {'name': 'PowerRoll', 'type': 'power', 'data': {'weaponType': 'any'}};
    } else {
      itemData = item.data
    }
    
    const overridesStr = button.dataset.overrides;
    if(overridesStr) {
      const overrides = JSON.parse(overridesStr);
      for (let keysStr in overrides) {
  			const keys = keysStr.split('.');
  			let ref = itemData.data;
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
    
		
		for (let eachActor of actors) {
      const tempItem = new Item4e(itemData, {'parent': eachActor});
      if ( action === "attack" ) await tempItem.rollAttack({event});
  		else if ( action === "damage" ) await tempItem.rollDamage({event});
      else if ( action === "resource") PowerRoll4e._spendResource(eachActor, button.dataset, emptyActor);
      else {
        ui.notifications.error("Unrecognized Power Roll format.");
        break;
      }
    }
    
		button.disabled = false;
  }
  
  static _createPowerRollAttack(fullTxt, withoutBrackets, atkTxt, defTxt) {
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
      'attack.def': def
    });
    a.innerHTML = `<i class="fas fa-crosshairs"></i> ${withoutBrackets}`;
    return a;
  }
  
  static _createPowerRollDamage(fullTxt, withoutBrackets, dmgTxt, ...matches) {
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
      'hit.critFormula': crit
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
  
  
  static _spendResource(actor, dataset, emptyActor) {
    if (emptyActor) {
      ui.notifications.error("Please select a token");
      return;
    }

    const actorData = actor.data.data;
    const resourceKey = Object
                          .keys(actor.data.data.resources)
                          .filter(key => actorData.resources[key].label == dataset.resource)[0];  
    if (!resourceKey) {
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
    
    actor.update({[`data.resources.${resourceKey}.value`]: Math.min(newValue, maxValue)});
  }
}
