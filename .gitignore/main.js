const Discord = require('discord.js')
//const music = require('discord.js-music-v11')
//const cons = require('consolidate')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const express = require('express')
const app = express()

const adapter = new FileSync('database.json')
const storeadapter = new FileSync('store.json')
const db = low(adapter)
const storedb = low(storeadapter)

db.defaults({histoires: [], xp: [], inventory: []}).write()

// DEBUT PARAMETRES HEROKU
app.set('port', (process.env.PORT || 5000))

app.listen(app.get('port'), function () {
  console.log(`Bot en fonctionnement sur le port ${app.get('port')}`)
})


var prefix = ('/')
var bot = new Discord.Client()
var randnum = 0

var storynumber = db.get('histoires').size().value()

bot.on('ready', () => {
  bot.user.setPresence({game: {name: '[-/help] Bot Tuto', type: 0}})
  console.log('Bot ready !')
  //music(bot)
})

bot.login(process.env.TOKEN)

bot.on('guildMemberAdd', member => {
  let role = member.guild.roles.find('name', 'PIZZA')
  member.guild.channels.find('name', 'général').send(`:hamburger: ${member.user.username} vient de rejoindre la famille des tutos !`)
  member.addRole(role)
})

bot.on('guildMemberRemove', member => {
  member.guild.channels.find('name', 'général').send(`:ski: ${member.user.username} vient de quitter la famille, qu'il repose en paix !`)
})

bot.on('message', message => {

  //console.log(prefix)

  var msgauthor = message.author.id

  if (message.author.bot) return

  if (!db.get('inventory').find({user: msgauthor}).value()) {
    db.get('inventory').push({user: msgauthor, items: 'Vide'}).write()
  }

  if (!db.get('xp').find({user: msgauthor}).value()) {
    db.get('xp').push({user: msgauthor, xp: 1}).write()
  } else {
    var userxpdb = db.get('xp').filter({user: msgauthor}).find('xp').value()
    //console.log(userxpdb)
    var userxp = Object.values(userxpdb)
    //console.log(userxp)
    console.log(`Nombre d'xp : ${userxp[1]}`)
    db.get('xp').find({user: msgauthor}).assign({user: msgauthor, xp: userxp[1] += 1}).write()
  }

  if (!message.content.startsWith(prefix)) return
  var args = message.content.substring(prefix.length).split(' ')

  switch (args[0].toLowerCase()) {

    // enregistre une histoire
    case 'newstory':
      var value = message.content.substr(10)
      var author = message.author.username.toString()
      var number = db.get('histoires').map('id').value()
      //var storyid = number + 1;
      console.log(value)
      message.reply('Ajout de l\'histoire a la base de données')

      db.get('histoires')
        .push({story_value: value, story_author: author})
        .write()
      break

    // lire une histoire
    case 'tellstory' :

      //story_random();
      //console.log(randnum);

      var story = db.get(`histoires[${randnum}].story_value`).toString().value()
      var author_story = db.get(`histoires[${randnum}].story_author`).toString().value()
      console.log(story)
      message.channel.send(`Voici l'histoire : ${story} (Histoire de ${author_story})`)

      break

    // ping pong
    case 'ping':
      message.reply('pong')
      console.log('ping pong')
      break

    // Kick user
    case 'kick':
      if (!message.channel.permissionsFor(message.member).has('KICK_MEMBERS')) {
        message.reply('Tu n\'as pas le droit de kick ! ;)')
      } else {
        var memberkick = message.mentions.members.first()
        console.log(memberkick)
        console.log(message.guild.member(memberkick).kickable)
        if (!memberkick) {
          message.reply('L\'utilisateur n\'existe pas !')
        } else {
          if (!message.guild.member(memberkick).kickable) {
            message.reply('Utilisateur impossible a kick !')
          } else {
            message.guild.member(memberkick).kick().then((member) => {
              message.channel.send(`${member.displayName} a été kick ! Qu'il prenne ça dans sa gueule !`)
            }).catch(() => {
              message.channel.send('Kick Refusé !')
            })
          }
        }
      }
      break

    // ban user
    case 'ban':
      if (!message.channel.permissionsFor(message.member).has('BAN_MEMBERS')) {
        message.reply('Tu n\'as pas le droit de ban ! ;)')
      } else {
        var memberban = message.mentions.members.first()
        //console.log(memberban)
        //console.log(message.guild.member(memberban).bannable)
        if (!memberban) {
          message.reply('L\'utilisateur n\'existe pas !')
        } else {
          if (!message.guild.member(memberban).kickable) {
            message.reply('Utilisateur impossible a ban !')
          } else {
            message.guild.member(memberban).ban().then((member) => {
              message.channel.send(`${member.displayName} a été banni ! Qu'il prenne ça dans sa gueule !`)
            }).catch(() => {
              message.channel.send('Ban Refusé !')
            })
          }
        }
      }
      break

    // Liste items
    case 'store' :
      var store_embed = new Discord.RichEmbed()
        .setTitle('TutoBot Store - Money utilisé : xp')
        .setDescription('Salut, ici tu trouveras des items et des badges a acheter !')
        .addField('Items:', 'Frite de mémé [2XP][ID: item0001] Description: Ah les frites de mémé, ça doit faire des mois que je n\'en ai pas mangé !')
      message.channel.send({embed: store_embed})
      console.log('Items store Demandée !')
      break

    // Achat item
    case 'buyitem' :
      var itembuying = message.content.substr(9)
      if (!itembuying) {
        itembuying = 'Indeterminé'
      } else {
        console.log(`StoreLogs: Demande d'achat d'item ${itembuying}`)
        if (storedb.get('store_items').find({itemID: itembuying}).value()) {
          var info = storedb.get('store_items').filter({itemID: itembuying}).find('name', 'desc').value()
          var iteminfo = Object.values(info)
          console.log(iteminfo)
          var buy_embed = new Discord.RichEmbed()
            .setTitle('TutoBot Store - Facture d\'achat')
            .setDescription('*Attention, ceci est une facture d\'achat ! Merci de votre achat.*')
            .addField('infos', `*ID:* ***${iteminfo[0]}***\n*Nom:* ***${iteminfo[1]}***\n*Description:* ***${iteminfo[2]}***\n*Prix:* ***${iteminfo[3]}***`)

          message.author.send({embed: buy_embed})
          console.log('Facture envoyer')

          var useritem = db.get('inventory').filter({user: msgauthor}).find('items').value()
          var itemsdb = Object.values(useritem)
          var userxpdb = db.get('xp').filter({user: msgauthor}).find('xp').value()
          var userxp = Object.values(userxpdb)

          if (userxp[1] >= iteminfo[3]) {
            message.reply(`***Information: *** Votre achat (${iteminfo[1]}) a été accépté. Retrait de ${iteminfo[3]} XP`)
            if (!db.get('inventory').filter({user: msgauthor}).find({items: 'Vide'}).value()) {
              console.log('Inventaire pas vide !')
              db.get('xp').filter({user: msgauthor}).find('xp').assign({
                user: msgauthor,
                xp: userxp[1] -= iteminfo[3]
              }).write()
              db.get('inventory').filter({user: msgauthor}).find('items').assign({
                user: msgauthor,
                items: itemsdb[1] + ' , ' + iteminfo[1]
              }).write()
            } else {
              console.log('Inventaire vide !')
              db.get('xp').filter({user: msgauthor}).find('xp').assign({
                user: msgauthor,
                xp: userxp[1] -= iteminfo[3]
              }).write()
              db.get('inventory').filter({user: msgauthor}).find('items').assign({
                user: msgauthor,
                items: iteminfo[1]
              }).write()
            }
          } else {
            message.reply('Erreur ! Achat impossible, nombre d\'xp insufisant !')
          }
        }
      }
      break

    // Affiche les stats
    case 'stats' :
      var userXpDB = db.get('xp').filter({user: msgauthor}).find('xp').value()
      var userXp = Object.values(userXpDB)
      var stats_embed = new Discord.RichEmbed()
        .setTitle(`Stats Utilisateur : ${message.author.username}`)
        .addField('xp', `${userXp[1]} XP`, true)
      message.author.send({embed: stats_embed})
      console.log('Demande stat XP en mp')
      break

  }

  // messages multiple
  if (message.content === 'Comment vas-tu TutoBot ?') {
    random()

    if (randnum === 1) {
      message.reply('(Réponse numéro 1), Merci je vais très bien !')
      console.log(randnum)
    }

    if (randnum === 2) {
      message.reply('(Réponse numéro 2), Je ne vais pas très bien merci de te soucier de moi !')
      console.log(randnum)
    }
  }

  // affiche l'aide
  if (message.content === prefix + 'help') {
    var help_embed = new Discord.RichEmbed()
      .setColor('#D9F200')
      .addField('Commandes du bot !', ' -/help : Affiche les commandes du bot !')
      .addField('Interaction', 'ping : Le bot répond pong !')
      .addField('Histoire', '-/newstory : Enregistre une histoire !\n' +
        '-/tellstory : Ecrit l\'histoire')
      .addField('Membre', '-/xpstat : Affiche l\'éxperiance du membre !')
      .setFooter('C\'est tout pour ce embed !')
    message.channel.send(help_embed)
    console.log('Commande Help demandée !')
  }

  // affiche l'xp
  if (message.content === prefix + 'xpstat') {
    var xp = db.get('xp').filter({user: msgauthor}).find('xp').value()
    var xpfinal = Object.values(xp)
    var xp_embed = new Discord.RichEmbed()
      .setTitle(`XP de ${message.author.username}`)
      .setDescription('Voici tout vos xp monsieur !')
      .addField('XP :', `${xpfinal[1]} xp`)
    message.channel.send({embed: xp_embed})
    console.log('Demande XP générale')
  }

})

function story_random(min, max) {
  min = Math.ceil(0)
  max = Math.floor(storynumber)
  randnum = Math.floor(Math.random() * (max - min + 1) + min)
}

function random(min, max) {
  min = Math.ceil(0)
  max = Math.floor(3)
  randnum = Math.floor(Math.random() * (max - min + 1) + min)
}
