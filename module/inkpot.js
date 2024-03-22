import { PowerRoll4e } from './powerroll4e.js'

Hooks.once('init', async function() {
  CONFIG.TextEditor.enrichers.push({
    'pattern': new RegExp(`\\[\\[/p (.+?)\\]\\](?:\\{([^\\}]+)\\}|)`, 'gi'),
    'enricher': (match, options) => new Promise((res, rej) => res(PowerRoll4e.createPowerRoll(...match)))
  });

  //Handle power rolls when clicked inside the chat log.
  Hooks.on("renderChatLog", (app, html, data) => {
    html.on('click', 'a.power-roll', event => {
      const button = event.currentTarget;
      const card = button.closest(".chat-card");
      //Check the current system version as the namespace changes in 0.4.44 to remove the word Beta
      const namespace = isNewerVersion(game.system.version, "0.4.43") ? "dnd4e" : "dnd4eBeta";
      const actor = card ? game[namespace].entities.Item4e._getChatCardActor(card) : undefined;
      const item = actor ? actor.items.get(card.dataset.itemId) : undefined;
      PowerRoll4e.onPowerRoll(event, actor, item, item || actor);
    });
  });

  //Handle power rolls when clicked inside an Actor Sheet.
  Hooks.on("renderActorSheet4e", (app, html, data) => {
    html.on('click', 'a.power-roll', event => {
      const actor = app.object;
      const itemId = event.currentTarget.closest(".item")?.dataset?.itemId;
      const item = itemId ? actor.items.get(itemId) : undefined;
      PowerRoll4e.onPowerRoll(event, actor, item, item || actor);
    });
  });

  //Handle power rolls when clicked inside an Item Sheet.
  Hooks.on("renderItemSheet4e", (app, html, data) => {
    html.on('click', 'a.power-roll', event => {
      const item = app.object;
      const actor = item.parent;
      PowerRoll4e.onPowerRoll(event, actor, item, item);
    });
  });

  //Handle power rolls when clicked inside a Journal.
  Hooks.on("renderJournalSheet", (app, html, data) => {
    html.on('click', 'a.power-roll', event => {
      PowerRoll4e.onPowerRoll(event, undefined, undefined, app);
    });
  });

  //Handle powerroll effect update requests that are being piped to a specific GM
  game.socket.on('module.inkpot-powerroll', PowerRoll4e.addEffectAsGM);
});
