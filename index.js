const puppeteer = require("puppeteer");
const config = require("./config.json");
const utils = require("./utils/utils");
const fs = require('fs');
const diff_match_patch = require('diff-match-patch');
const jsdiff = require('./utils/jsdiff');
const diff = require('node-htmldiff');
const { create } = require("domain");

function createDateFromString(dateStr) {
  let parts = dateStr.split("/");
  return new Date(parts[2], parts[1] - 1, parts[0]);
}

async function operacaoKeyboard(page, seletor, valor) {
  utils.log('inicio operação keyboard');
  utils.log(seletor);

  await page.waitForSelector(seletor);
  await page.focus(seletor);
  utils.log("wait for selector")
  await page.keyboard.type(valor)
  utils.log("keyboard type")

  utils.log('fim operação keyboard');
}

async function operacaoKeyboardSpecial(page, valor) {
  utils.log('inicio operação keyboardSpecial');

  await await page.keyboard.press(valor);

  utils.log('fim operação keyboardSpecial');
}



async function operacaoClick(page, seletor) {
  utils.log('inicio operação click');
  utils.log(seletor);

  await page.waitForSelector(seletor);
  utils.log("wait for selector")
  await page.click(seletor);
  utils.log("click selector")

  utils.log('fim operação click');
}

async function operacaoClickEvaluate(page, seletor, delay) {
  utils.log('inicio operação clickEvaluate');
  utils.log(seletor);

  await page.waitForSelector(seletor);
  utils.log("wait for selector")

  await page.evaluate(([seletor]) => {
      document.querySelector(seletor).click();

  }, [seletor]);

  if (delay) {
    await page.waitForTimeout(delay);
  }

  utils.log('fim operação clickEvaluate');
}

async function operacaoSleep(page, delay) {
  utils.log('inicio operação operacaoSleep');

  if (delay) {
    await page.waitForTimeout(delay);
  }

  utils.log('fim operação operacaoSleep');
}

async function operacaoClickEvaluateList(page, seletor, valor, delay) {
  utils.log('inicio operação clickEvaluateList');
  utils.log(seletor);

  await page.waitForSelector(seletor);
  utils.log("wait for selector")

  element = await page.evaluate(async ([seletor, valor]) => {
      nodeList = document.querySelectorAll(seletor);
      for (let i = 0; i < nodeList.length; i++) {
        if (nodeList[i].textContent.trim() === valor) {
          await nodeList[i].click();
          console.log(nodeList[i])

          return Object.getOwnPropertyNames(nodeList[i]);
        }
      }
  }, [seletor, valor]);

  utils.log(element);

  if (delay) {
    await page.waitForTimeout(delay);
  }

  utils.log('fim operação clickEvaluateList');
}

async function operacaoWait(page, seletor) {
  utils.log('inicio operação wait');
  utils.log(seletor);

  const operacaoSeletor = await page.waitForSelector(seletor);
  utils.log("wait for selector")

  utils.log('fim operação wait');
}

async function obterClassesData(page, seletor, day, month, year) {
  await page.waitForSelector(seletor);
  const classes = await page.evaluate(([day, month, year]) => {
    seletorDataTmp = 'td[data-month="' + month + '"][data-year="' + year + '"]'
    console.log(seletorDataTmp);

    const nodeList = document.querySelectorAll(seletorDataTmp);
    for (let i = 0; i < nodeList.length; i++) {
      if (nodeList[i].textContent.trim() === day) {
        classesTmp = nodeList[i].getAttribute('class');

        return nodeList[i].getAttribute('class');
      }
    }

    return '';
  }, [day, month, year]);

  return classes;
}

async function operacaoVerificarDatas(
  page,
  notify,
  bot_chatIds,
  unidade,
  dataInicial,
  dataFinal) {

  utils.log('inicio operação verificarDatas');
  utils.log(dataInicial);
  utils.log(dataFinal);

  let startDate = createDateFromString(dataInicial);
  let endDate = createDateFromString(dataFinal);

  for(let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    dataTmp = new Date(date);
    utils.log(dataTmp);

    let day = '' + dataTmp.getDate();
    let month = '' + dataTmp.getMonth();
    let year = '' + dataTmp.getFullYear();

    let classes = await obterClassesData(page, '#ui-datepicker-div', day, month, year);

    if (classes.includes('dataIndisponivel')) {
      utils.log('Período indisponível');

      return;
    }
  }
  msg = 'Período disponível no ' + unidade + ": " + dataInicial + " - " + dataFinal;
  utils.log(msg);
  if (notify) {
    utils.sendBotMessage(msg, bot_chatIds);
  }

  utils.log('fim operação verificarDatas');
}

async function operacaoCompare(page,
                         url,
                         notify,
                         bot_chatIds,
                         seletor,
                         verificarSomenteAreaSelecionada,
                         arquivoSiteAtualizado,
                         arquivoSiteAntesAtualizacao,
                         arquivoSiteAlteracoes,
                         arquivoSiteAlteracoesScreenshot) {
  utils.log('inicio operação compare');
  utils.log(seletor);

  const operacaoSeletor = await page.waitForSelector(seletor);
  utils.log("wait for selector")

  await compare(page,
          url,
          notify,
          bot_chatIds,
          arquivoSiteAtualizado,
          arquivoSiteAntesAtualizacao,
          arquivoSiteAlteracoesScreenshot,
          arquivoSiteAlteracoes,
          verificarSomenteAreaSelecionada,
          seletor);

  utils.log('fim operação compare');
}

async function compare(page,
                 url,
                 notify,
                 bot_chatIds,
                 arquivoSiteAtualizado,
                 arquivoSiteAntesAtualizacao,
                 arquivoSiteAlteracoesScreenshot,
                 arquivoSiteAlteracoes,
                 verificarSomenteAreaSelecionada,
                 seletor) {
  let novoSite;
  if (verificarSomenteAreaSelecionada) {
    const operacaoSeletor = await page.waitForSelector(seletor);

    novoSite = await operacaoSeletor.evaluate(domElement => {
      const novoSiteTmp = domElement.innerHTML;

      return novoSiteTmp;
    });
  } else {
    novoSite = await page.content();
  }

  var beautify_html = require('js-beautify').html;
  novoSite = beautify_html(novoSite, { indent_size: 2 })

  utils.log("Novo Site obtido");

  if (fs.existsSync(arquivoSiteAtualizado)) {
    const currentSite = fs.readFileSync(arquivoSiteAtualizado, 'utf8');

    utils.log("Site atual obtido");

    if (novoSite && currentSite && currentSite != novoSite) {
      const msg = `Houve atualização no site ${url}`
      utils.log(msg)

      /* const diff = new diff_match_patch.diff_match_patch();
      const diffs = diff.diff_main(currentSite, novoSite);
      diff.diff_cleanupSemantic(diffs)
      const alteracoes = diff.diff_prettyHtml(diffs); */
      // const alteracoes = jsdiff.diffString(currentSite, novoSite);
      const alteracoes = diff(currentSite, novoSite);

      if (notify) {
        utils.sendBotMessage(msg, bot_chatIds);
      }

      fs.writeFileSync(arquivoSiteAtualizado, novoSite);
      fs.writeFileSync(arquivoSiteAntesAtualizacao, currentSite);

      if (verificarSomenteAreaSelecionada === true) {
        await page.evaluate(async ([seletor, newInnerHTML]) => {
          let dom = document.querySelector(seletor);
          dom.innerHTML = newInnerHTML;
        }, [seletor, alteracoes]);
      } else {
        await page.setContent(alteracoes)
      }

      await page.addStyleTag({content: 'del {background-color: tomato;}'})
      await page.addStyleTag({content: 'ins {background-color: lightgreen;}'})

      await page.screenshot({
        path: arquivoSiteAlteracoesScreenshot,
        fullPage: true,
        type: "jpeg",
        quality: 100
      });

      siteAlteracoes = await page.content();
      fs.writeFileSync(arquivoSiteAlteracoes, siteAlteracoes);

      if (notify && arquivoSiteAlteracoes) {
        utils.sendBotDocument(arquivoSiteAlteracoes, "HTML com as alterações", bot_chatIds);
      }

      if (notify && arquivoSiteAlteracoesScreenshot) {
        utils.sendBotImage(arquivoSiteAlteracoesScreenshot, "Alterações", bot_chatIds);
      }
    } else {
      const msg = `Não Houve atualização no site ${url}`
      utils.log(msg)
    }
  } else {
    utils.log(`Arquivo inexistente: ${arquivoSiteAtualizado}. Criando um arquivo inicial.`)
    fs.writeFileSync(arquivoSiteAtualizado, novoSite);
  }
}

(async () => {
  const browser = await puppeteer.launch({
    // executablePath: "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    headless: false,
    slowMo: 50, // slow down by ms
    // devtools: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-infobars',
      '--window-position=0,0',
      '--ignore-certifcate-errors',
      '--ignore-certifcate-errors-spki-list',
      '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"'
      ],
  });
  const page = await browser.newPage();

  page.setDefaultNavigationTimeout(300000);

  // Mostra console para o evaluate
  page.on("console", (consoleObj) => {
    if (consoleObj.type() === "log") {
      utils.log(consoleObj.text());
    }
  });

  const urls = config.urls;

  utils.log("Iniciando chamadas");

  try {
    for (let p of urls) {
      utils.log(`URL: ${p.url}`);
      utils.log(`SELETOR: ${p.seletor}`);
      utils.log(`DELAY: ${p.delay}`);

      if (!p.enabled) {
        utils.log("Verficação desabilitada.");

        continue;
      }

      await Promise.all([
        page.goto(p.url),
        page.waitForNavigation({ waitUntil: "networkidle0" }),
      ]);

      if (p.delay) {
        await utils.sleep(p.delay);
      }

      utils.log("goto url");
      pageTmp = await page.content();

      let verificarSomenteAreaSelecionada = false;
      let seletorComparacao;
      let novoSite;
      if (p.operacoes && p.operacoes.length > 0) {
        utils.log('inicio operações')
        for (let operacao of p.operacoes) {
          if (operacao.tipo === 'click') {
            await operacaoClick(page, operacao.seletor);
          } else if (operacao.tipo === 'clickEvaluate') {
            await operacaoClickEvaluate(page, operacao.seletor, operacao.delay);
          } else if (operacao.tipo === 'clickEvaluateList') {
            await operacaoClickEvaluateList(page, operacao.seletor, operacao.valor, operacao.delay);
          } else if (operacao.tipo === 'wait') {
            await operacaoWait(page, operacao.seletor);
          } else if (operacao.tipo === 'sleep') {
            await operacaoSleep(page, operacao.delay);
          } else if (operacao.tipo === 'verificarDatas') {
            await operacaoVerificarDatas(
              page,
              config.notify,
              p.bot_chatIds,
              operacao.unidade,
              operacao.dataInicial,
              operacao.dataFinal);
          } else if (operacao.tipo === 'compare') {
            await operacaoCompare(page,
                            p.url,
                            config.notify,
                            p.bot_chatIds,
                            operacao.seletor,
                            operacao.verificarSomenteAreaSelecionada,
                            operacao.arquivoSiteAtualizado,
                            operacao.arquivoSiteAntesAtualizacao,
                            operacao.arquivoSiteAlteracoes,
                            operacao.arquivoSiteAlteracoesScreenshot);
          } else if (operacao.tipo === 'keyboard') {
            await operacaoKeyboard(page, operacao.seletor, operacao.valor);
          } else if (operacao.tipo === 'keyboardSpecial') {
            await operacaoKeyboardSpecial(page, operacao.valor);
          }
        }
      } else {
        await compare(page,
          p.url,
          config.notify,
          p.bot_chatIds,
          p.arquivoSiteAtualizado,
          p.arquivoSiteAntesAtualizacao,
          p.arquivoSiteAlteracoesScreenshot,
          p.arquivoSiteAlteracoes,
          p.verificarSomenteAreaSelecionada,
          p.seletor);
      }
    }

    setTimeout(async () => {
      await browser.close();

      utils.log("Fim");
    }, 2000);
  } catch (e) {
    utils.log(e);
    await browser.close();
  }
})();