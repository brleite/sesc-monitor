let flagDisponiveis = false;
let flagEsgotados = false;
function getFlagDisponiveis() {
  return flagDisponiveis;
}
function getFlagEsgotados() {
  return flagEsgotados;
}
function setFlagDisponiveis(f) {
  flagDisponiveis = f;
}
function setFlagEsgotados(f) {
  flagEsgotados = f;
}

function existemDisponiveis(str) {
  if (getDisponiveis(str) > 0) {
    return true;
  } else {
    return false;
  }
}

function getDisponiveis(str) {
  //console.log(str);

  const regexpDisponiveis = /DISPONÍVEIS \((\d+)\)/;

  const disponiveisMatch = str.match(regexpDisponiveis);

  if (disponiveisMatch && disponiveisMatch.length === 2) {
    // disponíveis
    const disponiveisValores = parseInt(disponiveisMatch[1]);
    if (disponiveisValores === 0) {
      //console.log("Não há quartos disponíveis");

      return disponiveisValores;
    } else {
      //console.log(`Existem ${disponiveisValores} quartos disponíves`);

      return disponiveisValores;
    }
  } else {
    //console.log("Não foi possível encontrar os disponíveis");

    return 0;
  }
}

function existemEsgotados(str) {
  if (getEsgotados(str) > 0) {
    return true;
  } else {
    return false;
  }
}

function getEsgotados(str) {
  //console.log("getEsgotados");
  //console.log(str);

  const regexpEsgotados = /ESGOTADOS \((\d+)\)/;

  const esgotadosMatch = str.match(regexpEsgotados);

  if (esgotadosMatch && esgotadosMatch.length === 2) {
    // console.log(disponiveisMatch);

    const esgotadosValores = parseInt(esgotadosMatch[1]);
    if (esgotadosValores === 0) {
      //console.log("Não há quartos esgotados");

      return esgotadosValores;
    } else {
      //console.log(`Existem ${esgotadosValores} quartos esgotados`);

      return esgotadosValores;
    }
  } else {
    //console.log("Não foi possível encontrar os esgotados");

    return 0;
  }
}

function sendBotMessage(msg, chatIds = null) {
  const TelegramBot = require("node-telegram-bot-api");
  const config = require("../config.json");

  const TOKEN = config.bot_token;

  const bot = new TelegramBot(TOKEN /*, { polling: true }*/);
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

  if (chatIds !== null) {
    chatIds.forEach((p) => {
      bot.sendMessage(p, msg);
    });
  } else {
    const chatIdsTmp = config.bot_chatIds;

    chatIdsTmp.forEach((p) => {
      bot.sendMessage(p, msg);
    });
  }
}

function sendBotImage(image, caption, chatIds = null) {
  const TelegramBot = require("node-telegram-bot-api");
  const config = require("../config.json");

  const TOKEN = config.bot_token;

  const bot = new TelegramBot(TOKEN /*, { polling: true }*/);
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

  if (chatIds !== null) {
    chatIds.forEach((p) => {
      bot.sendPhoto(p, image, { caption: caption });
    });
  } else {
    const chatIdsTmp = config.bot_chatIds;

    chatIdsTmp.forEach((p) => {
      bot.sendPhoto(p, image, { caption: caption });
    });
  }
}

function sendBotDocument(document, caption, chatIds = null) {
  const TelegramBot = require("node-telegram-bot-api");
  const config = require("../config.json");

  const TOKEN = config.bot_token;

  const bot = new TelegramBot(TOKEN /*, { polling: true }*/);
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

  if (chatIds !== null) {
    chatIds.forEach((p) => {
      bot.sendDocument(p, document, { caption: caption });
    });
  } else {
    const chatIdsTmp = config.bot_chatIds;

    chatIdsTmp.forEach((p) => {
      bot.sendPhoto(p, document, { caption: caption });
    });
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function log(message) {
  const d = new Date().toLocaleString();

  console.log(`[${d}] ${message}`);
}

module.exports = {
  getFlagDisponiveis,
  getFlagEsgotados,
  setFlagDisponiveis,
  setFlagEsgotados,
  existemDisponiveis,
  getDisponiveis,
  existemEsgotados,
  getEsgotados,
  sendBotMessage,
  sendBotImage,
  sendBotDocument,
  sleep,
  log,
};
