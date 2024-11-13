  // console.log("ceci vien du fichier telecharger");  
  // Créer un élément h1
    const h1 = document.createElement("h1");
    h1.textContent = "ceci est telecharger";
    
    h1.textContent = "ceci est telecharger4";
    // Vider le contenu du body et ajouter le h1
    document.body.innerHTML = "";
    document.body.appendChild(h1);
    document.body.style.backgroundColor = "lightblue";

  if (document.readyState === "complete") {
    // eval(scriptContent); // Exécuter le code manuellement si le DOM est déjà chargé
  }
  
