const { Wechaty } = require('wechaty');
const urllib = require('urllib');
const cacheMap = new Map();
const bot = new Wechaty({
    name: 'wechat-puppet-wechat', // generate xxxx.memory-card.json and save login data for the next login
});

//  二维码生成
function onScan(qrcode) {
    require('qrcode-terminal').generate(qrcode); // 在console端显示二维码
    const qrcodeImageUrl = [
        'https://wechaty.js.org/qrcode/',
        encodeURIComponent(qrcode),
    ].join('');
    console.log(qrcodeImageUrl);
}

// 登录
async function onLogin(user) {
    console.log(`贴心小助理${ user }登录了`);
}

//登出
function onLogout(user) {
    console.log(`小助手${ user } 已经登出`);
}

bot.on('scan', onScan);
bot.on('login', onLogin);
bot.on('logout', onLogout);
bot.start()
  .then(() => console.log('开始登陆微信'))
  .catch((e) => console.error(e));
bot.on('message',
  async message => {
      if (!message.self() && message.type() === 7) {
          console.log(`Message: ${ message.text() }`, message.type());
          const messageData = message.text().toString().replace('Message:', '')
          const rexp = new RegExp('[a-zA-Z]+')
          const array = rexp.exec(messageData);
          if (!array || array && array.length == 0) {
              return;
          }
          console.log(array[0]);
          const existInfo = Info(array[0].toUpperCase())
          const room = await bot.Room.find({ topic: '币当韭-格局交流' })
          await room.say(existInfo)
      }
  }
)

async function getDirectData() {
    try {
        const a = await urllib.request('https://api.coinmarketcap.com/data-api/v3/cryptocurrency/listing?symbol?start=1&limit=7001&sortBy=market_cap&sortType=desc&convert=USD&cryptoType=all&tagType=all&audited=false&aux=ath,atl,high24h,low24h,num_market_pairs,cmc_rank,date_added,tags,platform,max_supply,circulating_supply,total_supply,volume_7d,volume_30d', { timeout: 99999999 })
        const data = JSON.parse(a.data.toString()).data;
        data.cryptoCurrencyList.map(a => {
            if (cacheMap.has(a.symbol)) {
                return
            }
            cacheMap.set(a.symbol, a);
        })
    } catch (e) {
        console.log('加载失败')
    }
    console.log('加载成功');
}

getDirectData();
setInterval(async function () {
    await getDirectData();
}, 60 * 1000 * 5);

function Info(symbol) {
    const data = cacheMap.get(symbol);
    if (!data) {
        return;
    }
    return `
    名称 ${ data.name }
    标识符 ${ data.symbol }
    当前价格 ${ data.quotes[0].price.toFixed(4) }$
    排名 ${ data.cmcRank }
    交易对 ${ data.marketPairCount }
    24小时最高 ${ data.high24h.toFixed(4) }$
    24小时最低 ${ data.low24h.toFixed(4) }$
    1小时变动 ${ data.quotes[0].percentChange1h.toFixed(4) }%
    24小时变动 ${ data.quotes[0].percentChange24h.toFixed(4) }%
    7天变动 ${ data.quotes[0].percentChange7d.toFixed(4) }%
    `
}
