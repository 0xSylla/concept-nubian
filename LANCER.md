# Belle Nubian — site vitrine — lancer en local

## Lancer

Ouvrir un terminal (PowerShell) et copier :

```powershell
cd "C:\Users\DELL02\Desktop\Personal Builds\Website critics\stitch_french_language_project"
python scripts/serve_tournage.py 8095
```

Puis ouvrir : **http://127.0.0.1:8095/code.html**

Arrêter : `Ctrl + C` dans le terminal.

### Adresses utiles

| Page | Adresse |
|---|---|
| Accueil | http://127.0.0.1:8095/code.html |
| Tous les produits | http://127.0.0.1:8095/produits.html |

### Après une modification

`produits.html` et le CSS sont générés : après avoir modifié `code.html`, `src/` ou la config Tailwind, lancer une fois :

```powershell
npm run build
```

(la première fois : `npm install`).

## Mode tournage (ordinateur + téléphone qui défilent ensemble)

Ce serveur est déjà ouvert au réseau local. Ordinateur et téléphone sur le **même Wi-Fi**.

1. Trouver l'adresse de l'ordinateur : `ipconfig` (ligne « Adresse IPv4 », ex. 192.168.1.23).
2. **Téléphone (pilote, c'est lui qu'on fait défiler)** : `http://192.168.1.23:8095/code.html?tournage=pilote`
3. **Ordinateur (suit le téléphone)** : `http://127.0.0.1:8095/code.html?tournage=suit`
4. Pour sortir du mode tournage : ajouter `?tournage=off` à l'adresse.

On peut inverser les rôles (l'ordinateur pilote, le téléphone suit).
Si Windows demande l'autorisation du pare-feu pour Python, accepter pour les réseaux privés.
