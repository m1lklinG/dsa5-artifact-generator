import { ArtifactGeneratorApplication } from "./artifact-application.js";

// Wir wechseln auf "setup", damit alle Modul-Strukturen in Foundry definitiv bereitstehen
Hooks.once("setup", () => {
  console.log("DSA5 Artefakt-Generator | Initialisiere Modul-API...");

  const module = game.modules.get("dsa5-artifact-generator");
  
  if (module) {
    module.api = {
      openGenerator: () => {
        if (!game.user.isGM) {
          ui.notifications.warn("Nur der Spielleiter hat Zugriff auf den Artefakt-Generator.");
          return;
        }
        
        new ArtifactGeneratorApplication().render({ force: true });
      }
    };
    console.log("DSA5 Artefakt-Generator | API erfolgreich registriert.");
  } else {
    console.error("DSA5 Artefakt-Generator | Modul-Objekt konnte nicht gefunden werden. Prüfe die ID in der module.json!");
  }
});