import { Config } from '../config.js';
import { PowerRollUtils4e } from '../utils.js';

export class PowerRollAttack4e {
  static getMatch(withoutBrackets) {
    const attacks = `(?:${Object.keys(Config.ATTACK).join('|')})`;
    const defs = `(${Object.keys(Config.DEFENSE).join('|')})`;
    const weapons = `(\\(\\s*(?:${Object.keys(Config.WEAPON).join('|')})\\s*\\))?`;
    const attackRgx = new RegExp(`^\\s*((?:\\+|\\-|)\\s*${attacks}\\s*(?:(?:\\+|\\-)\\s*${attacks}\\s*)*)vs.?\\s*${defs}\\s*${weapons}\\s*$`, 'i');
    return withoutBrackets.match(attackRgx);
  }

  static _createPowerRollAttack(fullTxt, withoutBrackets, atkTxt, defTxt, weaponTxt) {
    const parsedAtk = PowerRollUtils4e._toParsedData(atkTxt, '(\\+|\\-|)\\s*({})(?=(?:\\+|\\-|\\s|$))', Config.ATTACK);
    let formula = parsedAtk.map(data => `${data.match[1]}${PowerRollUtils4e._replaceWithMatches(data.data.form, data.match, 2)}`).join('');
    if (parsedAtk.some(data => data.data.type == Config.TYPES.ABILITY)) formula += '+@lvhalf';
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
      ...PowerRollUtils4e._weaponOverride(weaponTxt)
    });
    a.innerHTML = `<i class="fas fa-crosshairs"></i> ${withoutBrackets}`;
    return a;
  }
}
