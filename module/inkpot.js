import Item4e from '../../../systems/dnd4e/module/item/entity.js';
import { PowerRoll4e } from './powerroll4e.js'

Hooks.once('init', async function() {
  //Wrap code around TextEditor.enrichHTML to replace power rolls text with power roll links
  TextEditor.enrichHTML = (function(originalEnrichHTML){
    function newEnrichHTML(content, {secrets=false, documents=true, links=true, rolls=true, rollData, ...options}={}) {
      const html = document.createElement("div");
      html.innerHTML = originalEnrichHTML.call(TextEditor, content, {secrets: secrets, documents: documents, links: links, rolls: rolls, rollData: rollData, ...options});
      let text = [];
      if ( options.entities ) documents = options.entities;

      if ( documents ) {
        text = TextEditor._getTextNodes(html);
        const rgx = new RegExp(`\\[\\[/p (.+?)\\]\\]`, 'gi');
        TextEditor._replaceTextContent(text, rgx, PowerRoll4e.createPowerRoll);
      }

      return html.innerHTML;
    }
    
    return newEnrichHTML;
  })(TextEditor.enrichHTML);
  
  //Handle power rolls when clicked inside the chat log.
  Hooks.on("renderChatLog", (app, html, data) => {
    html.on('click', 'a.power-roll', event => {
      const button = event.currentTarget;
  		const card = button.closest(".chat-card");
  		const actor = card ? Item4e._getChatCardActor(card) : undefined;
      const item = actor ? actor.items.get(card.dataset.itemId) : undefined;
      PowerRoll4e.onPowerRoll(event, actor, item);
    });
  });
  
  //Handle power rolls when clicked inside an Actor Sheet.
  Hooks.on("renderActorSheet4e", (app, html, data) => {
    html.on('click', 'a.power-roll', event => {
      const actor = app.object;
      const itemId = event.currentTarget.closest(".item")?.dataset?.itemId;
  		const item = itemId ? actor.items.get(itemId) : undefined;
      PowerRoll4e.onPowerRoll(event, actor, item);
    });
  });
  
  //Handle power rolls when clicked inside an Item Sheet.
  Hooks.on("renderItemSheet4e", (app, html, data) => {
    html.on('click', 'a.power-roll', event => {
      const item = app.object;
      const actor = item.parent;
      PowerRoll4e.onPowerRoll(event, actor, item);
    });
  });
  
  //Handle power rolls when clicked inside a Journal.
  Hooks.on("renderJournalSheet", (app, html, data) => {
    html.on('click', 'a.power-roll', event => {
      PowerRoll4e.onPowerRoll(event);
    });
  });
});