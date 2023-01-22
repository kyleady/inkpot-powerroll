import { Config } from '../config.js';

export class PowerRollResource4e {
  static getMatch(withoutBrackets) {
    const resources = `(?<resourceTxt>${Object.keys(Config.RESOURCE).join('|')})`;
    const resourceRgx = new RegExp(`^\\s*${resources}\\s*(?<digitTxt>\\d*)\\s*$`, 'i');
    return withoutBrackets.match(resourceRgx);
  }

  static _createPowerRollResource(withoutBrackets, {resourceTxt, digitTxt}, replacementTxt) {
    digitTxt = digitTxt || '1';
    const resourceKey = Object.keys(Config.RESOURCE).filter(rgxKey => resourceTxt.match(new RegExp(`^${rgxKey}$`, 'i')))[0];
    const resource = Config.RESOURCE[resourceKey].name;
    const amount = Number(digitTxt);

    const a = document.createElement('a');
    a.classList.add('power-roll');
    a.title = `${resource} -= ${digitTxt}`;
    a.dataset['action'] = 'resource';
    a.dataset['resource'] = resource;
    a.dataset['amount'] = amount;
    a.innerHTML = '<i class="fas fa-arrow-alt-circle-right"></i>';
    a.appendChild(document.createTextNode(replacementTxt || withoutBrackets));
    return a;
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
}
