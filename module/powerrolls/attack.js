import { Config } from '../config.js';
import { PowerRollUtils4e } from '../utils.js';

export class PowerRollAttack4e {
  static getMatch(withoutBrackets) {
    const formula = PowerRollUtils4e.formulaRegExp();
    const defs = `${Object.keys(Config.DEFENSE).join('|')}`;
    const weapons = `\\(\\s*(?:${Object.keys(Config.WEAPON).join('|')})\\s*\\)|`;
    const attackRgx = new RegExp(`^\\s*(?<atkTxt>${formula})vs.?\\s*(?<defTxt>${defs})\\s*(?<wpnTxt>${weapons})\\s*$`, 'i');
    return withoutBrackets.match(attackRgx);
  }

  static _createPowerRollAttack(withoutBrackets, {atkTxt, defTxt, wpnTxt}) {
    let { parsedForm, formula } = PowerRollUtils4e.parseFormula(atkTxt);
    if (parsedForm.some(data => data.data.type == Config.TYPES.ABILITY)) formula += '+@lvhalf';
    formula += '+@atkMod+@wepAttack';

    const parsedDef = PowerRollUtils4e._toParsedData(defTxt, '{}', Config.DEFENSE);
    const def = parsedDef[0].data.form;

    const a = document.createElement('a');
    a.classList.add('power-roll');
    a.title = `${formula} vs. ${def}`;
    a.dataset['action'] = 'attack';
    a.dataset['overrides'] = JSON.stringify({
      'attack.formula': formula,
      'attack.def': def,
      ...PowerRollUtils4e._weaponOverride(wpnTxt)
    });
    a.innerHTML = `<i class="fas fa-crosshairs"></i> ${withoutBrackets}`;
    return a;
  }
}
