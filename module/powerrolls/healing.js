import { Config } from '../config.js';
import { PowerRollUtils4e } from '../utils.js';

export class PowerRollHealing4e {
  static getMatch(withoutBrackets) {
    const typePart = `(?<typeTxt>${Object.keys(Config.HEALING_TYPE).join('|')})`
    const formulaPart = `(?<formTxt>${PowerRollUtils4e.formulaRegExp(Config.HEALING)})`;

    const healingRgx = new RegExp(`^\\s*${typePart}.*?${formulaPart}\\s*(?:temp(?:orary|)\\s*|)(?:hit\\s*points?|hp)\\s*$`, 'i');
    const healingMatch = withoutBrackets.match(healingRgx);
    if (healingMatch) return healingMatch;

    const altHealingRgx = new RegExp(`^\\s*${typePart}\\s*(?:temp(?:orary|)\\s*|)(?:hit\\s*points?|hp).*?${formulaPart}\\s*$`, 'i');
    const altHealingMatch = withoutBrackets.match(altHealingRgx);
    if (altHealingMatch) return altHealingMatch;

    const surgeTxt = Object.keys(Config.HEALING_TYPE).find(key => Config.HEALING_TYPE[key].healing == 'surge');
    const surgeRgx = new RegExp(`^\\s*(?<typeTxt>${surgeTxt})\\s*$`, 'i');
    return withoutBrackets.match(surgeRgx);
  }

  static _createPowerRollHealing(withoutBrackets, {typeTxt, formTxt}) {
    let { parsedForm, formula} = PowerRollUtils4e.parseFormula(formTxt, Config.HEALING);
    const typeKey = Object.keys(Config.HEALING_TYPE).find(typeRgx => typeTxt.match(new RegExp(typeRgx, 'i')));
    const healType = Config.HEALING_TYPE[typeKey].healing;
    const surgeValue = parsedForm.reduce((prevValue, currData) => prevValue || currData.data.healing, '');
    if (healType && surgeValue) ui.notifications.warn("Too many healing types.");

    const a = document.createElement('a');
    a.classList.add('power-roll');
    a.title = `${formula}`;
    a.dataset['action'] = 'healing';
    a.dataset['overrides'] = JSON.stringify({
      'hit.healFormula': formula,
      'hit.healSurge': healType || surgeValue || '',
      'hit.isHealing': true
    });
    a.innerHTML = '<i class="fa fa-heart"></i>';
    a.appendChild(document.createTextNode(withoutBrackets));
    return a;
  }
}
