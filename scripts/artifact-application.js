const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class ArtifactGeneratorApplication extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(options = {}) {
    super(options);
    
    this.currentTargetItem = null; 
    
    this.effectsTable = [
      { id: "slot1", category: "characteristics", subcategory: "all", effect: "", strength: 1 },
      { id: "slot2", category: "characteristics", subcategory: "all", effect: "", strength: 1 },
      { id: "slot3", category: "characteristics", subcategory: "all", effect: "", strength: 1 }
    ];

    this.uiState = {
        activeCategory: "profan",
        domainProfane: "",
        domainGeweiht: "",
        domainDaemonisch: "",
        isPermanent: false,
        charges: 0 // ANFORDERUNG 1: Startwert im Code auf 0 gesetzt
    };

    this.translationMaps = {
        skills: {
            "body": "Körpertalente",
            "social": "Gesellschaftstalente",
            "nature": "Naturtalente",
            "knowledge": "Wissenstalente",
            "trade": "Handwerkstalente"
        },
        combatskills: {
            "melee": "Nahkampf",
            "range": "Fernkampf"
        }
    };

    this.dsaSystemData = {
      characteristics: {},
      derivedAttributes: {},
      skills: {}, 
      combatskills: {}, 
      geweihteTraditionen: {},
      daemonischeDomänen: {}
    };

    this._dragDrop = new foundry.applications.ux.DragDrop({
        dropSelector: "#artifact-source-drop",
        callbacks: { drop: this._onDrop.bind(this) }
    });

    this._loadDsaSystemData();
  }

  _loadDsaSystemData() {
    if (!game.dsa5 || !game.dsa5.config) return;
    const config = game.dsa5.config;

    for (let [key, val] of Object.entries(config.characteristics || {})) {
      this.dsaSystemData.characteristics[key] = game.i18n.localize(val);
    }

    this.dsaSystemData.derivedAttributes = {
      wounds: "Lebensenergie (LeP)",
      astralenergy: "Astralenergie (AsP)",
      karmaenergy: "Karmaenergie (KaP)",
      soulpower: "Seelenkraft (SK)",
      toughness: "Zähigkeit (ZK)",
      speed: "Geschwindigkeit (GS)"
    };

    this.dsaSystemData.geweihteTraditionen = {
        praios: { label: "Praios", info: "Aspekte: Gerechtigkeit, Wahrheit, Gesetz, Sonne, Ordnung", name: "Praios" },
        rondra: { label: "Rondra", info: "Aspekte: Sturm, Mut, ehrenhafter Kampf, Schutz, Krieg", name: "Rondra" },
        efferd: { label: "Efferd", info: "Aspekte: Meer, Wasser, Wind, Launenhaftigkeit, Seefahrt", name: "Efferd" },
        travia: { label: "Travia", info: "Aspekte: Heim, Herd, Gastfreundschaft, Ehe, Familie", name: "Travia" },
        boron: { label: "Boron", info: "Aspekte: Tod, Schlaf, Vergessen, Schweigen, Träume", name: "Boron" },
        hesinde: { label: "Hesinde", info: "Aspekte: Wissen, Magie, Kunst, Weisheit, Wissenschaft", name: "Hesinde" },
        firun: { label: "Firun", info: "Aspekte: Winter, Jagd, Eis, Unbeugsamkeit, Askese", name: "Firun" },
        tsa: { label: "Tsa", info: "Aspekte: Leben, Jugend, Wandel, Freiheit, Kreativität", name: "Tsa" },
        phex: { label: "Phex", info: "Aspekte: Handel, Diebe, List, Nacht, Nebel, Glück", name: "Phex" },
        peraine: { label: "Peraine", info: "Aspekte: Heilung, Landwirtschaft, Natur, Handwerk, Fürsorge", name: "Peraine" },
        ingerimm: { label: "Ingerimm", info: "Aspekte: Feuer, Schmiedekunst, Erz, Fleiß, Werkzeuge", name: "Ingerimm" },
        rahja: { label: "Rahja", info: "Aspekte: Liebe, Schönheit, Wein, Lebensfreude, Rausch", name: "Rahja" },
        swafnir: { label: "Swafnir", info: "Aspekte: Wale, Mut, Seefahrt, Kampf gegen das Böse", name: "Swafnir" },
        kor: { label: "Kor", info: "Aspekte: Guter Kampf, Söldner, Blut, unbarmherzige Strenge", name: "Kor" },
        nandus: { label: "Nandus", info: "Aspekte: Bildung, Erkenntnis, Rätsel, Strategie, Lehre", name: "Nandus" },
        ifirn: { label: "Ifirn", info: "Aspekte: Milde des Winters, Hilfsbereitschaft, Barmherzigkeit", name: "Ifirn" },
        marbo: { label: "Marbo", info: "Aspekte: Sanfter Tod, Linderung, Schlaf, Alterslose Schönheit, Gedenken", name: "Marbo" },
        aves: { label: "Aves", info: "Aspekte: Reise, Freiheit, Abenteuer, Entdeckung, Vögel", name: "Aves" }
    };

    this.dsaSystemData.daemonischeDomänen = {
        blakharaz: { label: "Blakharaz (Widersacher: Praios)", info: "Domäne: Tykra'man\nMerkmale: Rache, Tyrannei, Sklaverei, Grausamkeit, Ungerechtigkeit", features: "Rache, Tyrannei, Sklaverei, Grausamkeit, Ungerechtigkeit", name: "Blakharaz" },
        belhalhar: { label: "Belhalhar (Widersacher: Rondra)", info: "Domäne: Xarfai\nMerkmale: Massaker, Blutrausch, schrankenlose Gewalt, Feigheit, Sadismus", features: "Massaker, Blutrausch, schrankenlose Gewalt, Feigheit, Sadismus", name: "Belhalhar" },
        charyptoroth: { label: "Charyptoroth (Widersacher: Efferd)", info: "Domäne: Gal'k'zuul\nMerkmale: Seemonster, reißende Strudel, Schiffbruch, Verderbnis der Meere", features: "Seemonster, reißende Strudel, Schiffbruch, Verderbnis der Meere", name: "Charyptoroth" },
        lolgramoth: { label: "Lolgramoth (Widersacher: Travia)", info: "Domäne: Thezzphai\nMerkmale: Verrat, Eidbruch, Zwietracht, Heimatlosigkeit, Rastlosigkeit", features: "Verrat, Eidbruch, Zwietracht, Heimatlosigkeit, Rastlosigkeit", name: "Lolgramoth" },
        thargunitoth: { label: "Thargunitoth (Widersacher: Boron)", info: "Domäne: Tijakool\nMerkmale: Nekromantie, Untod, Grabschändung, Alpträume, Seelenraub", features: "Nekromantie, Untod, Grabschändung, Alpträume, Seelenraub", name: "Thargunitoth" },
        amazeroth: { label: "Amazeroth (Widersacher: Hesinde)", info: "Domäne: Iribaar\nMerkmale: Wahnsinn, Trugbilder, verbotenes Wissen, Verblendung, Hybris", features: "Wahnsinn, Trugbilder, verbotenes Wissen, Verblendung, Hybris", name: "Amazeroth" },
        belshirash: { label: "Belshirash (Widersacher: Firun)", info: "Domäne: Nagrach\nMerkmale: Erbarmungslose Jagd, mörderische Kälte, Eis, Frost, Blutgier", features: "Erbarmungslose Jagd, mörderische Kälte, Eis, Frost, Blutgier", name: "Belshirash" },
        asfaloth: { label: "Asfaloth (Widersacher: Tsa)", info: "Domäne: Calijnaar\nMerkmale: Chimärenschöpfung, bösartige Mutation, Deformation, Hässlichkeit", features: "Chimärenschöpfung, bösartige Mutation, Deformation, Hässlichkeit", name: "Asfaloth" },
        tasfarelel: { label: "Tasfarelel (Widersacher: Phex)", info: "Domäne: Zholvar\nMerkmale: Gier, Geiz, Diebstahl, Seelenhandel, korrupter Reichtum", features: "Gier, Geiz, Diebstahl, Seelenhandel, korrupter Reichtum", name: "Tasfarelel" },
        belzhorash: { label: "Belzhorash (Widersacher: Peraine)", info: "Domäne: Mishkara\nMerkmale: Seuchen, Pestilenz, Verrottung, schleichendes Gift, Ungeziefer", features: "Seuchen, Pestilenz, Verrottung, schleichendes Gift, Ungeziefer", name: "Belzhorash" },
        agrimoth: { label: "Agrimoth (Widersacher: Ingerimm)", info: "Domäne: Widharcal\nMerkmale: Zerstörung, Verkehrung der Elemente, unheiliges Handwerk", features: "Zerstörung, Verkehrung der Elemente, unheiliges Handwerk", name: "Agrimoth" },
        belkelel: { label: "Belkelel (Widersacher: Rahja)", info: "Domäne: Dar-Klajid\nMerkmale: Blutige Ekstase, Wollust, Sittenlosigkeit, schändliche Verführung", features: "Blutige Ekstase, Wollust, Sittenlosigkeit, schändliche Verführung", name: "Belkelel" },
        namenloser: { label: "(Namenloser) (Widersacher: keiner)", info: "Domäne: Abgrund\nMerkmale: Gottlosigkeit, Verschlingung der Schöpfung, ewige Leere", features: "Gottlosigkeit, Verschlingung der Schöpfung, ewige Leere", name: "(Namenloser)" },
        aphasmayra: { label: "Aphasmayra (Widersacher: keiner)", info: "Domäne: Ghorgumor\nMerkmale: Katzenhafte Tücke, nächtlicher Terror, Hochmut, Alpträume", features: "Katzenhafte Tücke, nächtlicher Terror, Hochmut, Alpträume", name: "Aphasmayra" },
        aphestadil: { label: "Aphestadil (Widersacher: keiner)", info: "Domäne: Avastada\nMerkmale: Maßlosigkeit, Völlerei, Teilnahmslosigkeit, lähmende Trägheit", features: "Maßlosigkeit, Völlerei, Teilnahmslosigkeit, lähmende Trägheit", name: "Aphestadil" },
        heskatet: { label: "Heskatet (Widersacher: Satinav)", info: "Domäne: Eskates\nMerkmale: Gestohlene Zeit, ewige Zeitschleifen, Vergessen, Limbus-Gewalt", features: "Gestohlene Zeit, ewige Zeitschleifen, Vergessen, Limbus-Gewalt", name: "Heskatet" }
    };
  }

  static DEFAULT_OPTIONS = {
    id: "dsa5-artifact-generator-dialog",
    window: { title: "DSA5 Artefakt & Talisman Wandler", controls: [], minimizable: true, resizable: true },
    position: { width: 620, height: "auto" },
    tag: "form",
    uniqueId: "dsa5-artifact-generator"
  };

  static PARTS = { form: { template: "modules/dsa5-artifact-generator/templates/generator-dialog.html" } };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.effects = this.effectsTable;
    context.hasItem = !!this.currentTargetItem;
    
    context.geweihteTraditionen = this.dsaSystemData.geweihteTraditionen;
    context.daemonischeDomänen = this.dsaSystemData.daemonischeDomänen;
    
    context.activeCategory = this.uiState.activeCategory;
    context.domainProfane = this.uiState.domainProfane;
    context.domainGeweiht = this.uiState.domainGeweiht;
    context.domainDaemonisch = this.uiState.domainDaemonisch;
    context.isPermanent = this.uiState.isPermanent;
    context.charges = this.uiState.charges;

    if (this.currentTargetItem) {
        context.itemName = this.currentTargetItem.name;
        context.artifactPrice = this.currentTargetItem.system.price?.value || 0;
    } else {
        context.itemName = ""; context.artifactPrice = 0;
    }
    return context;
  }

  _onRender(context, options) {
    super._onRender(context, options);
    const html = this.element;
    this._dragDrop.bind(html);

    this.effectsTable.forEach(row => { this._updateSubGroups(row.id); });

    this._toggleChargesVisibility(this.uiState.activeCategory);

    html.querySelector(".source-category-select")?.addEventListener("change", (e) => {
        const selectedCat = e.target.value;
        this.uiState.activeCategory = selectedCat;
        
        html.querySelectorAll(".sub-category-field").forEach(el => el.style.display = "none");
        const targetField = html.querySelector(`#field-${selectedCat}`);
        if (targetField) targetField.style.display = "flex";
        
        this._toggleChargesVisibility(selectedCat);
        this._updateInfoBoxes(); 
    });

    html.querySelector(".god-select")?.addEventListener("change", (e) => { this.uiState.domainGeweiht = e.target.value; this._updateInfoBoxes(); });
    html.querySelector(".daemon-select")?.addEventListener("change", (e) => { this.uiState.domainDaemonisch = e.target.value; this._updateInfoBoxes(); });

    html.querySelector('input[name="isPermanent"]')?.addEventListener("change", (e) => {
        this.uiState.isPermanent = e.target.checked;
        html.querySelector('#charges-input-field').style.display = e.target.checked ? "block" : "none";
    });

    html.addEventListener("change", (event) => {
        const rowEl = event.target.closest("tr");
        if (!rowEl) return;
        const rowId = rowEl.dataset.rowId;
        const row = this.effectsTable.find(r => r.id === rowId);
        if (!row) return;

        if (event.target.classList.contains("category-select")) {
            row.category = event.target.value; row.subcategory = ""; row.effect = "";
            this._updateSubGroups(rowId);
        }
        if (event.target.classList.contains("subcategory-select")) {
            row.subcategory = event.target.value; row.effect = "";
            this._updateEffects(rowId);
        }
        if (event.target.classList.contains("effect-select")) {
            row.effect = event.target.value;
        }
        if (event.target.classList.contains("strength-input")) {
            let num = parseInt(event.target.value) || 0; // Erlaubt ab jetzt 0 als Eingabe
            event.target.value = num; row.strength = num;
        }
    });

    html.querySelector(".submit-generator")?.addEventListener("click", async (event) => {
        event.preventDefault(); this._saveCurrentState(); await this._transformTargetItem(); this.close();
    });

    this._updateInfoBoxes();
  }

  _toggleChargesVisibility(category) {
      const chargesGroup = this.element.querySelector(".charges-form-group");
      if (chargesGroup) {
          chargesGroup.style.display = (category === "profan") ? "none" : "flex";
      }
  }

  _updateSubGroups(rowId) {
    const rowEl = this.element.querySelector(`tr[data-row-id="${rowId}"]`);
    if (!rowEl) return;
    
    const subTD = rowEl.querySelector(".td-subcategory");
    const subSelect = rowEl.querySelector(".subcategory-select");
    const category = rowEl.querySelector(".category-select").value;
    const row = this.effectsTable.find(r => r.id === rowId);

    subSelect.innerHTML = "";

    if (category === "characteristics" || category === "derivedAttributes") {
        if (subTD) subTD.style.visibility = "hidden"; 
        let opt = document.createElement("option"); opt.value = "all"; opt.textContent = "Standard";
        subSelect.appendChild(opt);
        row.subcategory = "all";
    } else {
        if (subTD) subTD.style.visibility = "visible"; 
        const sourceData = this.dsaSystemData[category] || {};
        const labelMap = this.translationMaps[category] || {};
        
        Object.keys(sourceData).forEach(key => {
            let opt = document.createElement("option"); opt.value = key; 
            opt.textContent = labelMap[key] || key;
            if (key === row.subcategory) opt.selected = true;
            subSelect.appendChild(opt);
        });

        if ((row.subcategory === "" || !sourceData[row.subcategory]) && subSelect.options.length > 0) {
            row.subcategory = subSelect.options[0].value;
        }
    }

    this._updateEffects(rowId);
  }

  _updateEffects(rowId) {
    const rowEl = this.element.querySelector(`tr[data-row-id="${rowId}"]`);
    if (!rowEl) return;
    const effSelect = rowEl.querySelector(".effect-select");
    const category = rowEl.querySelector(".category-select").value;
    const subcategory = rowEl.querySelector(".subcategory-select").value;
    const row = this.effectsTable.find(r => r.id === rowId);

    effSelect.innerHTML = "";
    
    const options = (category === "skills" || category === "combatskills") 
        ? (this.dsaSystemData[category]?.[subcategory] || {}) 
        : (this.dsaSystemData[category] || {});

    const sortedEntries = Object.entries(options).sort((a, b) => a[1].localeCompare(b[1]));
    
    sortedEntries.forEach(([key, label]) => {
        let opt = document.createElement("option"); opt.value = key; opt.textContent = label;
        if (key === row.effect) opt.selected = true;
        effSelect.appendChild(opt);
    });

    if (effSelect.options.length > 0 && row.effect === "") {
        row.effect = effSelect.options[0].value;
    }
  }

  async _onDrop(event) {
    event.preventDefault();
    try {
        const data = JSON.parse(event.dataTransfer.getData("text/plain"));
        if (data.type !== "Item") return;
        const item = await Item.fromDropData(data);
        if (!["equipment", "meleeweapon", "rangeweapon", "armor"].includes(item.type)) {
            ui.notifications.warn("Ungültiger Gegenstandstyp."); return;
        }

        this.currentTargetItem = item;
        
        this.dsaSystemData.skills = { "body": {}, "social": {}, "nature": {}, "knowledge": {}, "trade": {} };
        this.dsaSystemData.combatskills = { "melee": {}, "range": {} };

        const skillPack = game.packs.get("dsa5.skills");
        if (skillPack) {
            const docs = await skillPack.getDocuments();
            docs.forEach(doc => {
                if (doc.type === "skill") {
                    const catId = doc.system?.group?.value;
                    if (catId && this.dsaSystemData.skills[catId]) {
                        this.dsaSystemData.skills[catId][doc.name] = doc.name;
                    }
                }
                
                if (doc.type === "combatskill") {
                    const typeValue = doc.system?.weapontype?.value;
                    let catId = "melee"; 
                    if (typeValue === 1 || typeValue === "1") catId = "range";

                    if (this.dsaSystemData.combatskills[catId]) {
                        this.dsaSystemData.combatskills[catId][doc.name] = doc.name;
                    }
                }
            });
        }

        const hatChronik = this.currentTargetItem.getFlag("dsa5-artifact-generator", "verzauberungsZaehler") > 0;
        if (hatChronik) {
            const doPurge = await Dialog.confirm({
                title: "Gegenstand freibrennen?",
                content: `<p style="text-align: center; font-weight: bold; color: #ff4d4d;"><i class="fas fa-fire fa-2x"></i><br><br>Soll der Gegenstand "${item.name}" ausgebrannt werden?</p>`,
                yes: () => true, no: () => false, defaultYes: false
            });

            if (doPurge) {
                const effectIds = Array.from(this.currentTargetItem.effects).filter(e => e.getFlag("dsa5-artifact-generator", "isGenerated")).map(e => e.id);
                if (effectIds.length > 0) await this.currentTargetItem.deleteEmbeddedDocuments("ActiveEffect", effectIds, { hook: false, render: true });
                await this.currentTargetItem.update({ "system.gmdescription.value": "", "flags.dsa5-artifact-generator.verzauberungsZaehler": 0 });
                this.close(); return;
            }
        }

        this.render();
    } catch (err) { console.error(err); }
  }

  _saveCurrentState() {
    const html = this.element;
    if (!this.currentTargetItem) return;
    const nameInput = html.querySelector('input[name="itemName"]');
    const priceInput = html.querySelector('input[name="artifactPrice"]');
    if (nameInput) this.currentTargetItem.name = nameInput.value;
    if (priceInput) this.currentTargetItem.system.price.value = Math.max(0, parseFloat(priceInput.value) || 0);

    this.uiState.activeCategory = html.querySelector('.source-category-select')?.value || "profan";
    this.uiState.domainProfane = html.querySelector('input[name="domainProfane"]')?.value || "";
    this.uiState.domainGeweiht = html.querySelector('.god-select')?.value || "";
    this.uiState.domainDaemonisch = html.querySelector('.daemon-select')?.value || "";
    this.uiState.isPermanent = html.querySelector('input[name="isPermanent"]')?.checked || false;
    this.uiState.charges = parseInt(html.querySelector('input[name="charges"]')?.value) || 0;
  }

  async _transformTargetItem() {
    if (!this.currentTargetItem) return;
    const html = this.element;
    const newName = html.querySelector('input[name="itemName"]').value.trim() || this.currentTargetItem.name;
    const isPermanent = !html.querySelector('input[name="isPermanent"]').checked; 
    const charges = isPermanent ? 0 : (parseInt(html.querySelector('input[name="charges"]').value) || 0);
    const cat = this.uiState.activeCategory;
    let finalDomainLabel = "";

    if (cat === "profan") finalDomainLabel = `<span>${this.uiState.domainProfane || "Profan"}</span>`;
    else if (cat === "magisch") finalDomainLabel = `<b style="color: #00b0ff;">Magisch</b>`;
    else if (cat === "geweiht") {
        let d = this.dsaSystemData.geweihteTraditionen[this.uiState.domainGeweiht];
        finalDomainLabel = d ? `<b style="color: #ffd700;">${d.name}</b> <span style="font-size:0.9em; color:#ffd700;">(${d.info.replace("Aspekte: ", "")})</span>` : "Geweiht";
    } else if (cat === "daemonisch") {
        let d = this.dsaSystemData.daemonischeDomänen[this.uiState.domainDaemonisch];
        finalDomainLabel = d ? `<b style="color: #bf55ec;">${d.name}</b> <span style="font-size:0.9em; color:#bf55ec;">(${d.features})</span>` : "Dämonisch";
    }

    const inGameDate = this._getInGameDate();
    const currentVerzauberungsAnzahl = this.currentTargetItem.getFlag("dsa5-artifact-generator", "verzauberungsZaehler") || 0;
    const nextIndex = currentVerzauberungsAnzahl + 1;

    let effectsTextList = []; let activeEffectsToCreate = [];

    this.effectsTable.forEach(row => {
      if (!row.effect) return; 
      let label = row.effect; 
      let dataPath = "";
      let effectMode = CONST.ACTIVE_EFFECT_MODES.ADD;
      let effectValue = String(row.strength);

      if (row.category === "characteristics") { 
          label = this.dsaSystemData.characteristics[row.effect]; 
          dataPath = `system.characteristics.${row.effect}.gearmodifier`; 
      }
      else if (row.category === "derivedAttributes") { 
          label = this.dsaSystemData.derivedAttributes[row.effect]; 
          dataPath = row.effect === "speed" ? `system.status.speed.gearmodifier` : `system.status.${row.effect}.gearmodifier`; 
      }
      else if (row.category === "skills") {
          label = row.effect;
          dataPath = "system.skillModifiers.FW";
          effectMode = CONST.ACTIVE_EFFECT_MODES.CUSTOM;
          
          const prefix = row.strength > 0 ? "+" : "";
          effectValue = `${row.effect} ${prefix}${row.strength}`; 
      }
      else if (row.category === "combatskills") { 
          label = row.effect; 
          dataPath = "system.combatModifiers.FW";
          effectMode = CONST.ACTIVE_EFFECT_MODES.CUSTOM;

          const prefix = row.strength > 0 ? "+" : "";
          effectValue = `${row.effect} ${prefix}${row.strength}`; 
      }

      const displayStr = row.strength > 0 ? `+${row.strength}` : `${row.strength}`;
      effectsTextList.push(`<span style="color:${row.strength > 0 ? '#2e7d32' : '#ff4d4d'}; font-weight:bold;">${label} (${displayStr})</span>`);

      if (dataPath) {
        activeEffectsToCreate.push({
          name: `${label} ${displayStr}`, icon: "icons/svg/upgrade.svg",
          changes: [{ key: dataPath, value: effectValue, mode: effectMode }],
          transfer: true, 
          disabled: false,
          flags: { dsa5: { visibility: { hideOnToken: true, hidePlayers: true } }, "dsa5-artifact-generator": { isGenerated: true } }
        });
      }
    });

    const effectsSummary = effectsTextList.length > 0 ? effectsTextList.join("<br>") : "Keine Modifikatoren";
    
    // ANFORDERUNG 1.1: Wenn der Wert 0 oder die Kategorie profan ist, bleibt die Spalte in der Chronik leer
    const structureText = (charges === 0 || cat === "profan") ? "" : (isPermanent ? "Talisman" : `${charges}`);
    
    let currentGmDescription = String(this.currentTargetItem.system?.gmdescription?.value || "");
    let finalGmDescription = "";

    if (nextIndex > 1 && currentGmDescription.includes("</tbody>")) {
        const newRow = `<tr style="background:${nextIndex % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'transparent'};">
            <td style="padding:5px; border:1px solid #7a7973; text-align:center; font-weight:bold;">#${nextIndex}</td>
            <td style="padding:5px; border:1px solid #7a7973;">${inGameDate}</td>
            <td style="padding:5px; border:1px solid #7a7973;">${finalDomainLabel}</td>
            <td style="padding:5px; border:1px solid #7a7973; text-align:center;">${structureText}</td>
            <td style="padding:5px; border:1px solid #7a7973; font-size:0.95em;">${effectsSummary}</td>
        </tr>`;
        finalGmDescription = currentGmDescription.replace("</tbody>", `${newRow}</tbody>`);
    } else {
        const th = `padding:6px; border:1px solid #7a7973; font-weight:bold; color:#e6d7b8;`;
        // ANFORDERUNG 1.2: Tabellenkopf-Überschrift zu "Lad. (max)" umbenannt
        finalGmDescription = `<p style="font-weight:bold; color:#e6d7b8; border-bottom:1px solid #7a1f1f; padding-bottom:3px;">Verzauberungs-Historie (Chronik)</p>
        <table style="width:100%; border-collapse:collapse; border:1px solid #7a7973; font-size:0.9em;">
            <thead><tr style="background:rgba(255,255,255,0.07);"><th style="${th} width:8%;">Nr.</th><th style="${th} width:27%;">Datum</th><th style="${th} width:35%;">Ursache</th><th style="${th} width:12%;">Lad. (max)</th><th style="${th} width:18%;">Effekte</th></tr></thead>
            <tbody><tr><td style="padding:5px; border:1px solid #7a7973; text-align:center; font-weight:bold;">#1</td><td style="padding:5px; border:1px solid #7a7973;">${inGameDate}</td><td style="padding:5px; border:1px solid #7a7973;">${finalDomainLabel}</td><td style="padding:5px; border:1px solid #7a7973; text-align:center;">${structureText}</td><td style="padding:5px; border:1px solid #7a7973; font-size:0.95em;">${effectsSummary}</td></tr></tbody>
        </table>`;
    }

    const updateData = { name: newName, system: { price: { value: parseFloat(html.querySelector('input[name="artifactPrice"]').value) || 0 }, gmdescription: { value: finalGmDescription } }, "flags.dsa5-artifact-generator.verzauberungsZaehler": nextIndex };
    
    // Setze die internen Strukturwerte des Items nur, wenn Ladungen ungleich 0 eingegeben wurden
    if (charges > 0 && cat !== "profan") {
        updateData.system.structure = { value: charges, max: charges };
    }

    try {
      await this.currentTargetItem.update(updateData);
      if (activeEffectsToCreate.length > 0) await this.currentTargetItem.createEmbeddedDocuments("ActiveEffect", activeEffectsToCreate);
      ui.notifications.info(`Erfolgreich geschmiedet.`);
    } catch (e) { console.error(e); }
  }

  _updateInfoBoxes() {
    const html = this.element; const cat = this.uiState.activeCategory;
    const godInfoBox = html.querySelector("#god-info-box");
    if (godInfoBox) {
        const key = html.querySelector(".god-select")?.value || this.uiState.domainGeweiht;
        const data = this.dsaSystemData.geweihteTraditionen[key];
        godInfoBox.value = (data && cat === "geweiht") ? data.info : "";
    }
    const daemonInfoBox = html.querySelector("#daemon-info-box");
    if (daemonInfoBox) {
        const key = html.querySelector(".daemon-select")?.value || this.uiState.domainDaemonisch;
        const data = this.dsaSystemData.daemonischeDomänen[key];
        daemonInfoBox.value = (data && cat === "daemonisch") ? data.info : "";
    }
  }

  _getInGameDate() {
    try {
        const indicator = document.querySelector(".timeIndicator");
        if (indicator?.textContent) {
            const fullText = indicator.textContent.trim();
            return fullText.includes(",") ? fullText.split(",")[1].trim() : fullText;
        }
    } catch (e) {}
    return "1. Praios 1045 BF"; 
  }
}