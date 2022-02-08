const express = require('express')
const puppeteer = require('puppeteer')
const app = express()
const port = 3000
const Sentiment = require('sentiment');
const sentiment = new Sentiment();
function removeItems(arr, item) {
    for ( var i = 0; i < item; i++ ) {
        arr.shift();
    }
    return arr
}
function remove_linebreaks(str ) {
  return str.replace( /[\r\n]+/gm, "" );
}
async function adjust_array(data){
  news_object_array = []
  data = await removeItems(data, 33);
  data.splice(271, 1);
  let filtered = data.filter(function (el) {
    return el != "";
  });
  for(let i=0; i<filtered.length ; i++){
    filtered[i] = remove_linebreaks(filtered[i])
    const news_object = {
      date: filtered[i],
      title: filtered[i+1]
    }
    i+=1
  news_object_array.push(news_object)
  }
  return news_object_array
}
async function getNews(){
    const browser = await puppeteer.launch({})
    const page = await browser.newPage()
    await page.setExtraHTTPHeaders({
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.131 Safari/537.36',
        'upgrade-insecure-requests': '1',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language': 'en-US,en;q=0.9,en;q=0.8'
    })
    await page.goto('https://finviz.com/news.ashx')
    let data = await page.evaluate(() => {
        const tds = [...Array.from(document.querySelectorAll('table tr td'))]
        return tds.map(td => td.innerText)
      });
    data = await adjust_array(data)
    browser.close()
    return data
}
async function calc(data){
  new_score_array = []
  for(let i=0; i< data.length; i++){
    let result = sentiment.analyze(data[i].title)
    data[i].score = result['score']
    new_score_array.push(data[i])
  }
  return new_score_array
}
app.get('/', async (req, res) => {
    let data = await getNews()
    data = await calc(data)
	  res.send(data)
})

app.listen(port, () => {
	console.log('Listening on *:3000')
})
