# Notification email — fin de partie

Quand Flavien termine le jeu (victoire ou game over), un email est envoyé automatiquement à Nicolas avec les stats de la partie.

## Service : EmailJS

Aucun backend requis — fonctionne 100% côté navigateur via `@emailjs/browser`.

## Variables d'environnement (`.env`)

```
VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxx
VITE_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxxx
VITE_NOTIFICATION_EMAIL=nicolas.hoog@gmail.com
```

## Setup EmailJS (une seule fois)

1. Créer un compte sur **emailjs.com**
2. **Email Services** → Add Service → Gmail → connecter le compte Gmail → copier le `service_id`
3. **Email Templates** → Create Template → coller le HTML ci-dessous → copier le `template_id`
4. **Account** → récupérer la `Public Key`
5. Remplir les 4 variables dans `.env`

## Template HTML (à coller dans EmailJS)

**Sujet :** `🎮 Flavien {{event}} — Score {{score}}`

**Corps :**
```html
<h2>{{event_title}}</h2>
<table>
  <tr><td><b>Joueur</b></td><td>{{player_name}}</td></tr>
  <tr><td><b>Score</b></td><td>{{score}} pokéballs</td></tr>
  <tr><td><b>Niveau atteint</b></td><td>{{level}}</td></tr>
  <tr><td><b>Vies restantes</b></td><td>{{lives}}</td></tr>
  <tr><td><b>Durée</b></td><td>{{duration}}</td></tr>
  <tr><td><b>Parties jouées</b></td><td>{{games_played}}</td></tr>
  <tr><td><b>Nouveau record</b></td><td>{{new_record}}</td></tr>
  <tr><td><b>Difficulté</b></td><td>{{difficulty}}</td></tr>
</table>
```

**Champ "To email" dans EmailJS :** `{{to_email}}`

## Comportement

- Email envoyé une seule fois par partie (flag `game.emailSent`)
- Si les variables `.env` sont absentes → silencieux (rien ne casse)
- Erreur réseau → silencieux (`.catch(() => {})`)
- Fonctionne pour la victoire ET le game over
